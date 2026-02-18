
# Full Training Section Audit — Bugs & Fixes

## Bug 1: Programs Showing After Unenrolling / Program Switcher Not Toggling (Same Root Cause)

**Root Cause:** The `activeProgramId` in `programStore` is set once on first load with a guard (`if (!get().activeProgramId)`) and is **never cleared or updated** when a user unenrolls. This causes two failures:

1. After unenrolling a program, `activeProgramId` still holds the cancelled program's ID. The Tabs component in `ActiveProgramSwitcher` receives a `value` that no longer matches any `TabsTrigger`, so the switcher renders blank and cannot toggle.
2. Even with active programs, `setActiveProgram` updates the store correctly, but the stale `activeProgramId` from a previous session or unenroll can cause a mismatch on first render.

**Fix — `src/stores/programStore.ts`:**
- In `fetchEnrollments`: After filtering active enrollments, if `activeProgramId` is set but not in the current active list, reset it to the first active program's `program_id` (or null if none).
- In `unenrollFromProgram`: After cancelling, explicitly reset `activeProgramId` to either the next active enrollment or `null`.

```
// fetchEnrollments — after setting enrollments:
const currentActive = get().activeProgramId;
const activeIds = data.map(e => e.program_id);
if (!currentActive || !activeIds.includes(currentActive)) {
  set({ activeProgramId: data.length > 0 ? data[0].program_id : null });
}

// unenrollFromProgram — after fetchEnrollments():
const remaining = get().enrollments;
set({ activeProgramId: remaining.length > 0 ? remaining[0].program_id : null });
```

---

## Bug 2: Percentage Suggestions Not Calculating Automatically in Log Section

**Root Cause:** When `startProgramWorkoutSession` creates the workout and pre-populates exercises, it only stores `exercise_name`, `order_index`, `exercise_type`, and `notes` in `workout_exercises`. The `percentage_of_1rm` field from the program template is **not persisted anywhere** — it lives only in the program workout's JSONB exercises array. Once the logger loads the workout via `loadWorkoutIntoActive`, that metadata is gone.

The `SetRow` shows a "Prev" column pulling from `getLastSessionSets`, which returns previous session weights — not program percentages.

**Fix — Two-part solution:**

**Part A — Store percentage hint in exercise notes during session creation (`src/stores/programStore.ts`):**

In `startProgramWorkoutSession`, when inserting `workout_exercises`, append the `percentage_of_1rm` info to the `notes` field so it's preserved:

```typescript
notes: [ex.notes, ex.percentage_of_1rm ? `@ ${ex.percentage_of_1rm}% TM` : null]
  .filter(Boolean).join(' | ') || null,
```

**Part B — Surface the percentage suggestion in `ExerciseCard` / `SetRow` (`src/components/workout/ExerciseCard.tsx`):**

Parse the `notes` field for `@ X% TM` pattern and display it as a suggestion chip above the sets header. When the user has a PR or known training max, we can show the calculated weight. Even without a training max, showing `@ 85% TM` visually reminds the athlete what load to target.

Additionally, show the `percentage_of_1rm` hint on each `SetRow`'s "Prev" column as a badge when no previous weight exists for that exercise (i.e., first time doing the program exercise).

---

## Bug 3: Loading Delays

**Root Causes identified:**
1. `ActiveProgramSwitcher` calls `fetchEnrollments()` + `fetchTodaysWorkouts()` on every mount — this fires even when data is already in the store and fresh.
2. `useEnrollmentProgress` in `ActiveProgramSwitcher` fires one independent Supabase query per enrolled program (N+1 pattern). With 3 programs enrolled = 3 separate round-trips just for progress rings.
3. `WorkoutLogger`'s `useEffect` triggers 4 queries simultaneously: `fetchActiveWorkout`, `fetchPersonalRecords`, `fetchWorkoutDays`, `fetchWorkoutByDate`. These are sequential awaits inside independent functions but all fire on every `selectedDate` change.
4. `ProgramCalendarView` calls `fetchEnrollments()` independently on mount, duplicating what `ActiveProgramSwitcher` already fetched.

**Fixes:**

**Fix A — Batch the enrollment progress query (`src/components/tracks/ActiveProgramSwitcher.tsx`):**

Replace the N+1 `useEnrollmentProgress` per-enrollment hook with a single batched query at the `ActiveProgramSwitcher` level that fetches all progress data in one query, then distributes it to each enrollment tab.

```typescript
// Single query for all enrollment progress
const { data } = await supabase
  .from('user_calendar_workouts')
  .select('enrollment_id, is_completed')
  .in('enrollment_id', enrollments.map(e => e.id));

// Build a map: { enrollmentId -> { completed, total } }
```

**Fix B — Guard duplicate fetches with a timestamp/flag (`src/stores/programStore.ts`):**

Add a `lastFetchedAt` timestamp to the store. In `fetchEnrollments` and `fetchTodaysWorkouts`, skip re-fetching if data is < 30 seconds old. This prevents every component mount from hammering the database.

**Fix C — Skip `ProgramCalendarView`'s independent `fetchEnrollments` call:**

Since enrollments are already in the shared Zustand store (populated by `ActiveProgramSwitcher` which renders first on the logger tab), `ProgramCalendarView` should read from the store rather than fetching again. Remove the redundant `fetchEnrollments()` call from `ProgramCalendarView`'s `useEffect` and rely on the shared store state.

---

## Summary of All File Changes

| File | Changes |
|------|---------|
| `src/stores/programStore.ts` | Fix `activeProgramId` reset on unenroll + after fetch; add lastFetched guard; encode `percentage_of_1rm` in exercise notes during session creation |
| `src/components/tracks/ActiveProgramSwitcher.tsx` | Batch enrollment progress into a single query instead of N+1 per-program hooks; fix `UnenrollDialog` defined inside render (causes remount every render — move it outside) |
| `src/components/workout/ExerciseCard.tsx` | Parse `% TM` hint from exercise notes; display it as a suggestion badge above the sets table |
| `src/components/workout/ProgramCalendarView.tsx` | Remove redundant `fetchEnrollments()` call on mount |

---

## Additional Issues Found During Audit

**Minor Bug — `UnenrollDialog` defined inside render:**
In `ActiveProgramSwitcher`, `UnenrollDialog` is declared as `const UnenrollDialog = () => (...)` inside the component body. React re-creates this component function on every render, causing the `AlertDialog` to unmount and remount — this can cause the dialog to flash or not animate properly. It should be moved outside `ActiveProgramSwitcher` or converted to a conditional JSX block.

**Minor Bug — Calendar dialog opens on rest days too:**
In `ProgramCalendarView`, the dialog condition is `open={!!selectedDate && selectedWorkouts.length >= 0}` — the `>= 0` is always true, so clicking any day (even empty days) opens the dialog. This is intentional for rest day messaging, which is correct behaviour. No change needed.

**Minor Bug — `fetchActiveWorkout` auto-abandons stale program workouts:**
In `workoutStore.ts`, `fetchActiveWorkout` marks any incomplete workout from past dates as completed. However, when a user starts a program session for a past date (retroactive logging), this auto-abandon logic fires and closes the session before the user can log weights. This needs a guard: only auto-abandon workouts that are NOT program-linked (i.e., check if the workout name contains "—" which is the separator used by program sessions, or check the date difference is more than 1 day old rather than just less than today).
