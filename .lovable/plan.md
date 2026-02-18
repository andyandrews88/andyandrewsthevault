
# Three-Part Fix: Interactive Programs, FBB Full-Body Redesign & Program Labels

## What the User Reported (3 Issues)

1. **Program cards are read-only** — There's no way to log actual weights inside a program workout. Week 2 should show what was hit in Week 1. All data should feed the Dashboard and Weekly Review.
2. **FBB program is Upper/Lower split** — Should be full-body sessions. This requires a database data fix (updating the seeded exercises).
3. **Workout log cards don't show the program name** — When a program workout card appears in the Workouts tab on a given date, it has no label telling you which program it belongs to.

---

## Root Cause Analysis

### Issue 1: Programs are display-only, no logging
`DailyProgramWorkout.tsx` shows exercises as static text rows (`ExerciseRow`). There is no weight entry, no set completion, no history carry-forward. The "Mark as Complete" button marks the entire `user_calendar_workouts` row as done (boolean) but saves zero performance data.

The existing workout system (`workouts` + `workout_exercises` + `exercise_sets` tables) is what actually captures weight/rep data. The program system needs to **pre-populate a linked free-log workout** when a user starts logging a program session, using the same `exercise_sets` infrastructure so history, PRs, and Dashboard volume all work automatically.

**The fix:** When a user taps "Start Logging" on a program workout card, the system:
1. Creates a `workouts` row (linked to the same date, named after the program + workout name)
2. Pre-populates `workout_exercises` rows from the program's exercise list
3. Pre-populates one `exercise_sets` row per exercise (with `reps` pre-filled from the template)
4. Sets `user_calendar_workouts.is_completed = true` when they finish
5. The user then logs weight/reps using the existing `ExerciseCard` + `SetRow` UI they already know

This means:
- Previous session weights flow through automatically (the `getLastSessionSets` system already handles this)
- PRs fire automatically
- Volume appears in Dashboard's `workoutsCompleted` and `totalVolume` (already queries `workouts` table)
- Weekly Review already picks up the data
- No new tables needed

### Issue 2: FBB exercises are Upper/Lower split
The database has 4 FBB workouts per week: "Lower Body A", "Upper Body Push", "Lower Body B", "Upper Body Pull". This is what gets displayed. The program data in the `program_workouts` table for `program_id = '5f9fcd6b-3157-4b49-b5a3-696c02789318'` needs to be updated across all 12 weeks with full-body sessions instead.

**New FBB structure (4 full-body days per week):**
- **Day 1: Full Body — Strength Bias** (squat pattern + push + pull + hinge + core)
- **Day 2: Full Body — Posterior Chain** (hinge pattern + row + press + carry + accessory)
- **Day 3: Full Body — Athletic Power** (explosive pattern + upper + lower + core)
- **Day 4: Full Body — Hypertrophy** (isolation + compound, tempo-focused throughout)

This is a pure database data update — no code changes for this issue.

### Issue 3: No program label on workout cards
`DailyProgramWorkout.tsx` header shows only the workout name (e.g., "Squat Day"). There is no visible label indicating which program (e.g., "Wendler 5/3/1") this comes from. 

The `calendarWorkout` prop already contains `enrollment.program.name` — it just isn't being rendered. A small badge showing the program name needs to be added to the card header.

---

## Implementation Plan

### Part A: Interactive Program Logging

#### New component: `ProgramWorkoutLogger.tsx`
This replaces the static `DailyProgramWorkout` when the user taps "Start Logging". It:
- Creates/finds a linked `workouts` row for this date+program
- Pre-populates exercises from the template on first launch
- Uses the existing `ExerciseCard` + `SetRow` from the free-log system
- Has a "Finish Session" button that marks `user_calendar_workouts.is_completed = true`
- Previous session data shows in the "Prev" column automatically (via `getLastSessionSets`)

#### Updated: `DailyProgramWorkout.tsx`
Add two new states:
- **Default view**: Exercise list (read-only) + "Start Logging" button
- **Active logging view**: Shows `ProgramWorkoutLogger` inline (or transitions to it)

The card header gets a program name badge (fixing Issue 3 simultaneously).

#### Updated: `programStore.ts`
Add a new action: `startProgramWorkoutSession(calendarWorkoutId, programWorkoutId, date)`:
```typescript
startProgramWorkoutSession: async (calendarWorkoutId, programWorkout, date) => {
  // 1. Check if a linked workout already exists for this date with this name
  // 2. If not, create one via supabase insert into workouts
  // 3. Pre-populate workout_exercises from programWorkout.exercises
  // 4. Pre-populate one exercise_set per exercise with reps from template
  // 5. Return the workoutId so WorkoutLogger can take over
}
```

#### Data flow after fix:
```
User taps "Start Logging" on Wendler Squat Day
  → Creates workouts row: { workout_name: "Wendler 5/3/1 — Squat Day", date: "2026-02-19" }
  → Creates workout_exercises: Back Squat, Romanian Deadlift, Leg Press, Leg Curl, Plank
  → Creates exercise_sets with reps pre-filled from template
  → User logs weights in ExerciseCard (same UI as free-log)
  → User taps "Finish" → workouts.is_completed = true, user_calendar_workouts.is_completed = true
  → Dashboard sees new completed workout → workoutsCompleted count goes up
  → totalVolume is calculated by the existing DB trigger
  → getLastSessionSets("back squat") will now return Week 1 data for Week 2
  → Weekly Review AI picks up the correct data
```

