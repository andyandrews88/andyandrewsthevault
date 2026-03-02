

# Plan: Enhanced Profile Page + Performance & Real-Time Audit

## Part 1: Full User Profile Page (CoachRx-style)

**Current state:** Profile page only has display name + email. No avatar, no age, gender, weight, birthday, timezone, etc.

**What to build:**
- Expand `ProfileSettings.tsx` into a full profile page matching the CoachRx screenshot:
  - **Avatar** with upload (use existing `vault-files` storage bucket with a `avatars/` folder)
  - **First Name / Last Name** (split display_name or add new columns)
  - **Email** (read-only, already there)
  - **Sex** (dropdown: Male/Female/Other/Prefer not to say)
  - **Weight** (number input)
  - **Age** (computed from birthday, read-only)
  - **Unit Preference** (Metric/Imperial select)
  - **Birthday** (date picker)
  - **Timezone** (select from common timezones)
  - **Location** (text input)
  - **Height** (number input)

**Database migration:** Add columns to `user_profiles`:
- `first_name text`, `last_name text`, `sex text`, `weight_kg numeric`, `birthday date`, `unit_preference text default 'metric'`, `timezone text`, `location text`, `height_cm numeric`

**Admin reflection:** The `admin-user-profile` edge function already fetches `user_profiles.*`, so all new fields automatically appear in the admin view. Update `AdminUserProfile.tsx` to display these fields in a CoachRx-style layout with the same two-column grid.

**Avatar upload flow:**
1. User clicks "Choose an image" → file picker
2. Upload to `vault-files` bucket at `avatars/{userId}.{ext}`
3. Get public URL → save to `user_profiles.avatar_url`
4. Display in Navbar, profile page, community posts, admin views

**Storage:** Need to create an RLS policy on `vault-files` bucket allowing users to upload/read their own avatar files, or create a dedicated `avatars` public bucket.

## Part 2: Performance & Real-Time Audit

**Issues identified from codebase analysis:**

### A. No code splitting — all pages load eagerly
Every page is imported at top of `App.tsx`. Heavy pages like `AdminDashboard`, `AdminUserProfile`, `Nutrition`, `VaultPage` all load on first visit regardless of route. **Fix:** Use `React.lazy` + `Suspense` for all route components.

### B. No real-time data sync after admin actions
When admin adds a workout/exercise via the calendar drawer, data only appears on client side after refresh. Root cause: the stores (`workoutStore`, `programStore`) fetch data once and cache it with no invalidation mechanism. **Fixes:**
- Enable Supabase Realtime on `workouts`, `workout_exercises`, `exercise_sets` tables
- Add realtime subscriptions in `workoutStore` that listen for INSERT/UPDATE/DELETE and auto-refetch
- After admin saves in `CalendarWorkoutDrawer`, the client's workout store picks up changes instantly

### C. Admin check delays every protected page by 300ms
`useAdminCheck` has a `setTimeout(checkAdminRole, 300)` — unnecessary delay on every admin page load. **Fix:** Remove the timeout, call immediately.

### D. Navbar refetches profile on every render
`Navbar` calls `fetchName()` in a `useEffect` on `[user]` but doesn't cache it. If `user` reference changes (common with auth state), it refetches. **Fix:** Store display_name + avatar_url in a lightweight profile store or cache in authStore.

### E. QueryClient has no staleTime configured
The `QueryClient` in `App.tsx` uses defaults (staleTime: 0), causing every component using `useQuery` to refetch on mount. **Fix:** Set sensible defaults: `staleTime: 30_000, gcTime: 300_000`.

### F. Stores fetch data with no dedup
Multiple store hooks (`useUserDataSync`, `useWorkoutStore`, `useProgramStore`) each make independent DB calls with no coordination. The debounce on saves (2000ms) is fine, but reads have no guard beyond `hasFetchedRef`.

## Files to modify/create

| File | Changes |
|------|---------|
| `src/pages/ProfileSettings.tsx` | Full rewrite: avatar upload, two-column form with all profile fields |
| `src/pages/AdminUserProfile.tsx` | Add profile fields display in CoachRx-style two-column layout |
| `src/App.tsx` | Add `React.lazy` for all route components, configure QueryClient staleTime |
| `src/hooks/useAdminCheck.ts` | Remove 300ms setTimeout |
| `src/components/layout/Navbar.tsx` | Cache profile data, show avatar |
| `src/stores/workoutStore.ts` | Add realtime subscription for workouts/exercises/sets |
| **DB migration** | Add profile columns (first_name, last_name, sex, weight_kg, birthday, unit_preference, timezone, location, height_cm) + storage policy for avatars |

