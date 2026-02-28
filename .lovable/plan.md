

# Add Unilateral (Left/Right) Exercise Tracking

## Problem
Unilateral exercises (e.g., Bulgarian Split Squat, Single-Arm Dumbbell Row, Single-Leg RDL) currently show one set of inputs. Users need separate left and right side tracking. Additionally, admins need a way to classify any push/pull exercise as unilateral.

## Data Model

### Database Changes
1. Add `side` column to `exercise_sets`:
   ```sql
   ALTER TABLE exercise_sets ADD COLUMN side text; -- 'left', 'right', or NULL (bilateral)
   ```

2. Add `is_unilateral` column to `exercise_library`:
   ```sql
   ALTER TABLE exercise_library ADD COLUMN is_unilateral boolean NOT NULL DEFAULT false;
   ```

### Type Updates
- `ExerciseSet`: add `side: 'left' | 'right' | null`

## Hardcoded Default Unilateral Exercises
In `movementPatterns.ts`, add a `UNILATERAL_EXERCISES` set containing exercises that are inherently single-side:
- Single-Leg Romanian Deadlift, Bulgarian Split Squat, Walking Lunge, Reverse Lunge, Forward Lunge, Lateral Lunge, Step-Up, Box Step-Up, Pistol Squat, Leg Press (Single-Leg), Single-Leg Calf Raise, Single-Leg Glute Bridge, Hip Thrust (Single-Leg)
- Dumbbell Row (Single-Arm), Meadows Row, Concentration Curl
- Side Plank, Suitcase Carry

Add `isUnilateralExercise(name, dbIsUnilateral?)` helper — same pattern as `isTimedExercise`.

## UI Changes

### `ExerciseCard.tsx`
- Fetch `is_unilateral` from exercise library alongside `is_timed`
- Compute `isUnilateral` using DB flag + hardcoded fallback
- When `isUnilateral` is true, sets are displayed in **paired rows**: each "set number" has a Left row and a Right row
- When adding a set, insert **two** `exercise_sets` rows — one with `side='left'`, one with `side='right'`, both sharing the same `set_number`
- Header row shows a small "L" / "R" indicator in the Set column

### `SetRow.tsx`
- Accept optional `side` prop (`'left' | 'right' | null`)
- When `side` is set, show a small colored badge ("L" or "R") next to the set number
- "L" = blue tint, "R" = green tint for visual distinction

### `workoutStore.ts`
- `addSet`: accept optional `isUnilateral` parameter. When true, insert two rows (left + right) with the same `set_number`
- `castSet`: include `side` field from DB
- `updateSet` / `completeSet`: no changes needed — they operate on individual set IDs

### `AdminExerciseMenu.tsx`
- Add a "Unilateral" toggle submenu (Yes/No) similar to Time-Based toggle
- Calls `upsertExerciseLibraryField(name, { is_unilateral: true/false })`

### `exerciseLibraryUpsert.ts`
- Add `is_unilateral` to the allowed fields type

### Volume Calculation
No changes needed — each side's set is already its own `exercise_sets` row with independent weight/reps, so volume aggregation works correctly. Each side contributes independently.

## Files Changed

| File | Change |
|------|--------|
| DB migration | Add `side` to `exercise_sets`, `is_unilateral` to `exercise_library` |
| `src/types/workout.ts` | Add `side` to `ExerciseSet` |
| `src/lib/movementPatterns.ts` | Add `UNILATERAL_EXERCISES`, `isUnilateralExercise()` |
| `src/lib/exerciseLibraryUpsert.ts` | Support `is_unilateral` field |
| `src/components/workout/ExerciseCard.tsx` | Detect unilateral, pair L/R sets, adjust add-set logic |
| `src/components/workout/SetRow.tsx` | Show L/R badge when `side` prop is set |
| `src/stores/workoutStore.ts` | `addSet` creates paired rows for unilateral, `castSet` includes `side` |
| `src/components/workout/AdminExerciseMenu.tsx` | Add "Unilateral" toggle |