#### Updated: `WorkoutLogger.tsx`
When a program workout card's "Start Logging" is tapped, instead of showing `DailyProgramWorkout` + a separate "Start Workout" prompt, the WorkoutLogger needs to handle transitioning from program card → active logging state. 

The cleanest approach: `DailyProgramWorkout` handles its own "Start Logging" → creates the workout → calls `fetchActiveWorkout()` → the existing `WorkoutLogger` active-workout screen takes over, showing the pre-populated exercises.

This keeps the WorkoutLogger's existing exercise card/set row UI completely intact — users get the full weight-logging experience with numeric keypad popup, autofill from last session, PR detection, etc.

#### Updated: `dashboardStore.ts`
The `fetchAll` function already queries `workouts` table for `workoutsCompleted` and `totalVolume`. Since program sessions now create real `workouts` rows, the Dashboard will pick them up automatically with **zero changes to the store**.

The only dashboard addition needed: show today's programmed workouts in `TodayTraining` / `TodaySnapshot`. Currently `todayTraining.workoutName` only shows free-log workouts. We'll add `programWorkoutsToday` count to this fetch.

#### Updated: `WeeklyReview.tsx` + edge function
The weekly review already sums up all completed `workouts` rows. Since program logging now creates real `workouts` rows, it will automatically include them. The edge function needs a small enhancement: include the program names in the summary so the AI can say "You completed 3 Wendler sessions and 2 FBB sessions" instead of just "3 workouts".

---

### Part B: FBB Full-Body Program Data Rewrite

A database data update replaces all FBB `program_workouts` rows (48 rows across 12 weeks) with full-body sessions. The 4 session types cycle through the week:

**Day 1 — Full Body Strength:**
Back Squat (30X1), Romanian Deadlift (31X1), Weighted Pull-up (30X1), Dumbbell Bench Press (30X1), Pallof Press (controlled)

**Day 2 — Posterior Chain & Pull:**
Trap Bar Deadlift (21X1), Chest-Supported Row (20X1), Bulgarian Split Squat (30X1), Single-Arm DB Press (20X1), Copenhagen Plank

**Day 3 — Athletic & Power:**
Power Clean (explosive), Push Press (X0X1), Box Jump (reactive), Bent-Over Row (20X1), Ab Wheel Rollout

**Day 4 — Hypertrophy & Tempo:**
Incline DB Press (3011), Cable Row (2011), Leg Press (3010), Face Pull (2020), Hammer Curl (2011)

Load progression across 12 weeks follows FBB convention: sets/reps increase in weeks 1-4 (accumulation), reset/intensify in weeks 5-8, peak in weeks 9-12.

This requires a SQL `UPDATE` via the database tool for all FBB program_workouts rows.

---

### Part C: Program Name Badge on Cards

`DailyProgramWorkout.tsx` card header currently shows:
```
🏋️ Squat Day    [Done badge if completed]
```

After fix:
```
[WENDLER 5/3/1 badge]
🏋️ Squat Day    [Done badge if completed]
```

The `calendarWorkout.enrollment?.program?.name` field is already available in the prop. A small `Badge variant="outline"` with the program name is added above the workout title in the `CardHeader`.

---

## Files Changed

| File | Type of Change |
|------|---------------|
| `src/components/tracks/DailyProgramWorkout.tsx` | Add program name badge (Issue 3) + "Start Logging" button (Issue 1) |
| `src/components/tracks/ProgramWorkoutLogger.tsx` | **New** — handles pre-population + links to active workout |
| `src/stores/programStore.ts` | Add `startProgramWorkoutSession` action |
| `src/stores/workoutStore.ts` | Minor: export `startWorkoutFromTemplate` helper or reuse `startWorkout` + `addExercise` |
| `src/stores/dashboardStore.ts` | Add program workout count to today's training data for TodaySnapshot |
| FBB program_workouts DB rows | Data update: replace 48 Upper/Lower rows with 48 Full-Body rows |

## What Does NOT Change

- All existing free-log workout functionality (`ExerciseCard`, `SetRow`, `WeightInputPopup`, PR system)
- The `workouts` + `exercise_sets` table schema (no migration needed)
- The Weekly Review edge function (it already reads from `workouts` — no changes needed)
- The `ActiveProgramSwitcher` on the Dashboard
- The Tracks tab program library + enrollment wizard
- RLS policies (unchanged)

## Key User Experience After Fix

1. User navigates to Workouts tab → selects Feb 19 → sees "Wendler 5/3/1 — Squat Day" card with program badge
2. Card shows exercises (Back Squat 3×5/5/5+, etc.) with a "Start Logging" button
3. User taps "Start Logging" → the active workout logger opens, pre-populated with all 5 exercises, each with one empty set (reps pre-filled from template)
4. "Prev" column in SetRow shows last week's weights (if they've done Week 1 previously)
5. User logs their Back Squat sets → PR fires if they hit a new max
6. User taps "Finish" → workout saved, calendar workout marked complete, volume counted in Dashboard
7. On Dashboard: "1 workout completed today — Wendler 5/3/1: Squat Day, 4,200 lbs volume"
8. Weekly Review AI: "You completed 3 Wendler sessions this week with 12,500 lbs total volume. Back Squat PR hit at 225 lbs."
