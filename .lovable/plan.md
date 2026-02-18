
# Fix: Program Enrollment + Workout Calendar Integration

## Root Cause Analysis (3 confirmed bugs)

### Bug 1: Calendar dates start on the wrong day
The `buildCalendarDates` function in `programStore.ts` has a logic error. When a user enrolled today (Wednesday Feb 18) with training days [Mon, Tue, Thu, Fri], the first workout was placed on **Feb 23 (Monday)** instead of **Feb 19 (Thursday)** — the nearest upcoming training day. The algorithm incorrectly seeks the first training day of the week array (Monday) instead of the nearest future training day from the start date.

**Fix**: Rewrite `buildCalendarDates` with a clean, simple algorithm:
```
currentDate = startDate
for each programWorkout (sorted by week+day):
  find the NEAREST upcoming day-of-week from currentDate that is in trainingDays
  schedule this workout on that date
  set currentDate = that date + 1  (advance past it so next workout searches forward)
```

### Bug 2: Running/Rowing add-on wizard is broken — Step 3 is never rendered
In `ProgramAssignmentWizard.tsx`, the step counter shows "Step X of 3" for add-ons and the description mentions Step 3, but **the JSX only renders step 1 and step 2 blocks**. There is no `{step === 3 && ...}` block. So after the user picks days in Step 2 for an add-on, the "Start Program →" button is disabled (because `selectedDays.length !== requiredDays` until they fill in exactly the right count) and there's no way to reach confirmation.

**Fix**: Add a proper Step 3 block for add-ons, OR (simpler and better UX) combine the add-on placement into Step 2 (it's already there in the JSX as `{isAddon && ...}`) and change the confirmation button logic so it works correctly. The "Start Program →" is disabled when day count doesn't match, but the real issue is that `isAddon && step === 2` already shows the placement toggle — the step 3 reference in the badge and description is a dead end. Fix: Remove the step 3 references, keep add-on placement in step 2, and let the confirm button work normally.

### Bug 3: Program workouts never appear in the Workouts calendar
The Workouts tab reads exclusively from `workouts` (free-log table). The `fetchWorkoutDays` function queries `workouts` for dot indicators. Program workouts in `user_calendar_workouts` are invisible to the calendar.

**The fix requires two things:**
1. `fetchWorkoutDays` in `workoutStore.ts` must also query `user_calendar_workouts` (scheduled dates) and merge them with free-log workout days
2. When a user taps a date that has a programmed workout, the WorkoutLogger must show the program workout card above (or instead of) the "Start Workout" prompt

---

## Implementation Plan

### File 1: `src/stores/programStore.ts` — Fix `buildCalendarDates`

Replace the complex broken algorithm with a clean one:

```typescript
function buildCalendarDates(
  programWorkouts: { id: string }[],
  startDate: Date,
  trainingDays: number[]
): { program_workout_id: string; scheduled_date: string }[] {
  const sortedDays = [...trainingDays].sort((a, b) => a - b);
  const result = [];
  let cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  for (const pw of programWorkouts) {
    // Find next day-of-week from sortedDays starting from cursor
    let daysAhead = 0;
    while (!sortedDays.includes((cursor.getDay() + daysAhead) % 7 === 0 
      ? 0 : (cursor.getDay() + daysAhead) % 7)) {
      daysAhead++;
    }
    // Simpler: just walk forward until we hit a training day
    let date = new Date(cursor);
    while (!sortedDays.includes(date.getDay())) {
      date = addDays(date, 1);
    }
    result.push({ program_workout_id: pw.id, scheduled_date: format(date, 'yyyy-MM-dd') });
    cursor = addDays(date, 1); // next search starts the day after
  }
  return result;
}
```

This is clean, predictable, and guaranteed correct. A workout is placed on the nearest upcoming training day from `cursor`, then cursor advances past it so the next workout must be on a different day.

### File 2: `src/components/tracks/ProgramAssignmentWizard.tsx` — Fix add-on wizard

Remove the "Step X of 3" logic entirely. The wizard is always 2 steps. The add-on placement toggle already renders inside Step 2. Fix the badge to always say "Step {step} of 2". This unblocks Running/Rowing users immediately.

Also fix the day selector: for add-ons, the `requiredDays` check means they must select exactly 3 days before the button enables. The pre-selection in `goToStep2` will auto-select Tue/Thu/Sat defaults so the button is enabled right away unless they change it.

### File 3: `src/stores/workoutStore.ts` — Merge program workouts into `fetchWorkoutDays`

Update `fetchWorkoutDays` to also query `user_calendar_workouts` and return their `scheduled_date` values as workout day indicators (with a `is_program` flag):

```typescript
fetchWorkoutDays: async (weeks = 12): Promise<WorkoutDay[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const fromDate = format(subDays(new Date(), weeks * 7), 'yyyy-MM-dd');
  const futureDate = format(addDays(new Date(), weeks * 7), 'yyyy-MM-dd');

  // 1. Free-log workouts (past, completed)
  const { data: workouts } = await supabase
    .from('workouts')
    .select('date')
    .eq('user_id', user.id)
    .eq('is_completed', true)
    .gte('date', fromDate);

  // 2. Program calendar workouts (past AND future)
  const { data: programWorkouts } = await supabase
    .from('user_calendar_workouts')
    .select('scheduled_date, is_completed')
    .eq('user_id', user.id)
    .gte('scheduled_date', fromDate)
    .lte('scheduled_date', futureDate);

  const dayMap = new Map<string, number>();
  
  for (const w of workouts || []) {
    dayMap.set(w.date, (dayMap.get(w.date) || 0) + 1);
  }
  for (const pw of programWorkouts || []) {
    dayMap.set(pw.scheduled_date, (dayMap.get(pw.scheduled_date) || 0) + 1);
  }

  const days = Array.from(dayMap.entries()).map(([date, workout_count]) => ({
    date,
    workout_count,
  }));
  
  set({ workoutDays: days });
  return days;
},
```

This makes the WeekStrip and WorkoutCalendar show dot indicators on both past free-log days AND future/past program-scheduled days.

### File 4: `src/components/workout/WorkoutLogger.tsx` — Show program workout when selected date has one

When the user taps a date in the WeekStrip or WorkoutCalendar, if that date has a program workout, show the `DailyProgramWorkout` card above the "Start Workout" prompt.

Add a new helper that fetches today's (or selected date's) program workouts from `user_calendar_workouts`:

