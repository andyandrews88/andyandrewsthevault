
# Training Section Audit and Bug Fix

## Critical Bug: Editing Old Workout Crashes and Resets to Today

**Root Cause** (line 552 in `workoutStore.ts`):

```text
set({
  activeWorkout: workout,
  exercises,
  viewingWorkout: null,
  viewingExercises: [],
  selectedDate: new Date(),   // <-- THIS IS THE BUG
  isLoading: false,
});
```

When you click "Edit" on a past workout, `editWorkout()` forces `selectedDate` back to `new Date()` (today). This triggers the `useEffect` in `WorkoutLogger` which calls `fetchWorkoutByDate(selectedDate)` and `fetchProgramWorkoutsForDate(selectedDate)` -- those overwrite the state you just set, causing a race condition that resets the view and can crash the UI.

**Fix**: Replace `selectedDate: new Date()` with `selectedDate: new Date(workout.date + 'T12:00:00')` so the calendar stays on the workout's actual date.

Additionally, `editWorkout` marks the workout as `is_completed: false` in the database but does NOT restore it to `is_completed: true` when the user finishes. The existing `finishWorkout` already does `update({ is_completed: true })`, so this path is covered -- but if the user cancels (`cancelWorkout`), the workout gets DELETED entirely. For an edit of a completed workout, cancelling should restore the `is_completed: true` flag instead of deleting the entire workout. This needs a guard.

## Performance Issues

### 1. Excessive `supabase.auth.getUser()` calls
Every single store action (`fetchActiveWorkout`, `fetchWorkoutByDate`, `fetchWorkoutDays`, `fetchPersonalRecords`, `completeSet`, etc.) makes a separate `await supabase.auth.getUser()` network call. On page load, the `useEffect` in `WorkoutLogger` fires 4 fetches simultaneously, each calling `getUser()` independently -- that's 4 redundant auth round-trips before any real data loads.

**Fix**: Cache the user ID once at the top of the component or store initialization, and pass it through. Alternatively, use `supabase.auth.getSession()` which reads from local cache and is instant.

### 2. `useEffect` in `WorkoutLogger` re-fetches everything on every date change
The dependency array `[fetchActiveWorkout, fetchPersonalRecords, fetchWorkoutDays, fetchWorkoutByDate, selectedDate]` causes all 5 functions (including `fetchActiveWorkout` and `fetchPersonalRecords` which don't depend on `selectedDate`) to re-run every time the date changes. Only `fetchWorkoutByDate` and `fetchProgramWorkoutsForDate` need to run on date change.

**Fix**: Split into two effects -- one for initial load (active workout, PRs, workout days) and one for date-dependent fetches.

### 3. `getLastSessionSets` called per ExerciseCard on mount
Each `ExerciseCard` fires `getLastSessionSets` in a `useEffect` on mount, which is another Supabase query per exercise. With 5 exercises, that's 5 separate queries just to show "previous" data.

**Fix**: This is acceptable for small workouts but should have a loading guard to prevent duplicate calls when exercises array updates.

### 4. `setSelectedDate` triggers `fetchWorkoutByDate` inside the store AND the useEffect
When you call `setSelectedDate`, the store setter on line 100-102 immediately calls `fetchWorkoutByDate(date)`. Then the `useEffect` in `WorkoutLogger` also calls `fetchWorkoutByDate(selectedDate)` because `selectedDate` changed. This is a double fetch.

**Fix**: Remove the `fetchWorkoutByDate` call from inside `setSelectedDate` in the store, since the `useEffect` in WorkoutLogger already handles it. Or remove it from the effect. Pick one path.

## Other Issues Found

### 5. Cancel = Delete during Edit mode
`cancelWorkout` deletes the workout from the database entirely. When editing an old completed workout, this means the user permanently loses their workout data if they cancel the edit. 

**Fix**: Track whether the active workout was loaded via `editWorkout` (e.g., an `isEditing` flag in the store). If cancelling during edit mode, restore `is_completed: true` instead of deleting.

### 6. PRCelebration shows weight in "lbs" always
Line 63 of `PRCelebration.tsx` hardcodes `{weight} lbs` regardless of the user's preferred unit.

**Fix**: Pass `preferredUnit` to PRCelebration and convert/display accordingly.

### 7. Dialog always opens in ProgramCalendarView
Line 204: `open={!!selectedDate && selectedWorkouts.length >= 0}` -- `length >= 0` is always true. This means the dialog opens even on rest days (which is intentional based on the rest day UI), but could be simplified to just `open={!!selectedDate}`.

### 8. `fetchWorkoutByDate` only fetches completed workouts
Line 115: `.eq('is_completed', true)` -- this means if you navigate to a date where you're currently editing (is_completed = false), it shows nothing. This creates confusion during the edit flow.

## Implementation Plan

### File: `src/stores/workoutStore.ts`

1. **Fix `editWorkout`** -- set `selectedDate` to the workout's date, not today
2. **Add `isEditing` flag** to state -- set true in `editWorkout`, false in `finishWorkout`/`cancelWorkout`
3. **Fix `cancelWorkout`** -- if `isEditing`, restore `is_completed: true` instead of deleting
4. **Fix `setSelectedDate`** -- remove the redundant `fetchWorkoutByDate` call (let the component handle it)
5. **Replace `supabase.auth.getUser()`** with `supabase.auth.getSession()` in all store methods for instant cached reads

### File: `src/components/workout/WorkoutLogger.tsx`

6. **Split the `useEffect`** into two: one for initial load (runs once), one for date changes
7. **Hide program cards when editing** -- if `activeWorkout` exists, don't show `DailyProgramWorkout` cards (this is already handled by the `!activeWorkout &&` check on line 174, so this is fine)

### File: `src/components/workout/PRCelebration.tsx`

8. **Use preferred unit** for weight display instead of hardcoded "lbs"

### File: `src/components/workout/ExerciseCard.tsx`

9. **Guard `getLastSessionSets` effect** to prevent re-running when exercises array reference changes but the exercise name hasn't

## Summary of Changes

| File | Changes |
|------|---------|
| `src/stores/workoutStore.ts` | Fix `editWorkout` date reset, add `isEditing` flag, fix `cancelWorkout` for edit mode, replace `getUser()` with `getSession()`, remove double-fetch in `setSelectedDate` |
| `src/components/workout/WorkoutLogger.tsx` | Split useEffect into initial-load and date-change effects |
| `src/components/workout/PRCelebration.tsx` | Display weight in user's preferred unit |
| `src/components/workout/ExerciseCard.tsx` | Minor: stabilize useEffect dependency |
