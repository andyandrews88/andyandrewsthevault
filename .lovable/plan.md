

# UX Improvements: Reorder Exercises, Fix Exercise Search, Replace Exercise

## 1. Move Exercise Cards Up/Down

The `workout_exercises` table already has an `order_index` column. We need:

**`src/stores/workoutStore.ts`**:
- Add `moveExercise(exerciseId: string, direction: 'up' | 'down')` action
- Swaps `order_index` between the target exercise and its neighbor in the DB
- Re-sorts local `exercises` array

**`src/components/workout/ExerciseCard.tsx`**:
- Add `onMoveUp` and `onMoveDown` callback props (optional, with `canMoveUp`/`canMoveDown` booleans)
- Add up/down arrow buttons in the card header (next to the kebab menu)

**`src/components/workout/WorkoutLogger.tsx`**:
- Pass `onMoveUp`, `onMoveDown`, `canMoveUp`, `canMoveDown` props based on exercise index in the array
- Same for `ConditioningCard`

## 2. Fix Exercise Search/Pulldown

The current `ExerciseSearch` dialog has scroll issues because the `ScrollArea` doesn't get a fixed height. Also needs better instant filtering as user types.

**`src/components/workout/ExerciseSearch.tsx`** — full rebuild:
- Give the `ScrollArea` a fixed `max-h-[300px]` instead of relying on `flex-1 min-h-0`
- Use `cmdk` (`Command` component) instead of a flat button list — this gives proper keyboard navigation, instant fuzzy search, and reliable scrolling
- Keep the strength/conditioning tabs and category pills
- The Command component is already installed and used elsewhere (GoalForm)

## 3. Replace Exercise In-Place

**`src/stores/workoutStore.ts`**:
- Add `replaceExercise(exerciseId: string, newName: string)` action
- Updates `exercise_name` on the `workout_exercises` row in DB
- Updates local state

**`src/components/workout/ExerciseCard.tsx`**:
- Add "Replace Exercise" option in the dropdown menu
- Opens the `ExerciseSearch` dialog in "replace" mode
- On select, calls `replaceExercise` instead of adding a new card

**`src/components/workout/ExerciseSearch.tsx`**:
- Add optional `mode?: 'add' | 'replace'` prop and `title` prop to customize the dialog header ("Replace Exercise" vs "Add Exercise")

## Files Changed

| File | Change |
|------|--------|
| `src/stores/workoutStore.ts` | Add `moveExercise` and `replaceExercise` actions |
| `src/components/workout/ExerciseCard.tsx` | Add move up/down buttons, replace exercise menu item, replace dialog state |
| `src/components/workout/ExerciseSearch.tsx` | Rebuild with `Command` component for proper scrolling/search, add `mode` prop |
| `src/components/workout/WorkoutLogger.tsx` | Pass move callbacks and index info to exercise cards |
| `src/components/workout/ConditioningCard.tsx` | Add move up/down buttons (same pattern) |

