
# The TrainHeroic Engine: Program Library & Calendar Assignment

## Overview

This builds a full program management system inside the existing **Tracks** tab. Users browse a library of free 12-week programs, assign one to their calendar via a wizard modal, then see their daily programmed workout appear on the Dashboard and Workouts tab. The Dashboard gets a Program Switcher for users enrolled in multiple programs.

---

## What Already Exists (Kept As-Is)

- The existing **Tracks** tab in `Vault.tsx` currently has a static "Foundation Track" card linking to CoachRx plus a "Performance Track (Coming Soon)" card and a "1-on-1 Coaching" card
- These existing cards are **kept** — the new Program Library is added **below** them as a new section titled "Free Programs"
- The existing `WorkoutLogger`, `WorkoutTab`, and all workout store logic remain unchanged

---

## Database Architecture (4 new tables)

### Table 1: `programs`
Program metadata — one row per program.

```sql
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,               -- "Wendler 5/3/1"
  slug text NOT NULL UNIQUE,        -- "wendler"
  description text NOT NULL,
  category text NOT NULL DEFAULT 'strength',  -- strength | conditioning | functional | oly | add-on
  duration_weeks integer NOT NULL DEFAULT 12,
  days_per_week integer NOT NULL,
  difficulty text NOT NULL DEFAULT 'intermediate',  -- beginner | intermediate | advanced
  program_style text,               -- "wendler" | "fbb" | "oly" | "running" | "rowing"
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Table 2: `program_workouts`
Template workouts — one row per workout within a program.

```sql
CREATE TABLE public.program_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  week_number integer NOT NULL,      -- 1-12
  day_number integer NOT NULL,       -- 1-7 (day within the week's training schedule)
  workout_name text NOT NULL,
  exercises jsonb NOT NULL DEFAULT '[]',
  -- Each exercise: { name, sets, reps, percentage_of_1rm, tempo, notes, rest_seconds }
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Table 3: `user_program_enrollments`
Tracks which programs a user is enrolled in and their start date.

```sql
CREATE TABLE public.user_program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  training_days integer[] NOT NULL DEFAULT '{1,3,5}',  -- 0=Sun, 1=Mon...6=Sat
  status text NOT NULL DEFAULT 'active',               -- active | paused | completed
  addon_placement text,                                -- for add-ons: "strength_days" | "rest_days"
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);
```

### Table 4: `user_calendar_workouts`
The instantiated workouts placed on a user's personal calendar.

```sql
CREATE TABLE public.user_calendar_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  enrollment_id uuid NOT NULL REFERENCES public.user_program_enrollments(id) ON DELETE CASCADE,
  program_workout_id uuid NOT NULL REFERENCES public.program_workouts(id),
  scheduled_date date NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- `programs` and `program_workouts`: Public read (anyone authenticated), admin-only write
- `user_program_enrollments` and `user_calendar_workouts`: Users can only read/write their own rows

**Realtime:** Not needed for this feature.

---

## Program Library (Seeded Data)

Six programs are seeded into the `programs` table. All are 12 weeks, all free:

| Program | Style | Days/Week | Difficulty | Category |
|---------|-------|-----------|------------|----------|
| Wendler 5/3/1 | wendler | 4 | intermediate | strength |
| Functional Bodybuilding | fbb | 4 | intermediate | functional |
| Olympic Weightlifting Foundations | oly | 4 | intermediate | oly |
| Strength Foundation | foundation | 3 | beginner | strength |
| Running Add-on | running | 3 | beginner | conditioning |
| Rowing Add-on | rowing | 3 | beginner | conditioning |

Each program's `program_workouts` are seeded with representative template exercises (Weeks 1–12, covering the full 12-week cycle), using the `exercises` JSONB field for each day.

---

## UI: New Section in Tracks Tab

The Tracks tab (`src/pages/Vault.tsx`) gets a new section **below** the existing cards:

```
[Existing: Foundation Track card]   [Existing: Performance Track card]
[Existing: 1-on-1 Coaching card]

────────────────────────────────────────────
FREE PROGRAMS  (badge)
"12-Week Training Programs — Free for All Vault Members"

[Wendler 5/3/1]  [Functional BB]  [Oly Foundations]
[Strength Found.] [Running Add-on] [Rowing Add-on]
```

---

## New Components

### `src/components/tracks/ProgramLibrary.tsx`
- Renders the grid of program cards (3 columns desktop, 2 tablet, 1 mobile)
- Fetches from `programs` table and `user_program_enrollments` (to know which are already enrolled)
- Each card shows: name, description, difficulty badge, days/week, duration badge ("12 WEEKS"), category icon
- **Enrolled state**: button changes to "Enrolled ✓" in green, with a "View Progress" link
- **Select button** opens the `ProgramAssignmentWizard`

### `src/components/tracks/ProgramCard.tsx`
Individual program card. Props: `program`, `isEnrolled`, `onSelect`.
- Special styling for Wendler (strength-primary accent), FBB (functional orange), Add-ons (secondary)
- "FREE" badge on every card

### `src/components/tracks/ProgramAssignmentWizard.tsx`
A Shadcn `Dialog` with a two-step wizard:

**Step 1 — When do you start?**
- Date picker (Shadcn Calendar in Popover, defaulting to today)
- Info text: "Your first workout will be scheduled for [chosen date]"

**Step 2 — Which days do you train?**
- Multi-select day chips: M T W Th F Sa Su (toggleable buttons)
- Pre-selects sensible defaults based on program's `days_per_week` (e.g., Wendler defaults M/Tu/Th/Fr)
- For add-on programs (Running, Rowing): extra question: "Add to existing strength days or rest days?" toggle
- Validation: must select exactly `program.days_per_week` days
- Confirm button: "Start Program →"

**On confirm:**
1. Insert row into `user_program_enrollments`
2. Call a function that maps `program_workouts` (week 1–12, day 1–N) onto the user's actual calendar dates based on start date and selected training days
3. Insert all 12 weeks × days into `user_calendar_workouts` in one batch insert
4. Show success toast: "Program started! Your first workout is [date]."
5. Close dialog

### `src/components/tracks/ProgramAssignmentWizard.tsx` — instantiation logic

The instantiation algorithm:
```
trainDays = sorted array of day-of-week numbers (0=Sun...6=Sat)
currentDate = startDate
workoutIndex = 0 (iterating through sorted program_workouts by week+day)

for each program_workout (sorted by week_number ASC, day_number ASC):
  advance currentDate to next occurrence of trainDays[workoutIndex % trainDays.length]
  insert user_calendar_workout(scheduled_date = currentDate, ...)
  workoutIndex++
```

This ensures workouts land on the user's actual chosen training days, spanning ~12 weeks.

---

## Wendler-Specific UI: Percentage Calculator

**New: `src/components/tracks/WendlerPercentageCalc.tsx`**

Shown inside the `DailyProgramWorkout` component (below) when the active program style is `"wendler"`.

- Input: user enters their Training Max (1RM × 0.9 is the Wendler convention, but user just enters a number)
- Displays a table:
  | Week | 65% | 75% | 85% |
  |------|-----|-----|-----|
  | 1    | Xcalc | Xcalc | Xcalc |
  | 2    | Xcalc | Xcalc | Xcalc |
  | 3    | Xcalc | Xcalc | Xcalc |
- Auto-calculates as user types, rounds to nearest 5 lbs (standard Wendler practice)
- Compact card, collapses behind a "Show Calculator" button

---

## FBB-Specific UI: Tempo Display

When the active program style is `"fbb"`, exercises in the workout display a **Tempo** field prominently:
- Shown as a styled badge: `30X1` in monospace font with a label "TEMPO"
- Each exercise in the JSONB `exercises` field has a `tempo` property (e.g., `"30X1"` meaning 3s eccentric, 0 pause, explosive concentric, 1s top pause)
- A small tooltip explains what the digits mean on hover

---

## Dashboard Integration: Program Switcher

**Modified: `src/components/dashboard/VaultDashboard.tsx`**

If the user has any active enrollments, a new `ActiveProgramSwitcher` component is rendered at the top, before `AnnouncementBanner`.

### `src/components/tracks/ActiveProgramSwitcher.tsx`
- Fetches `user_program_enrollments` + today's `user_calendar_workouts`
- If only one active program: shows a single card "Today: [Workout Name]" with a progress ring
- If multiple active programs: shows a horizontal tab bar (Shadcn Tabs) — one tab per program
- Each tab label shows a **progress ring** (SVG circle, filled based on `completed / total` calendar workouts)
- Selecting a tab sets `activeProgramId` in local state
- Below the tabs: shows today's programmed workout for the selected program

**Progress Ring calculation:**
```
completed = count of user_calendar_workouts WHERE is_completed=true AND enrollment_id=X
total = count of user_calendar_workouts WHERE enrollment_id=X
percentage = (completed / total) * 100
```

### `src/components/tracks/DailyProgramWorkout.tsx`
Shown in the Dashboard under the Program Switcher. Displays the scheduled workout for today:
- Workout name
- Exercise list from the JSONB (exercise name, sets × reps, notes)
- "Mark as Complete" button → updates `user_calendar_workouts.is_completed = true`
- If program style is `"wendler"`: shows `WendlerPercentageCalc` above the exercise list
- If program style is `"fbb"`: exercises show `TEMPO` badge
- If no workout scheduled today: "Rest Day" with a small recovery tip

---

## New Zustand Store: `src/stores/programStore.ts`

```typescript
interface ProgramState {
  programs: Program[];
  enrollments: UserProgramEnrollment[];
  calendarWorkouts: UserCalendarWorkout[];
  activeProgramId: string | null;
  
  fetchPrograms: () => Promise<void>;
  fetchEnrollments: () => Promise<void>;
  fetchTodaysWorkouts: () => Promise<void>;
  enrollInProgram: (programId, startDate, trainingDays, addonPlacement?) => Promise<void>;
  unenrollFromProgram: (enrollmentId) => Promise<void>;
  markWorkoutComplete: (calendarWorkoutId) => Promise<void>;
  setActiveProgram: (programId) => void;
}
```

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/components/tracks/ProgramLibrary.tsx` | Grid of all program cards |
| `src/components/tracks/ProgramCard.tsx` | Individual program card |
| `src/components/tracks/ProgramAssignmentWizard.tsx` | 2-step modal wizard |
| `src/components/tracks/ActiveProgramSwitcher.tsx` | Dashboard program tab bar + progress rings |
| `src/components/tracks/DailyProgramWorkout.tsx` | Today's programmed workout display |
| `src/components/tracks/WendlerPercentageCalc.tsx` | Wendler-specific % calculator |
| `src/stores/programStore.ts` | All program state and DB operations |
| `supabase/migrations/[timestamp]_programs.sql` | Creates 4 tables + seeds programs + RLS |

### Modified Files
| File | Change |
|------|--------|
| `src/pages/Vault.tsx` | Add `<ProgramLibrary />` below existing tracks cards |
| `src/components/dashboard/VaultDashboard.tsx` | Add `<ActiveProgramSwitcher />` at top when enrolled |

---

## Key Implementation Notes

1. **Program seeding** — The migration seeds the 6 programs AND representative program_workouts for each (representative 12-week templates). The `exercises` JSONB field stores structured exercise data so no additional DB tables are needed for the exercise list within a workout.

2. **Instantiation is done client-side** in the wizard store action — we compute all calendar dates locally then batch-insert, avoiding a need for an edge function.

3. **Add-on placement** — when a Running or Rowing add-on is selected with "rest days" placement, the instantiation logic uses the *inverse* of their main program's training days as the target days, or if no main program exists, just the days they pick.

4. **No changes to the existing WorkoutLogger or WorkoutTab** — the program system is its own parallel track. Users still free-log workouts as before. The Daily Program Workout view on the dashboard is a read/complete-only view, not a full logger.

5. **Progress ring** — implemented as a pure SVG `<circle>` with `stroke-dashoffset` to show completion %. No external charting library needed.
