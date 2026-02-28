

# Fix Admin Workout Builder: Time-Based & Unilateral Not Reflecting in UI

## Problem
When selecting "Time-Based → Yes" or "Unilateral (L/R) → Yes" from the admin menu, the `exercise_library` DB is updated but the card UI doesn't react — column headers stay "KG / Reps", no L/R rows appear.

## Root Cause
- `LocalExercise` interface has no `isTimed` or `isUnilateral` fields
- `AdminExerciseMenu` calls `upsertExerciseLibraryField` directly with no callback to parent
- The set grid header and input labels are hardcoded ("Kg", "Reps")

## Changes

### 1. `LocalExercise` interface — add state fields
Add `isTimed: boolean` and `isUnilateral: boolean` to the interface. Fetch from `exercise_library` when loading/adding exercises (query `is_timed, is_unilateral` alongside `video_url`).

### 2. `AdminExerciseMenu` — add `onMetadataChange` callback
Add optional prop `onMetadataChange?: (field: string, value: any) => void` that fires after successful upsert. The parent uses this to update local state immediately.

### 3. `AdminWorkoutBuilderPage` — reactive UI
- **Column headers**: Change "Reps" → "Sec" when `isTimed` is true. Change "Kg" → "+Load" when exercise is bodyweight.
- **Unilateral sets**: When toggled on, duplicate existing sets into L/R pairs with side badges. When toggled off, collapse back.
- **Set grid**: Show L/R badge next to set number when unilateral.
- Wire `onMetadataChange` from `AdminExerciseMenu` to update `exercises` state.

### 4. Edge function — fetch `is_timed`/`is_unilateral` with exercise video
Update the `get_exercise_video` action (or add to existing library query) to also return `is_timed` and `is_unilateral` so the builder page has this data on load.

## Files to Modify
| File | Changes |
|------|---------|
| `src/components/workout/AdminExerciseMenu.tsx` | Add `onMetadataChange` callback prop |
| `src/pages/AdminWorkoutBuilderPage.tsx` | Add `isTimed`/`isUnilateral` to state, reactive headers, L/R sets, wire callback |
| `supabase/functions/admin-workout-builder/index.ts` | Return `is_timed`/`is_unilateral` from exercise library queries |

