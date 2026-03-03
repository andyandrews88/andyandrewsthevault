

# Plan: Private Coaching Access, Client PT Dashboard, Session Editing & Workout Actions

## Overview

Four features: (1) a toggle on admin profiles to grant/revoke private coaching access, (2) a client-facing "My Coaching" dashboard section visible only to private coaching clients showing session progress, (3) editable PT sessions with working workout linking, and (4) edit/delete actions on the Recent Workouts table in admin profiles.

---

## 1. Private Coaching Toggle (Admin Side)

**Database**: Add `private_coaching_enabled` boolean column to `user_profiles` (default `false`). No new table needed — this is a feature flag, not a role.

**Migration**:
```sql
ALTER TABLE public.user_profiles ADD COLUMN private_coaching_enabled boolean NOT NULL DEFAULT false;
```

**Admin UI** (`AdminUserProfile.tsx`): Add a `Switch` toggle in the header area next to the client's name/badges. Label: "Private Coaching". When toggled, updates `user_profiles.private_coaching_enabled` for that user. The admin profile edge function already returns the profile data, so it will include this field automatically.

---

## 2. Client "My Coaching" Dashboard Section

**New Component**: `src/components/dashboard/PrivateCoachingPanel.tsx`

Only renders if the logged-in user's `private_coaching_enabled` is `true` (fetched from `user_profiles`). Shows:
- **Session Progress Card** — active package name, sessions remaining vs total, progress bar (pulled from `pt_packages` where `client_user_id = user.id`)
- **Session History** — list of completed sessions with dates and linked workout names (from `pt_sessions`)
- Premium styling with a "Private Coaching" badge and accent border

**RLS**: Add SELECT policies on `pt_packages` and `pt_sessions` so clients can read their own rows:
```sql
CREATE POLICY "Clients can view their own packages" ON pt_packages FOR SELECT USING (auth.uid() = client_user_id);
CREATE POLICY "Clients can view their own sessions" ON pt_sessions FOR SELECT USING (auth.uid() = client_user_id);
```

**Integration** (`VaultDashboard.tsx`): Add `"coaching"` to `DEFAULT_ORDER` and `SECTION_META`/`SECTION_COMPONENTS`. The component self-hides if the user doesn't have private coaching enabled.

---

## 3. Editable PT Sessions (Admin)

**PTSessionTracker.tsx changes**:
- Add an **Edit** button (pencil icon) next to each session row's delete button
- Add `editSessionOpen` dialog state and `editingSession` state
- Edit dialog pre-fills date, workout link, and notes — saves via `supabase.from("pt_sessions").update(...)` 
- The workout selector already works (uses `workouts` fetched for the client) — this just surfaces it in the edit flow too

---

## 4. Edit/Delete on Recent Workouts (Admin Profile)

**AdminUserProfile.tsx** — in the `training` section renderer, add action buttons to each workout row:
- **Delete** button (Trash2 icon) — deletes the workout via `supabase.from("workouts").delete().eq("id", w.id)`, then re-fetches profile data
- The **Edit** button already exists (clicking the row navigates to the workout builder) — make this more obvious with a pencil icon button
- Add confirmation dialog for delete to prevent accidental deletion

---

## Files to Create/Modify

| File | Change |
|------|--------|
| **Migration** | Add `private_coaching_enabled` to `user_profiles`; add SELECT RLS on `pt_packages` and `pt_sessions` for clients |
| `src/components/dashboard/PrivateCoachingPanel.tsx` | **New** — Client-facing coaching dashboard with session progress |
| `src/components/dashboard/VaultDashboard.tsx` | Add coaching section to collapsible layout |
| `src/pages/AdminUserProfile.tsx` | Add Private Coaching toggle switch; add delete button to recent workouts |
| `src/components/admin/PTSessionTracker.tsx` | Add edit session dialog and edit button per session row |

