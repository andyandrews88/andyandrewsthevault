

# Add Admin Exercise Menu to Backend Builder + Auto-Register Exercises Globally

## Problem
1. The admin workout builder page (`AdminWorkoutBuilderPage.tsx`) only has Video and Remove buttons per exercise. It's missing the full admin menu from the front-end: Movement Pattern, Equipment Type, Time-Based, Unilateral L/R, Set Video URL, Load Last Session, Replace Exercise.
2. When a new/custom exercise is entered anywhere (admin builder, client logger, template editor), it is NOT automatically registered in the `exercise_library` table. This means metadata set in one place doesn't carry over, and exercises added from coaching don't appear with their details on the client side.

## Plan

### 1. Add Admin Exercise Menu to `AdminWorkoutBuilderPage.tsx`
- Import `AdminExerciseMenu` (already exists) and add a `DropdownMenu` with `MoreVertical` trigger to each exercise card header (replacing the simple Video + Trash buttons)
- Include in the dropdown: Load Last Session (via edge function), Replace Exercise (opens `ExerciseSearch`), and the full `AdminExerciseMenu` sub-menus (Movement Pattern, Equipment Type, Time-Based, Unilateral, Set Video URL), plus Remove Exercise at the bottom
- Add replace exercise handler that swaps the exercise name in state and calls the edge function to update the `workout_exercises` row

### 2. Auto-Register Exercises in `exercise_library` on Creation
- **Edge function (`admin-workout-builder/index.ts`)**: In the `add_exercise` action, after inserting into `workout_exercises`, do an upsert to `exercise_library` — if the exercise name doesn't already exist, insert it with `category: 'strength'` (or `'conditioning'`). This ensures every exercise entered from the admin builder is globally registered.
- **Client-side (`workoutStore.ts`)**: In the `addExercise` action (or wherever exercises are created on the front-end), add a similar upsert call to `exercise_library` via the client SDK so exercises entered by the user also get registered.
- This is an **insert-if-not-exists** pattern — existing library entries won't be overwritten.

### 3. Add `replace_exercise` action to edge function
- New action in `admin-workout-builder/index.ts` that updates `workout_exercises.exercise_name` for a given exercise ID, so the admin can swap exercises in the builder.

## Files to Modify
| File | Changes |
|------|---------|
| `src/pages/AdminWorkoutBuilderPage.tsx` | Add DropdownMenu with AdminExerciseMenu, replace exercise handler |
| `supabase/functions/admin-workout-builder/index.ts` | Auto-register exercises in `exercise_library` on `add_exercise`, add `replace_exercise` action |
| `src/stores/workoutStore.ts` | Auto-register exercises in `exercise_library` when adding exercises from front-end |

