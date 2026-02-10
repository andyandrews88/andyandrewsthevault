

# Fix: Workout Data Not Populating on Initial Load

## Root Cause

In `WorkoutLogger.tsx` (line 76-80), the `useEffect` on mount calls:
- `fetchActiveWorkout()` -- checks for an in-progress workout
- `fetchPersonalRecords()` -- loads PRs
- `fetchWorkoutDays(12)` -- loads calendar dots

But it **never calls `fetchWorkoutByDate(selectedDate)`** for the current date. So `viewingWorkout` remains `null` until the user changes dates, which is the only action that triggers `fetchWorkoutByDate`.

## Fix

Add `fetchWorkoutByDate(selectedDate)` to the initial `useEffect` in `WorkoutLogger.tsx`, so completed workouts for today load immediately on mount.

### File: `src/components/workout/WorkoutLogger.tsx`

Update the `useEffect` (lines 76-80) to also fetch the workout for the initially selected date:

```typescript
useEffect(() => {
  fetchActiveWorkout();
  fetchPersonalRecords();
  fetchWorkoutDays(12);
  fetchWorkoutByDate(selectedDate);
}, []);
```

We also need to add `fetchWorkoutByDate` to the destructured imports from `useWorkoutStore` (it's already in the store but not imported in the component).

## One File Changed

| File | Change |
|------|--------|
| `src/components/workout/WorkoutLogger.tsx` | Import `fetchWorkoutByDate` from store; call it on mount |

No database or store logic changes needed -- the fetch function already exists and works correctly, it just wasn't being called on initial load.