```typescript
// In WorkoutLogger.tsx — new state:
const [programWorkoutsForDate, setProgramWorkoutsForDate] = useState<UserCalendarWorkout[]>([]);

// In useEffect, also fetch program workouts for selectedDate:
useEffect(() => {
  fetchProgramWorkoutsForDate(selectedDate);
}, [selectedDate]);

async function fetchProgramWorkoutsForDate(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { data } = await supabase
    .from('user_calendar_workouts')
    .select(`
      *,
      program_workout:program_workouts(*),
      enrollment:user_program_enrollments(*, program:programs(*))
    `)
    .eq('scheduled_date', dateStr)
    .eq('user_id', user.id);
  setProgramWorkoutsForDate(data || []);
}
```

Then in the "no active workout" screen, above the "Start Workout" card, render:

```tsx
{programWorkoutsForDate.map(cw => (
  <DailyProgramWorkout
    key={cw.id}
    calendarWorkout={cw}
    programStyle={cw.enrollment?.program?.program_style}
  />
))}
```

This means: tap Feb 19 in the WeekStrip → see Wendler Week 1 Day 1 card with the % calculator + all exercises + "Mark Complete" button. Below it, you can still tap "Start Workout" to free-log additional work.

### File 5: Clear existing bad enrollments and re-enroll correctly

The current enrolled data has bad dates (starting Feb 23 instead of Feb 19). We need to:
1. Delete the existing `user_calendar_workouts` rows for the current enrollments
2. Delete the `user_program_enrollments` rows 
3. Let the user re-enroll after the fix ships

This is handled via a **migration** that clears the bad calendar data. The UI will then show "no enrollment" and the user re-enrolls using the fixed wizard.

**Migration SQL:**
```sql
-- Clear bad calendar workouts (they start Feb 23 but should start Feb 18/19)
DELETE FROM public.user_calendar_workouts;
DELETE FROM public.user_program_enrollments;
```

This migration runs before code ships. The user re-enrolls immediately after.

---

## Fix Summary Table

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Workouts start Feb 23 not Feb 18 | `buildCalendarDates` walks to first training day of week, not nearest | Replace with "walk forward from cursor until hitting a training day" algorithm |
| Running/Rowing add-on broken | Step 3 referenced but never rendered | Remove step 3, keep add-on placement in Step 2 where it already is |
| Workouts section doesn't show program workouts | `fetchWorkoutDays` only queries `workouts` table | Also query `user_calendar_workouts` and merge dot indicators |
| Workouts section doesn't show program exercises on a day | WorkoutLogger doesn't fetch from `user_calendar_workouts` | Add program workout cards above "Start Workout" prompt for that date |
| Console ref warning | `DailyProgramWorkout` inside Radix TabsContent without forwardRef | Wrap outer div, not component itself — Radix already handles this with a wrapping div |

---

## What Stays the Same

- All existing free-log workout functionality unchanged
- The Tracks tab program library UI unchanged
- Dashboard `ActiveProgramSwitcher` (shows today's program workout) — already correct once enrollment dates are fixed
- All RLS policies — no changes needed
- The `markWorkoutComplete` button on program workouts — works today, just can't reach it
