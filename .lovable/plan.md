

# Plan: Add Plyometric & Rotational Movement Patterns with Speed Tracking

## Database Migration

Add 3 columns to `exercise_sets`:
- `distance_m numeric` (for broad jumps, sprints)
- `height_cm numeric` (for box jumps, depth jumps)  
- `speed_mps numeric` (for sprints — meters per second)

Add `is_plyometric boolean default false` to `exercise_library`.

## Movement Patterns (`src/lib/movementPatterns.ts`)

Add `plyometric` and `rotational` to `MovementPattern` type and all related maps:
- **Labels:** Plyometric, Rotational
- **Short codes:** PLY, ROT
- **Difficulty coefficients:** plyometric: 0.80, rotational: 0.55
- **Colors:** new HSL values
- Add to `ALL_PATTERNS` array

Add plyo intensity tiers for volume calculation:
- **Low** (jumping jacks, skipping): 0.5x
- **Moderate** (box jumps, broad jumps): 1.0x
- **High** (depth jumps, bounding, single-leg hops): 1.5x

**Plyometric volume formula:** `contacts × intensity_multiplier × (1 + height_cm/100)`. For sprints: `distance_m × speed_mps × 0.1` (power-output proxy).

**Rotational volume:** Standard weight × reps (same as existing).

Move exercises from `core` pattern map: Woodchop, Landmine Rotation, Medicine Ball Slam/Throw → `rotational`. Add new plyo exercises to pattern map: Box Jump, Broad Jump, Depth Jump, Squat Jump, Tuck Jump, Split Squat Jump, Bounding, Single-Leg Hop, Lateral Bound, Skater Jump, Plyo Push-Up, Sprint, Sprints (Hill), Sprints (Track), Shuttle Run.

## Exercise Categories (`src/types/workout.ts`)

Add `plyometrics` category with exercises: Box Jump, Broad Jump, Depth Jump, Drop Jump, Tuck Jump, Squat Jump, Split Squat Jump, Bounding, Single-Leg Hop, Lateral Bound, Skater Jump, Hurdle Hop, Plyo Push-Up, Sprint, Sprints (Hill), Sprints (Track), Shuttle Run.

Move Box Jump, Broad Jump, Sprint, Sprints (Hill), Sprints (Track), Shuttle Run from `conditioning`.

Add `plyometrics` to `CATEGORY_LABELS`.

## UI: SetRow (`src/components/workout/SetRow.tsx`)

When exercise `is_plyometric`:
- Show **height** input (small number field, placeholder "ht") 
- Show **distance** input (placeholder "dist m")
- Show **speed** input (placeholder "m/s") — for sprints
- These replace the weight column (most plyos are bodyweight)

## UI: ExerciseCard

Pass `isPlyometric` flag from exercise library lookup to `SetRow`.

## Admin Menu (`src/components/workout/AdminExerciseMenu.tsx`)

Add a **Plyometric** toggle (like the existing Time-Based and Unilateral toggles) that sets `is_plyometric` on the exercise library.

## Exercise Library Upsert (`src/lib/exerciseLibraryUpsert.ts`)

Add `is_plyometric` to the allowed fields.

## Files to modify

| File | Change |
|------|--------|
| **DB migration** | Add `distance_m`, `height_cm`, `speed_mps` to `exercise_sets`; `is_plyometric` to `exercise_library` |
| `src/lib/movementPatterns.ts` | Add `plyometric` + `rotational` to types, coefficients, colors, labels, pattern maps, volume calc, `ALL_PATTERNS` |
| `src/types/workout.ts` | Add `plyometrics` category, update labels, move sprint exercises |
| `src/components/workout/SetRow.tsx` | Conditionally render height/distance/speed inputs for plyo exercises |
| `src/components/workout/ExerciseCard.tsx` | Pass `isPlyometric` to SetRow |
| `src/components/workout/AdminExerciseMenu.tsx` | Add Plyometric toggle |
| `src/lib/exerciseLibraryUpsert.ts` | Add `is_plyometric` to field type |

