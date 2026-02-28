

# Fix Weight Input for Bodyweight & Isometric Exercises

## Problem
When logging timed bodyweight exercises (Plank, Side Plank, etc.), the UI shows "Kg" / "Lbs" as the weight column header and requires a weight value to complete a set. For a bodyweight plank, the user shouldn't need to enter anything — the system should auto-use their bodyweight via the existing multiplier system. If they add extra load (weighted plank), they enter ONLY the additional weight.

## How It Already Works (Backend)
`calculateSetVolume` and `calculateTimedSetVolume` in `movementPatterns.ts` already handle this correctly:
- If exercise is in `BODYWEIGHT_EXERCISES` and weight=0: uses `BW × multiplier`
- If exercise is in `BODYWEIGHT_EXERCISES` and weight>0: uses `BW × multiplier + weight`

The problem is purely UI — the input demands a weight and won't let you complete without one.

## Changes

### 1. `ExerciseCard.tsx` — Detect bodyweight exercises
- Import `isBodyweightExercise` from `movementPatterns.ts`
- Compute `isBW = isBodyweightExercise(exercise.exercise_name)`
- Pass `isBodyweight` prop to `SetRow`
- Change column header from "Kg"/"Lbs" to "+Load" when `isBW` is true

### 2. `SetRow.tsx` — Allow completion without weight for BW exercises
- Accept `isBodyweight` prop
- When `isBodyweight` is true:
  - Weight button shows "BW" instead of unit when empty (no additional load)
  - Allow completing a set with weight=0 (checkbox enabled when only reps/duration filled)
  - If user taps weight button and enters a value, treat it as additional load
- Update `handleComplete`: when `isBodyweight` and no weight entered, pass `0` as weight (the volume calc handles the rest)

### 3. `WeightInputPopup.tsx` — Context for bodyweight exercises
- Accept optional `isBodyweight` prop
- When true, show helper text: "Additional load on top of bodyweight" above the keypad
- Add a "Bodyweight Only" quick button that logs 0

### 4. `movementPatterns.ts` — No changes needed
The `calculateSetVolume` and `calculateTimedSetVolume` functions already handle weight=0 for bodyweight exercises correctly using the multiplier table.

## Files Changed

| File | Change |
|------|--------|
| `src/components/workout/ExerciseCard.tsx` | Detect BW exercise, pass prop, change header label |
| `src/components/workout/SetRow.tsx` | Accept `isBodyweight`, allow weight=0 completion, show "BW" label |
| `src/components/workout/WeightInputPopup.tsx` | Add BW context hint and "Bodyweight Only" button |

