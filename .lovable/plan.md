
# Database Cleanup + Remaining Bug Fixes

## What Needs to Happen

### Part 1 — Emergency Database Cleanup (Immediate)
Delete the 132 ghost calendar workout rows from the 6 cancelled enrollments. These rows are currently polluting the calendar, the week strip, and the progress rings. This is a direct SQL delete run against the database — no migration needed, it's a data operation.

The query to run:
```sql
DELETE FROM user_calendar_workouts
WHERE enrollment_id IN (
  SELECT id FROM user_program_enrollments WHERE status != 'active'
)
AND is_completed = false;
```

This preserves any completed sessions from cancelled programs (workout history is safe) and only removes the future/incomplete ghost entries.

---

### Part 2 — Fix `fetchWorkoutDays` to Exclude Cancelled Enrollments

**File: `src/stores/workoutStore.ts`** — `fetchWorkoutDays()`

The calendar week strip (WeekStrip dots) currently queries `user_calendar_workouts` with no join to filter by enrollment status. This means even after the DB cleanup, if someone unenrolls in the future, dots appear again until the next cleanup.

Fix: Add a join to only count calendar workouts from ACTIVE enrollments.

```typescript
// Current (broken):
const { data: programWorkouts } = await supabase
  .from('user_calendar_workouts')
  .select('scheduled_date, is_completed')
  .eq('user_id', user.id)
  ...

// Fixed — join to only active enrollments:
const { data: programWorkouts } = await supabase
  .from('user_calendar_workouts')
  .select('scheduled_date, is_completed, enrollment:user_program_enrollments!inner(status)')
  .eq('user_id', user.id)
  .eq('enrollment.status', 'active')  // Only active program dots
  ...
```

---

### Part 3 — Fix Progress Ring Query to Exclude Cancelled Enrollments

**File: `src/components/tracks/ActiveProgramSwitcher.tsx`**

The batched progress query correctly uses `.in('enrollment_id', ids)` where `ids` comes from the current `enrollments` array — and since `enrollments` only contains active ones (the store filters by `status = 'active'`), this is actually already safe. No change needed here.

However — the `ProgramCalendarView` also has a progress query. Let me check that.

---

### Part 4 — Fix `ProgramCalendarView` to Filter Active Enrollments Only

**File: `src/components/workout/ProgramCalendarView.tsx`**

The calendar view fetches calendar workouts to show dots/events on the monthly calendar. It needs to filter by active enrollment status so cancelled program workouts don't show up as calendar events.

Fix: Add an enrollment status filter to the calendar workout fetch query.

---

### Part 5 — Stale Incomplete Workout Cleanup

There are 3 incomplete workouts in the DB:
1. "Zone 2" from today (Feb 18) — currently active, fine
2. "Running Add-on — Easy Run + Drills" dated Feb 19 — a future-dated program session, fine
3. "Full Body" from Feb 9 — a 9-day-old free-log session that was never finished

The Feb 9 "Full Body" is being protected by the program session guard (it doesn't contain "—") but it IS stale. Actually — looking at the code again, `fetchActiveWorkout` checks `workout.date < today && !isProgramSession` — the Feb 9 Full Body will be auto-abandoned the next time someone visits the workout tab. This is correct behavior — no fix needed.

---

## Summary of All Changes

| Action | Type | Detail |
|--------|------|--------|
| Delete 132 ghost calendar rows | Data cleanup | SQL DELETE for cancelled enrollment rows that are not completed |
| `src/stores/workoutStore.ts` | Code fix | Filter `fetchWorkoutDays` to only show active enrollment calendar dots |
| `src/components/workout/ProgramCalendarView.tsx` | Code fix | Filter calendar event query to active enrollments only |

## What is NOT Broken (Good News)

- Database schema design is clean and correct
- RLS policies are all properly configured — no security holes
- All foreign keys and relationships are intact (0 orphaned rows)
- Personal records, exercises, sets — all clean
- The upsert re-enrollment fix from earlier is working correctly
- The `WorkoutStore` logic is solid overall

The app is not "all messed up" — it's actually well-architected. The issue is purely a ghost data problem from testing the unenroll flow before the cleanup code existed, plus two query filters that need to be tightened.
