

# Plan: Warmup/Cooldown Sections + Collapsible Exercise Cards

## Two Changes

### 1. Warmup & Cooldown Sections

Add a `workout_section` column to `workout_exercises` with values `'warmup'`, `'main'` (default), and `'cooldown'`. Exercises are then grouped and rendered under labeled section headers.

**Database migration:**
- Add `workout_section text DEFAULT 'main' CHECK (workout_section IN ('warmup', 'main', 'cooldown'))` to `workout_exercises`
- Backfill all existing rows as `'main'`

**Affected workout builders:**

| Location | File | Change |
|----------|------|--------|
| User workout logger | `WorkoutLogger.tsx` | Group exercises by section, render 3 collapsible sections with headers ("Warm Up", "Exercises", "Cool Down"), each with its own "Add Exercise" button |
| Admin workout builder | `AdminWorkoutBuilderPage.tsx` | Same 3-section layout with section-aware add-exercise |
| Template editor | `TemplateEditor.tsx` | Add section field to template exercises so programs can prescribe warmup/cooldown |
| Exercise search | `ExerciseSearch.tsx` | Accept optional `section` prop so the inserted exercise gets the correct section tag |

**Store changes (`workoutStore.ts`):**
- `addExercise` accepts an optional `section` parameter (defaults to `'main'`)
- When inserting, pass `workout_section` to the database

**How it looks:**
```text
── WARM UP ──────────────── [+ Add] [▾]
   Foam Rolling
   Band Pull-Apart

── EXERCISES ────────────── [+ Add] [▾]
   Bench Press (Barbell)
   Incline DB Press
   Cable Fly

── COOL DOWN ────────────── [+ Add] [▾]
   Stretching
   Foam Rolling
```

### 2. Collapsible Exercise Cards

Make each `ExerciseCard` and `ConditioningCard` collapsible in the user-facing workout logger so users can collapse completed exercises while working out.

**Changes:**
- `ExerciseCard.tsx`: Wrap the `CardContent` (sets, add-set button) in a `Collapsible`. The header stays visible; tapping the card header or a chevron toggles the body. Auto-collapse when all sets are completed.
- `ConditioningCard.tsx`: Same pattern.
- Track collapsed state locally per card (no persistence needed -- all expand on page load).

The admin builder does NOT need collapsible cards (coach needs to see everything while building).

### Files to modify
1. **Migration SQL** — add `workout_section` column
2. **`src/types/workout.ts`** — add `workout_section` to `WorkoutExercise` type
3. **`src/stores/workoutStore.ts`** — update `addExercise` and `castExercises` for section
4. **`src/components/workout/WorkoutLogger.tsx`** — group exercises into 3 sections with headers and per-section add buttons
5. **`src/components/workout/ExerciseCard.tsx`** — wrap content in Collapsible
6. **`src/components/workout/ConditioningCard.tsx`** — wrap content in Collapsible
7. **`src/pages/AdminWorkoutBuilderPage.tsx`** — group exercises into 3 sections
8. **`src/components/admin/TemplateEditor.tsx`** — add section field to template exercise schema
9. **`src/components/workout/ExerciseSearch.tsx`** — pass section context through

