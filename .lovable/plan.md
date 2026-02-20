

# Train Section Fixes + RIR Feature

## Issue 1: Conditioning Data Missing from Weekly Review

**The Problem**: When you log conditioning workouts (running, rowing, etc.), none of that data makes it into the Weekly Review card or the AI-generated review. The weekly review only shows strength volume (`totalVolume` from `workouts.total_volume`), which is calculated as weight x reps — conditioning sets have duration, distance, and calories instead, so they contribute zero to the stats.

**The Fix**: Expand the `WeeklyData` interface in `dashboardStore.ts` to include conditioning-specific metrics:

- Add new fields: `conditioningSessions` (count of workouts with conditioning exercises), `totalConditioningMinutes` (sum of `duration_seconds` across all conditioning sets this week), `totalConditioningCalories` (sum of calories from conditioning sets)
- In `dashboardStore.fetchAll()`: add a new parallel query that fetches `conditioning_sets` joined through `workout_exercises` and `workouts` for the past 7 days, aggregating duration and calories
- Update `WeeklyReview.tsx` to show a conditioning stat in the stats grid (e.g., "45 min" conditioning time) when conditioning data exists
- Update the `generateWriteup()` function to mention conditioning work in the text summary
- Update the `weekly-review` edge function prompt to include conditioning data lines (minutes, calories, session count) so the AI review accounts for the full training picture

**Files changed**: `src/stores/dashboardStore.ts`, `src/components/dashboard/WeeklyReview.tsx`, `supabase/functions/weekly-review/index.ts`

---

## Issue 2: Past Session Logging Shows Today's Workout Too

**The Problem**: When you navigate to a past date and press "Start Logging" on a missed program session, the `WorkoutLogger` creates the active workout for that past date — but the `programWorkoutsForDate` array still fetches and renders today's program cards (or the selected date's cards) alongside the active logger UI. This creates a cluttered, confusing screen where you see both the logger and the DailyProgramWorkout cards at the same time.

**The Fix**: In `WorkoutLogger.tsx`, when `activeWorkout` exists (the logger is showing), hide the program workout cards entirely. The logger IS the session — there's no need to also show the DailyProgramWorkout card underneath it.

Specifically:
- In the active workout view (the return block starting at line 319), the code already only shows the logger. The issue is that after pressing "Start Logging", `fetchActiveWorkout` picks up the new workout and shows the logger, but because `selectedDate` might still be set to a date where program workouts exist, if the user navigates back or the component re-renders with `activeWorkout === null` briefly, both show up.
- The real fix: when `activeWorkout` is not null, skip rendering `programWorkoutsForDate` entirely. Currently lines 215-231 render program cards even when the logger could take over. Add a guard: only show `programWorkoutsForDate` cards when `!activeWorkout`.
- Also: when `activeWorkout` exists and its date differs from today, don't show today's program cards at all. The `fetchProgramWorkoutsForDate` should fetch for `activeWorkout.date` when a workout is active, not for `selectedDate`.

**Files changed**: `src/components/workout/WorkoutLogger.tsx`

---

## Issue 3: RIR (Reps in Reserve) — My Opinion

**Should you add it?** Yes, but only if the AI review actually uses it — and I'd make sure it does. Here's why RIR is valuable for a coaching platform specifically:

**What RIR tells you that weight/reps don't**: Two athletes can bench 100kg for 8 reps. One had 3 reps left in the tank (RIR 3, moderate effort). The other was grinding on rep 8 (RIR 0, max effort). The numbers look identical, but the training stimulus and fatigue are completely different. Without RIR, the AI review can only say "you did 8 reps at 100kg." With RIR, it can say "your sets averaged RIR 1 — you're pushing very close to failure. Consider backing off to RIR 2-3 for your accessory work to manage fatigue."

**How I'd implement it**:

