

# Fix: Goal Sync Not Working from Workouts

## Root Cause

The `syncGoalsAfterPR()` and `syncGoalsAfterBodyEntry()` methods in `goalStore.ts` filter against the in-memory `goals` array. But that array is only populated when `fetchGoals()` runs (when the Dashboard/Goals panel mounts). If a user goes straight to Workouts and logs a PR without visiting the Dashboard first, the `goals` array is empty -- so the sync silently does nothing.

## Fix

Instead of relying on the cached in-memory array, both sync methods should **query the database directly** for matching active goals. This guarantees the sync works regardless of which tab the user visited first.

## Changes

### `src/stores/goalStore.ts`

**`syncGoalsAfterPR`** -- Replace `get().goals` filtering with a direct Supabase query:

```
const { data: matching } = await supabase
  .from('user_goals')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .eq('goal_type', 'strength')
  .ilike('exercise_name', exerciseName);
```

Then loop through results and call `updateGoalProgress` for each where `newWeight > current_value`.

**`syncGoalsAfterBodyEntry`** -- Same approach: query the database for active body_weight goals instead of filtering the in-memory array.

After updating, call `fetchGoals()` to refresh the in-memory cache so the dashboard reflects changes immediately if it's mounted.

### No other files need to change

The integration points in `workoutStore.ts` and `progressStore.ts` are already correct.

---

## Technical Detail

The updated `syncGoalsAfterPR` method will:
1. Get the current user
2. Query `user_goals` table directly for active strength goals matching the exercise name (case-insensitive)
3. For each match where `newWeight > current_value`, call `updateGoalProgress`
4. Refresh the in-memory goals cache with `fetchGoals()`

The same pattern applies to `syncGoalsAfterBodyEntry` for body_weight goals.
