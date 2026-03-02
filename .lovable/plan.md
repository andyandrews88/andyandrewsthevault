

# Complete Admin Workout Builder & Calendar Refinements

## Issues Identified

1. **Calendar limited to 2 weeks** — needs continuous scrolling (show 4+ weeks, load more as you scroll)
2. **Drawer doesn't maximize** — `SheetContent` is fixed at `sm:max-w-md`, needs a maximize toggle to expand to full width
3. **Drawer missing frontend features** — The `CalendarWorkoutDrawer` has basic sets/reps/weight inputs but is missing: RIR input, set completion checkboxes, Load Last Session, Replace Exercise, exercise notes/coach cues, Add Set/Remove Set per exercise, Warmup set toggle, Admin metadata menu (Movement Pattern, Equipment Type, Time-Based, Unilateral, Set Video URL), video embed, previous session data column, warmup/working set type toggle
4. **Exercise library sync** — When exercises are added from the admin builder, they should auto-register in `exercise_library` (insert-if-not-exists). The `upsertExerciseLibraryField` utility already exists but the `CalendarWorkoutDrawer` doesn't use it. The admin edge function's `add_exercise` action should also auto-register exercise names.

## Plan

### 1. Calendar: Expand to 4 weeks + load more
**File:** `src/pages/AdminClientCalendar.tsx`
- Change from 14 days to 28 days (4 weeks)
- Add "Load More" buttons at top/bottom to extend the range by another 2 weeks
- Update the date range header and fetch call accordingly
- Adjust `WeeklyCalendarGrid` to handle variable-length `days` arrays

### 2. Drawer maximize toggle
**File:** `src/components/admin/CalendarWorkoutDrawer.tsx`
- Add a `maximized` state toggle
- When maximized: `SheetContent` class changes from `sm:max-w-md` to `sm:max-w-4xl` (matching the pattern used in `AdminDetailDrawer`)
- Add a maximize/minimize button in the drawer header

### 3. Full-feature drawer (match frontend ExerciseCard)
**File:** `src/components/admin/CalendarWorkoutDrawer.tsx` — major rewrite

The drawer exercise cards need to match what the frontend `ExerciseCard` + `SetRow` + `ExerciseActionSheet` provide. This means each exercise in the drawer gets:

- **Per-set rows** with: Set number, Weight (kg), Reps/Sec, RIR, Complete checkbox, Remove button
- **Add Set / Add Warmup** buttons
- **Previous session column** (via Load Last Session)
- **Coach cue / notes input** per exercise
- **Kebab menu** with: Load Last Session, Replace Exercise, Admin metadata (Movement Pattern, Equipment Type, Time-Based, Unilateral, Set Video URL), Remove Exercise
- **Warmup/Working set type toggle** (tap set number)

This effectively makes the drawer a mini version of `AdminWorkoutBuilderPage`, embedded in a Sheet.

### 4. Exercise library auto-sync
**File:** `supabase/functions/admin-workout-builder/index.ts`
- In the `add_exercise` action, after inserting into `workout_exercises`, also do an insert-if-not-exists into `exercise_library` (same pattern as frontend)
- This ensures any exercise name entered from the admin calendar drawer or builder page is registered globally

### Files Modified

| File | Changes |
|------|---------|
| `src/pages/AdminClientCalendar.tsx` | 4-week grid, load-more buttons |
| `src/components/admin/WeeklyCalendarGrid.tsx` | Support variable week count |
| `src/components/admin/CalendarWorkoutDrawer.tsx` | Full rewrite: maximize toggle, full exercise card with per-set rows, RIR, coach cues, admin metadata menu, Load Last Session, Replace Exercise |
| `supabase/functions/admin-workout-builder/index.ts` | Auto-register exercises in exercise_library on add_exercise |

