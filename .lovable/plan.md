

# Plan: Equipment-Aware Coefficients, Supersets, Rest Timer, Load Last Session Fix, Warm-up Sets

## 1. Equipment-Aware Difficulty Coefficients

Currently `DIFFICULTY_COEFFICIENTS` is per-pattern only. A barbell front squat and a dumbbell goblet squat both get `0.95`. The fix: add per-exercise coefficient overrides in `movementPatterns.ts`.

**`src/lib/movementPatterns.ts`**:
- Add `EQUIPMENT_MODIFIERS` map keyed by exercise name (lowercase), returning a multiplier applied on top of the pattern coefficient:
  - Barbell exercises (Back Squat, Front Squat, Bench Press, etc.): `1.0` (baseline)
  - Dumbbell exercises (Goblet Squat, DB Bench, DB Row, etc.): `0.80`
  - Kettlebell exercises (KB Swing, Goblet Squat if KB): `0.70`
  - Sandbag exercises (Sandbag Carry, Atlas Stone): `0.75`
  - Machine exercises (Hack Squat, Leg Press, Smith): `0.85`
  - Cable exercises: `0.65`
- Update `normalizeVolume` to accept an optional exercise name, look up the equipment modifier, and apply: `NTU = rawVolume / (patternCoeff * equipmentModifier)`
- Update `MovementBalanceChart` and `WorkoutLogger` volume calculations to pass exercise name through

## 2. Superset Feature

Allow users to group 2+ exercises into a superset visually and logically.

**`src/types/workout.ts`**:
- Add optional `superset_group: string | null` to `WorkoutExercise` interface

**Database migration**:
- `ALTER TABLE workout_exercises ADD COLUMN superset_group text DEFAULT NULL;`

**`src/stores/workoutStore.ts`**:
- Add `toggleSuperset(exerciseIds: string[])` — assigns a shared UUID as `superset_group` to selected exercises, or clears it
- Add `linkSuperset(exerciseId: string, targetExerciseId: string)` — links two exercises into a superset group

**`src/components/workout/WorkoutLogger.tsx`**:
- Group exercises by `superset_group` when rendering
- Superset groups get a colored left border and a "Superset" label badge
- Long-press or dropdown menu option "Link as Superset" on exercise cards

**`src/components/workout/ExerciseCard.tsx`**:
- Add dropdown menu item "Link to Superset" that opens a picker of other exercises in the session
- Visual indicator: colored left border + "SS" badge when part of a superset

## 3. Rest Timer

**New component: `src/components/workout/RestTimer.tsx`**:
- Floating timer that appears after completing a set
- Preset buttons: 30s, 60s, 90s, 120s, 180s, custom
- Countdown display with circular progress
- Audio notification (browser `Notification` API or a beep tone via `AudioContext`)
- Auto-starts configurable default rest time after set completion
- Can be dismissed or adjusted mid-countdown
- Minimized state: small floating pill at bottom of screen showing remaining time

**`src/components/workout/WorkoutLogger.tsx`**:
- Render `RestTimer` component
- Pass a callback from `completeSet` to trigger the timer

**`src/components/workout/SetRow.tsx`**:
- After `handleComplete(true)`, call the rest timer trigger callback (passed via props or context)

## 4. Fix Load Last Session

The bug is in `getLastSessionSets` (line 877-906 of workoutStore.ts). It queries with `.ilike('exercise_name', normalizedName)` but `normalizedName` is lowercased while the DB stores mixed case. The `.ilike` should work case-insensitively, but the real issue is `.limit(1)` returns the most recent exercise entry, which could be from the **current** active workout (not yet completed). Also, the filter `workout.is_completed` check on line 900 rejects the current session but returns `[]` instead of looking further back.

**Fix in `src/stores/workoutStore.ts` `getLastSessionSets`**:
- Change the query to filter out the current active workout: add `.neq('workout_id', activeWorkout?.id)` or use the inner join to filter `workouts.is_completed = true`
- Use `.eq('workouts.is_completed', true)` in the inner join filter so only completed workouts are considered
- Increase `.limit(5)` and find the first one that belongs to the current user and is completed, since the current limit(1) may hit the active session

**Also fix in `ExerciseCard.tsx`**:
- The `loadLastSession` function works correctly once `getLastSessionSets` returns proper data — no changes needed there

## 5. Warm-up Sets vs Working Sets

**Database migration**:
- `ALTER TABLE exercise_sets ADD COLUMN set_type text NOT NULL DEFAULT 'working';`
- Valid values: `'warmup'`, `'working'`

**`src/types/workout.ts`**:
- Add `set_type: 'warmup' | 'working'` to `ExerciseSet` interface

**`src/components/workout/SetRow.tsx`**:
- Add a small toggle/badge in the set number column: tap set number to toggle between "W" (warmup, muted style) and the set number (working)
- Warmup sets get a muted/dimmed visual treatment (lower opacity, different background)
- Warmup sets show "W" instead of the set number

**`src/components/workout/ExerciseCard.tsx`**:
- Update header row to show "Type" or integrate into set number column
- "Add Set" button gets a small dropdown: "Add Working Set" / "Add Warm-up Set"
- Completed set count only shows working sets: `exercise.sets?.filter(s => s.is_completed && s.set_type === 'working').length`

**Volume calculation** (all locations):
- `WorkoutLogger.tsx` totalVolume calculation: filter to `set_type === 'working'` only
- `workoutStore.ts` `completeSet`: only check PR on working sets
- `movementPatterns.ts` calculations: only count working sets
- `finishWorkout`: calculate `total_volume` from working sets only

**`src/stores/workoutStore.ts`**:
- `addSet` accepts optional `setType: 'warmup' | 'working'` parameter, defaults to `'working'`
- Update set insert to include `set_type`

## File Changes Summary

| File | Change |
|------|--------|
| `src/lib/movementPatterns.ts` | Add `EQUIPMENT_MODIFIERS`, update `normalizeVolume` |
| `src/types/workout.ts` | Add `set_type` to `ExerciseSet`, `superset_group` to `WorkoutExercise` |
| Migration | Add `set_type` to `exercise_sets`, `superset_group` to `workout_exercises` |
| `src/stores/workoutStore.ts` | Fix `getLastSessionSets`, add superset actions, update `addSet` for set type, filter warmups from volume |
| `src/components/workout/SetRow.tsx` | Warmup/working toggle, rest timer trigger |
| `src/components/workout/ExerciseCard.tsx` | Warmup set support, superset linking, split "Add Set" button |
| `src/components/workout/WorkoutLogger.tsx` | Superset grouping, rest timer integration, filter warmups from volume |
| `src/components/workout/RestTimer.tsx` | New floating rest timer component |
| `src/components/workout/MovementBalanceChart.tsx` | Pass exercise name for equipment-aware normalization |

