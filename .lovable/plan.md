

# Add Time-Based Tracking for Strength Exercises

## Problem
Exercises like Plank, Side Plank, Hollow Body Hold, Sandbag Hold, Wall Sit, and carries are isometric/time-based but currently only offer weight + reps inputs. Users need a way to log duration (seconds) instead of reps for these movements.

## Research: Volume Calculation for Time-Based Strength Work

For isometric/time-under-tension exercises, sport science literature uses **Time Under Tension (TUT)** as the volume metric:

- **Unloaded isometrics** (Plank, Side Plank, Hollow Body Hold): Volume = bodyweight × multiplier × (seconds / 30). The `/30` normalizes so that 30 seconds ≈ 1 "rep equivalent," aligning with research showing ~30s isometric holds produce similar metabolic stress to ~10 reps.
- **Loaded isometrics** (Weighted Plank, Sandbag Hold, Farmer's Walk): Volume = (load + BW×multiplier) × (seconds / 30).
- **Carries** (already classified as `carry` pattern): Same formula — weight × (seconds / 30).

The difficulty coefficient for the pattern still applies normally (core = 0.35, carry = 0.50, etc.), so NTU calculation remains: `rawVolume / (patternCoeff × equipmentMod)`.

## Database Changes

Add a `duration_seconds` column to `exercise_sets`:

```sql
ALTER TABLE exercise_sets ADD COLUMN duration_seconds integer;
```

This lets any strength set optionally store time instead of (or alongside) reps.

## Exercise Library: `is_timed` Flag

Add a boolean column to `exercise_library` so admins can mark exercises as time-based:

```sql
ALTER TABLE exercise_library ADD COLUMN is_timed boolean NOT NULL DEFAULT false;
```

Admins toggle this from the existing kebab menu on exercise cards. A hardcoded default list (Plank, Side Plank, Hollow Body Hold, Wall Sit, etc.) will auto-classify when no DB entry exists.

## Code Changes

### 1. `src/types/workout.ts` — ExerciseSet type
- Add `duration_seconds: number | null` to `ExerciseSet` interface.

### 2. `src/lib/movementPatterns.ts` — Time-based volume
- Add `TIME_BASED_EXERCISES` set with defaults: Plank, Side Plank, Hollow Body Hold, Wall Sit, Dead Bug, Bird Dog, Farmer's Walk, Suitcase Carry, Overhead Carry, Sandbag Carry.
- Add `isTimedExercise(name, dbIsTimed?)` helper.
- Add `calculateTimedSetVolume(exerciseName, weight, durationSeconds, bodyWeightKg)` — uses `weight × (seconds / 30)` for loaded, `BW × multiplier × (seconds / 30)` for bodyweight.
- Update `calculateSetVolume` to optionally accept `durationSeconds` and delegate to timed calc when appropriate.

### 3. `src/components/workout/SetRow.tsx` — Time input mode
- Accept `isTimed` prop.
- When `isTimed` is true, replace the "Reps" input with a "Sec" input (duration in seconds).
- Change header label from "Reps" to "Sec".
- Adjust completion logic: allow completing with weight + duration (reps not required).
- Store `duration_seconds` via `onUpdate`.

### 4. `src/components/workout/ExerciseCard.tsx` — Detect timed mode
- On mount, check `exercise_library` for `is_timed` flag (alongside existing `video_url` fetch).
- Fall back to hardcoded `TIME_BASED_EXERCISES` list.
- Pass `isTimed` prop to `SetRow`.
- Change header row label from "Reps" to "Sec" when timed.

### 5. `src/components/workout/AdminExerciseMenu.tsx` — Toggle timed
- Add a "Time-Based" toggle menu item for admins to set `is_timed` on the exercise library entry.

### 6. `src/stores/workoutStore.ts` — Persist duration
- Update `updateSet` to handle `duration_seconds`.
- Update `completeSet` to accept optional `durationSeconds` and save it.
- Update `addSet` insert to include `duration_seconds: null` explicitly.

### 7. `src/components/workout/MovementBalanceChart.tsx` — Include timed volume
- When aggregating volume, check if a set has `duration_seconds` and use `calculateTimedSetVolume` instead of standard calc.

### 8. `src/integrations/supabase/types.ts` — Will auto-update after migration.

## Files Changed

| File | Change |
|------|--------|
| DB migration | Add `duration_seconds` to `exercise_sets`, `is_timed` to `exercise_library` |
| `src/types/workout.ts` | Add `duration_seconds` to `ExerciseSet` |
| `src/lib/movementPatterns.ts` | Time-based volume calc, `isTimedExercise`, `TIME_BASED_EXERCISES` |
| `src/components/workout/SetRow.tsx` | Conditional time input vs reps input |
| `src/components/workout/ExerciseCard.tsx` | Detect timed mode, pass to SetRow, adjust headers |
| `src/components/workout/AdminExerciseMenu.tsx` | Add "Time-Based" toggle |
| `src/stores/workoutStore.ts` | Handle `duration_seconds` in set operations |
| `src/components/workout/MovementBalanceChart.tsx` | Use timed volume in aggregation |
| `src/lib/exerciseLibraryUpsert.ts` | Support `is_timed` field |

