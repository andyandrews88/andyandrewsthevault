

# Fix: Exercise Library Persistence + Tab State on Refresh

## Issue 1: Exercise metadata doesn't update instantly

**Root cause:** `ExerciseCard` fetches `is_timed`, `is_unilateral`, and `video_url` from `exercise_library` in a `useEffect` that only runs on mount (keyed to `exercise.exercise_name`). When admin changes metadata via `AdminExerciseMenu` or `ExerciseActionSheet`, the DB updates but the component's local state (`isTimed`, `isUnilateral`, `videoUrl`) never refreshes.

**Fix in `ExerciseCard.tsx`:**
- Pass an `onMetadataChange` callback to `AdminExerciseMenu` that updates the local `isTimed`/`isUnilateral`/`videoUrl` state immediately after the DB write
- Same for `ExerciseActionSheet` — its admin metadata actions already call `upsertExerciseLibraryField` but don't notify the parent card

**Fix in `AdminExerciseMenu.tsx`:**
- The `onMetadataChange` prop already exists but only fires for `isTimed` and `isUnilateral`. Extend it to also fire for `movement_pattern` and `equipment_type` saves so the toast confirmation is paired with instant UI feedback.

## Issue 2: Page redirects to home on refresh

**Root cause:** `Vault.tsx` reads `searchParams.get('tab')` on initial mount but never writes the tab back to the URL when the user switches tabs. So refreshing always falls back to `'dashboard'`, and the `/vault` route shows the dashboard tab instead of whichever tab the user was on.

**Fix in `Vault.tsx`:**
- Import `useSearchParams` with setter: `const [searchParams, setSearchParams] = useSearchParams()`
- In `handleTabChange`, call `setSearchParams({ tab: value })` to sync the active tab into the URL
- This way, refreshing on `/vault?tab=workouts` restores the Train tab

## Issue 3: Custom exercise not saving to library

**Root cause:** The `addExercise` function in `workoutStore` attempts an insert into `exercise_library` (line 221) but swallows any errors silently. If the insert fails (e.g., race condition, name collision), no feedback is given.

**Fix in `workoutStore.ts`:**
- Add error logging on the library insert
- Use `upsert` pattern (insert with `onConflict: 'name'`) instead of check-then-insert to avoid race conditions

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/Vault.tsx` | Sync tab to URL via `setSearchParams` |
| `src/components/workout/ExerciseCard.tsx` | Wire `onMetadataChange` to update local `isTimed`/`isUnilateral`/`videoUrl` state |
| `src/stores/workoutStore.ts` | Fix exercise_library insert to use upsert + log errors |

