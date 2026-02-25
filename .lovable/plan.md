

# Plan: Fix Admin Workout Builder + Exercise Video Feature

## Root Cause Analysis

### 1. Admin Workout Builder is completely broken
The edge function `admin-workout-builder/index.ts` uses `anonClient.auth.getClaims(token)` on line 32 -- **this method does not exist** in the Supabase JS client. Every other working edge function in the project (e.g., `admin-detail`, `admin-user-profile`) uses `userClient.auth.getUser()` instead. This means every call to the edge function silently fails with a 401, which is why exercises never appear and nothing saves.

### 2. Exercise video URL not working
The `ExerciseCard` component queries `exercise_library` by name using `.ilike('name', exercise.exercise_name)`. This works correctly as code, but the `toEmbedUrl()` function requires specifying `'youtube'` as the type parameter. The real issue is that if exercises in the library don't have `video_url` populated, no button appears. The video code itself is architecturally sound -- the problem is upstream (the builder never worked, so no exercises ever appeared to test video on).

### 3. Admin Workout Builder UI quality
The current UI is functional but minimal. It needs to match the quality of the user-facing workout logger: proper set headers, weight/reps columns, visual feedback, and a more professional card layout.

---

## File Changes

### `supabase/functions/admin-workout-builder/index.ts`
**Critical fix**: Replace the broken `getClaims` authentication with the working `getUser()` pattern used by all other edge functions in this project.

Lines 27-39 change from:
```typescript
const anonClient = createClient(supabaseUrl, supabaseAnonKey, { ... });
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
if (claimsError || !claimsData?.claims) { ... }
const adminUserId = claimsData.claims.sub;
```
To:
```typescript
const userClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user }, error: authErr } = await userClient.auth.getUser();
if (authErr || !user) { return 401 }
const adminUserId = user.id;
```

Also add a `remove_set` action that re-numbers remaining sets after deletion, and a `get_workout_detail` action refinement.

### `src/components/admin/AdminWorkoutBuilder.tsx`
**Full rebuild** of the UI to match the quality of the user-facing `WorkoutLogger` and `ExerciseCard` components:

- Proper grid layout for sets: `Set | Weight | Reps | ✓ | ×` matching the front-end pattern
- Exercise cards with the same `bg-secondary/30` header, uppercase tracking, and spacing as `ExerciseCard.tsx`
- Visual feedback: completed sets get a checkmark, weight/reps inputs match the front-end styling
- RIR column support (matching user-facing SetRow)
- Exercise-level notes field per exercise (for coach cues like "focus on tempo" or "@ 85% TM")
- Workout-level notes at the bottom
- After saving, auto-refresh the workout list on the admin profile page
- Loading states during exercise add / set save operations
- Show the "Build Workout" button even when user has no workouts yet (currently hidden behind a conditional that checks `data.training.workouts.length > 0`)

### `src/pages/AdminUserProfile.tsx`
- Move `AdminWorkoutBuilder` outside the `data.training.workouts.length > 0` conditional so the button always appears
- After a workout is saved, trigger a re-fetch of the user profile data so the new workout appears immediately in the Recent Workouts table

### `src/components/workout/ExerciseCard.tsx`
Minor refinement: the video feature code is correct, but add a fallback `toEmbedUrl` call that auto-detects YouTube vs Vimeo instead of hardcoding `'youtube'`. Currently line 143 passes `'youtube'` -- if someone stores a Vimeo URL it won't convert. Add detection logic.

---

## Summary

| File | Change |
|------|--------|
| `supabase/functions/admin-workout-builder/index.ts` | Fix broken auth (`getClaims` → `getUser`), the actual reason nothing works |
| `src/components/admin/AdminWorkoutBuilder.tsx` | Rebuild UI to match user-facing workout logger quality |
| `src/pages/AdminUserProfile.tsx` | Always show builder button; refresh data after save |
| `src/components/workout/ExerciseCard.tsx` | Auto-detect video platform in `toEmbedUrl` call |

No database changes needed.

