

# Auto-Sync Goals with Workout Tracker & Exercise Dropdown

## Overview

Two changes:
1. **Exercise dropdown in GoalForm** -- Replace the free-text exercise input with a searchable dropdown populated from the existing exercise library (~250 movements), so exercise names always match what the workout tracker uses.
2. **Auto-update goal progress** -- When a new PR is logged or a body entry is saved, automatically update any matching active goals so the dashboard always reflects the latest progress.

---

## 1. Exercise Dropdown in GoalForm

### Current Problem
The exercise name field is a plain text input. If a user types "Squat" but their PR is stored as "Squat (Barbell)", the goal will never auto-sync.

### Solution
Replace the `<Input>` with a searchable `<Select>` dropdown that uses:
- `STRENGTH_EXERCISES` from `src/types/workout.ts` when goal type is "strength"
- `CONDITIONING_EXERCISES` when goal type is "conditioning"

The dropdown will use the existing `cmdk` (command menu) pattern already installed in the project for a filterable/searchable list, since there are ~250 exercises.

### Auto-populate Start Value
When the user selects an exercise and the goal type is "strength", query the `personal_records` table for that exercise and pre-fill the "Current Value" field with their latest PR weight. For body weight goals, pre-fill from the latest `user_body_entries` weight.

---

## 2. Auto-Update Goals on PR / Body Entry

### How It Works

After a new PR is logged in `workoutStore.ts`, call `goalStore.syncGoalsAfterPR(exerciseName, newWeight)`. This function:
1. Finds any active goal where `goal_type = 'strength'` and `exercise_name` matches (case-insensitive)
2. Updates `current_value` to the new PR weight
3. If `current_value >= target_value`, marks the goal as `achieved`

After a body entry is saved in `progressStore.ts`, call `goalStore.syncGoalsAfterBodyEntry(weightKg)`. This function:
1. Finds any active goal where `goal_type = 'body_weight'`
2. Updates `current_value` to the new weight
3. Checks if the target is reached (handles both "lose" and "gain" directions)

### Integration Points

**`src/stores/workoutStore.ts`** (around line 428-435):
After a new PR is confirmed, import and call `useGoalStore.getState().syncGoalsAfterPR(exerciseName, weight)`.

**`src/stores/progressStore.ts`** (around line 113-118):
After a body entry is inserted, import and call `useGoalStore.getState().syncGoalsAfterBodyEntry(weightKg)`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/stores/goalStore.ts` | Add `syncGoalsAfterPR()` and `syncGoalsAfterBodyEntry()` methods |
| `src/components/goals/GoalForm.tsx` | Replace exercise text input with searchable dropdown; auto-populate start value from PR/weight data |
| `src/stores/workoutStore.ts` | After PR upsert, call `syncGoalsAfterPR()` |
| `src/stores/progressStore.ts` | After body entry insert, call `syncGoalsAfterBodyEntry()` |

## No New Files Needed

All changes are modifications to existing files.

## No Database Changes Needed

The `user_goals` table already has all required columns.

---

## Technical Details

### New Methods in goalStore

```
syncGoalsAfterPR(exerciseName: string, newWeight: number)
  - Normalises exercise name to lowercase
  - Finds active goals matching exercise_name (case-insensitive)
  - For each match: calls updateGoalProgress(goalId, newWeight)

syncGoalsAfterBodyEntry(weightKg: number)
  - Finds active goals where goal_type = 'body_weight'
  - For each match: calls updateGoalProgress(goalId, weightKg)
```

### GoalForm Exercise Picker

Uses `Popover` + `Command` (cmdk) components already in the project for a searchable dropdown. When goal type changes, the exercise list switches between strength and conditioning exercises. Selecting an exercise auto-fills the title field (e.g. "Bench Press 100kg") and queries the user's current PR to pre-fill the start value.

### Achievement Detection

The existing `updateGoalProgress` in goalStore already handles marking goals as achieved -- for strength goals it checks `currentValue >= targetValue`, and for conditioning goals it checks `currentValue <= targetValue` (lower time = better). This logic is preserved.
