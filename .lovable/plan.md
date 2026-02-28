

# Two Changes: Calendar Workout Navigation + Vault Tab Bar Redesign

## 1. Calendar Workout Card Click → Navigate to Workout

**Problem**: Clicking a regular logged workout card in the calendar detail dialog does nothing.

**Fix** in `ProgramCalendarView.tsx`:
- Make each regular workout `Card` clickable with a cursor-pointer and onClick handler
- On click: close the dialog, call `loadWorkoutById(w.id)` on the workout store (or set the active workout), switch the WorkoutTab sub-tab to "logger"
- Need to pass a callback like `onOpenWorkout(workoutId)` up to `WorkoutTab` which loads the workout into the logger
- The `WorkoutTab` already has `setActiveTab("logger")` capability — wire it through props

**Files**:
- `src/components/workout/ProgramCalendarView.tsx` — add `onOpenWorkout` prop, make regular workout cards clickable
- `src/components/workout/WorkoutTab.tsx` — pass `onOpenWorkout` handler that loads the workout and switches to logger tab
- `src/stores/workoutStore.ts` — verify there's a method to load a specific workout by ID (likely `fetchActiveWorkout` or similar; may need to add `loadWorkoutById`)

## 2. Vault Tab Bar — Replace Side-Scroll with a Cleaner Layout

**Problem**: 9 tabs in a horizontal scroll bar looks cluttered on mobile.

**Proposed approach**: On mobile, replace the scrollable `TabsList` with a fixed **2-row grid** (icon + label) that shows all tabs at once without scrolling. On desktop, keep the current inline row.

Layout on mobile: 5 tabs on row 1, 4 tabs on row 2 (or 4+4+1 if admin), centered. Each tab is a compact icon-above-label button. This eliminates scrolling entirely while keeping all tabs visible and tappable.

**Files**:
- `src/pages/Vault.tsx` — restructure the `TabsList` to use a responsive grid: `grid grid-cols-5 sm:inline-flex` so on mobile it wraps into rows, on desktop it stays inline.

