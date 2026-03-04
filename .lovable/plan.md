

# Plan: Fix Exercise Videos, Library Search, and Performance

## Three Issues

### Issue 1: Exercise videos in warmup/cooldown sections
The video demo feature already works in `ExerciseCard.tsx` -- it fetches from `exercise_library` by name and shows a Play button when `video_url` exists. This works identically regardless of which section (`warmup`, `main`, `cooldown`) the exercise is in. Both the user-side `ExerciseCard` and admin-side builder already support this.

**No code changes needed** for this issue -- videos are already functional across all sections. If a specific exercise has no video assigned in the library, the coach needs to add one via the Exercise Library admin panel.

### Issue 2: Approved exercises not showing in search
**Root cause**: `ExerciseSearch.tsx` uses only hardcoded arrays (`STRENGTH_EXERCISES`, `CONDITIONING_EXERCISES`) from `types/workout.ts`. Exercises approved in the `exercise_library` database table (like "Ring Support Hold") are never fetched or displayed. The search only shows the static list.

**Fix**: Modify `ExerciseSearch.tsx` to:
1. On open, fetch all approved exercises from `exercise_library` table
2. Merge database exercises with the hardcoded list (deduplicate by name)
3. Show the combined list so any approved exercise appears in search results
4. Update `ALL_KNOWN_EXERCISES` to include DB exercises so they aren't treated as "custom"

### Issue 3: Loading screen flashing on every interaction
**Root cause**: `useWorkoutRealtime.ts` listens to changes on `workout_exercises` and `exercise_sets`. Every time a set is updated, completed, or an exercise is moved, the realtime listener fires `fetchActiveWorkout()`, which sets `isLoading: true` and shows the full-page spinner. This happens on the user's OWN changes, creating a jarring flash.

**Fix**: Two changes:
1. **`useWorkoutRealtime.ts`**: Skip refetching when there's an active workout in progress (the user's local state is already up-to-date from optimistic updates). Only refetch when no active workout exists (meaning changes came from the admin side).
2. **`workoutStore.ts` `fetchActiveWorkout`**: Don't set `isLoading: true` if there's already an active workout loaded (soft refresh instead of hard reload with spinner).

## Files to modify

| File | Change |
|------|--------|
| `src/components/workout/ExerciseSearch.tsx` | Fetch approved exercises from DB on open, merge with hardcoded list |
| `src/hooks/useWorkoutRealtime.ts` | Guard against refetching during active workout sessions |
| `src/stores/workoutStore.ts` | Prevent `isLoading: true` flash during soft refetches |