1. **Database**: Add an `rir` column (integer, nullable) to the `exercise_sets` table — mirrors the existing `rpe` column pattern
2. **UI**: Add a small optional RIR input to each `SetRow`, placed next to the reps field. A simple numeric input (0-5) or a quick-tap row of buttons (0, 1, 2, 3, 4+). It should be unobtrusive — most users won't fill it in every set, and that's fine
3. **Weekly Data**: In `dashboardStore`, calculate `avgRIR` across all completed sets that have RIR data this week
4. **AI Review**: Pass `avgRIR` and a breakdown (e.g., "45% of sets were at RIR 0-1") to the `weekly-review` edge function. Update the system prompt to interpret RIR data for training intensity recommendations
5. **The ExerciseSet type** already has an `rpe` field — RIR and RPE are related (RPE 10 = RIR 0, RPE 8 = RIR 2). I'd add RIR as its own field rather than reusing RPE, since athletes intuitively understand "how many reps did I have left" better than the Borg RPE scale

**Files changed**: New migration for `rir` column on `exercise_sets`, `src/types/workout.ts`, `src/components/workout/SetRow.tsx`, `src/stores/workoutStore.ts`, `src/stores/dashboardStore.ts`, `src/components/dashboard/WeeklyReview.tsx`, `supabase/functions/weekly-review/index.ts`

---

## Complete Implementation Plan

### Step 1 — Database Migration
- Add `rir integer` column (nullable) to `exercise_sets` table

### Step 2 — Conditioning in Weekly Data (`dashboardStore.ts`)
- Add `conditioningSessions`, `totalConditioningMinutes`, `totalConditioningCalories` to `WeeklyData` interface
- Add parallel query in `fetchAll()` joining `conditioning_sets` through `workout_exercises` and `workouts` for the past 7 days
- Aggregate duration_seconds and calories from completed conditioning sets

### Step 3 — Fix Past Session UI (`WorkoutLogger.tsx`)
- When `activeWorkout` exists, do not render `programWorkoutsForDate` cards
- When `activeWorkout` exists with a date different from today, fetch program workouts for the active workout's date, not `selectedDate`
- This ensures only the active logger is visible during a session

### Step 4 — Add RIR to SetRow (`SetRow.tsx`)
- Add a small RIR input (0-5 number input or button group) next to the reps input
- Update the grid layout from 6 columns to 7 to accommodate RIR
- Pass RIR value through `onUpdate` and `onComplete` to the store
- Update `completeSet` in `workoutStore.ts` to save RIR alongside weight and reps

### Step 5 — Update Weekly Review UI (`WeeklyReview.tsx`)
- Add conditioning stats to the stats grid (show conditioning minutes when data exists)
- Add average RIR to the stats grid when RIR data exists
- Update `generateWriteup()` to mention conditioning work and average RIR
- Show a 5th and 6th stat card only when data exists (responsive grid)

### Step 6 — Update AI Review Edge Function (`weekly-review/index.ts`)
- Add conditioning data lines to the prompt (sessions, total minutes, total calories)
- Add RIR data lines to the prompt (average RIR, percentage of sets at RIR 0-1)
- Update the system prompt to instruct the AI to consider training intensity (RIR), conditioning work, and all available metrics when generating the review

### Files Changed Summary

| File | Change |
|------|--------|
| `exercise_sets` table | Add `rir integer` column (nullable) |
| `src/types/workout.ts` | Add `rir` to `ExerciseSet` interface |
| `src/stores/dashboardStore.ts` | Add conditioning + RIR fields to WeeklyData, fetch conditioning_sets data |
| `src/stores/workoutStore.ts` | Pass RIR through completeSet, include in set updates |
| `src/components/workout/WorkoutLogger.tsx` | Hide program cards when activeWorkout exists |
| `src/components/workout/SetRow.tsx` | Add RIR input column |
| `src/components/dashboard/WeeklyReview.tsx` | Show conditioning + RIR stats, update writeup |
| `supabase/functions/weekly-review/index.ts` | Include conditioning + RIR in AI prompt |

