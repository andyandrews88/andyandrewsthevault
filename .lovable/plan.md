

# Training Section: Complete Bug Fix and Stability Overhaul

## Bugs Identified

### BUG 1 (Critical) -- `fetchActiveWorkout` auto-abandons workouts being edited

When `editWorkout` marks a past workout as `is_completed: false`, the `fetchActiveWorkout` function contains auto-abandon logic (lines 602-614) that checks `workout.date < today && !isProgramSession` and immediately marks the workout as completed again. If the component ever remounts (e.g., switching between Log Workout / Calendar / Analytics tabs), the initial-load effect re-runs `fetchActiveWorkout`, which finds the now-incomplete past workout and auto-completes it -- destroying the editing session.

**Fix**: Add a guard in `fetchActiveWorkout`: if `isEditing` is already true in the store, skip the auto-abandon logic entirely.

### BUG 2 (Critical) -- After cancel/finish edit, `viewingWorkout` is never refreshed

When `cancelWorkout` or `finishWorkout` runs during an edit:
- `activeWorkout` is set to null
- `viewingWorkout` remains null (was cleared by `editWorkout`)
- `selectedDate` does not change, so the date-change effect does NOT fire
- Result: the user sees the empty "Start Workout" prompt instead of their restored/finished workout

**Fix**: After `cancelWorkout` and `finishWorkout` (when `isEditing` was true), call `fetchWorkoutByDate(selectedDate)` to reload the completed workout into `viewingWorkout`.

### BUG 3 (Critical) -- `handleFinish` calls `onBack()` which navigates away during edits

After finishing an edited workout, `handleFinish` calls `onBack()`. While `onBack` is currently `() => {}` in WorkoutTab (does nothing), the intent and original design navigates the user away. More importantly, `handleFinish` unconditionally tries to mark program calendar workouts as complete (lines 122-132) even during edit mode, which is incorrect for retroactive edits.

**Fix**: In `handleFinish`, check if we're editing. If so, skip the `onBack()` call and the program calendar marking logic. Just finish and let the view refresh to show the completed workout.

### BUG 4 (Medium) -- `fetchProgramWorkoutsForDate` still uses `getUser()` (network call)

Line 83 of WorkoutLogger still uses `supabase.auth.getUser()` instead of `getSession()`. This adds latency to every date navigation.

**Fix**: Switch to `getSession()`.

### BUG 5 (Medium) -- `handleFinish` uses `getUser()` for calendar update

Line 124 of WorkoutLogger uses `getUser()` for the program calendar update.

**Fix**: Switch to `getSession()`.

### BUG 6 (Minor) -- Cancel dialog text is wrong during edit mode

The cancel dialog says "This will delete all exercises and sets from this session" -- but during edit mode, cancelling restores the workout instead of deleting it. The text is misleading.

**Fix**: Show different text based on `isEditing` state.

### BUG 7 (Minor) -- `ProgramCalendarView` dialog condition is always true

Line 204: `selectedWorkouts.length >= 0` is always true (arrays always have length >= 0). Should be `!!selectedDate`.

**Fix**: Simplify to `open={!!selectedDate}`.

### BUG 8 (Minor) -- `ProgramCalendarView` uses `getUser()` for month fetch

Line 43: `supabase.auth.getUser()` should be `getSession()`.

**Fix**: Switch to `getSession()`.

## Implementation Plan

### File: `src/stores/workoutStore.ts`

1. **Guard `fetchActiveWorkout`**: Check `if (get().isEditing) { set({ isLoading: false }); return; }` before the auto-abandon logic to prevent destroying an active edit session.

2. **Fix `cancelWorkout`**: After restoring the workout (edit mode), call `get().fetchWorkoutByDate(get().selectedDate)` to reload `viewingWorkout`.

3. **Fix `finishWorkout`**: After completing the workout, if `isEditing` was true, call `get().fetchWorkoutByDate(get().selectedDate)` to show the finished workout.

### File: `src/components/workout/WorkoutLogger.tsx`

4. **Fix `handleFinish`**: Guard the `onBack()` call and the program calendar update logic behind `!isEditing`. When editing, just call `finishWorkout()`, refresh workout days, and let the store handle the rest.

5. **Switch `fetchProgramWorkoutsForDate`** from `getUser()` to `getSession()`.

6. **Switch `handleFinish` program calendar update** from `getUser()` to `getSession()`.

7. **Fix cancel dialog text**: Read `isEditing` from the store and show context-appropriate messaging.

8. **Add `isEditing` to the destructured store values** so it's available in the component.

### File: `src/components/workout/ProgramCalendarView.tsx`

9. **Fix dialog open condition**: Change `selectedWorkouts.length >= 0` to simply `!!selectedDate`.

10. **Switch `fetchMonthWorkouts`** from `getUser()` to `getSession()`.

## Summary of Changes

| File | Changes |
|------|---------|
| `src/stores/workoutStore.ts` | Guard `fetchActiveWorkout` against `isEditing`, refresh `viewingWorkout` after cancel/finish in edit mode |
| `src/components/workout/WorkoutLogger.tsx` | Guard `handleFinish` for edit mode, fix `getUser()` to `getSession()`, fix cancel dialog text, add `isEditing` state |
| `src/components/workout/ProgramCalendarView.tsx` | Fix dialog open condition, fix `getUser()` to `getSession()` |

