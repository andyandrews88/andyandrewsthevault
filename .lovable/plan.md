
# Bug Fix Plan: Program Re-Enrollment + Full Audit

## Root Cause of the Screenshot Error

The database has a `UNIQUE INDEX user_program_enrollments_user_id_program_id_key` on `(user_id, program_id)`. This means:
- User enrolls in "Strength Foundation" → row created
- User unenrolls → status set to `'cancelled'`, but the row **stays in the table**
- User tries to re-enroll → `INSERT` fails with "duplicate key value violates unique constraint"

This is a critical enrollment flow bug that completely blocks re-enrollment in any program.

---

## Fix 1: Upsert Enrollment Instead of Blind INSERT (Critical)

**File:** `src/stores/programStore.ts` — `enrollInProgram()`

Change the enrollment step from a plain `INSERT` to an `UPSERT` using Supabase's `upsert()` with `onConflict: 'user_id,program_id'`. This will:
- **New enrollment:** Create a new row
- **Re-enrollment after cancellation:** Update the existing row's `status` back to `'active'`, update `start_date`, `training_days`, and `addon_placement`

After the upsert, the old calendar workouts (from the previous enrollment) need to be cleaned up. We'll delete the old `user_calendar_workouts` for this enrollment ID before inserting new ones, so the user gets a fresh schedule.

**Logic flow:**
```
1. UPSERT into user_program_enrollments (on conflict: update status='active', start_date, training_days, addon_placement)
2. DELETE old user_calendar_workouts WHERE enrollment_id = enrollment.id
3. Fetch program_workouts
4. Build new calendar dates
5. INSERT new calendar workouts
6. Refresh state
```

---

## Fix 2: Clear "Enrolled" Badge After Unenrolling (UX Bug)

**File:** `src/components/tracks/ProgramLibrary.tsx`

Currently `enrolledProgramIds` is built from `enrollments` which only fetches `status = 'active'`. This is actually correct — so the ProgramCard correctly shows "Enrolled" only for active enrollments. After unenrolling and refreshing, the card should show "Select Program" again.

However, `ProgramLibrary` calls `fetchEnrollments()` on mount but **not** after a re-fetch trigger. After unenrolling from `ActiveProgramSwitcher`, the library needs to re-fetch. This is handled because both components call `fetchEnrollments()` on mount, but since state is shared via the store, any `unenrollFromProgram()` call already triggers `fetchEnrollments()` — so the card updates correctly.

No change needed here.

---

## Fix 3: Unenroll Properly Clears Calendar Workouts

**File:** `src/stores/programStore.ts` — `unenrollFromProgram()`

Currently, unenrolling only sets `status = 'cancelled'` on the enrollment. The future calendar workouts remain in `user_calendar_workouts` (incomplete ones). This means:
- The calendar still shows future program workout dots
- The program switcher may show stale data

**Fix:** When unenrolling, also DELETE future `user_calendar_workouts` (those with `scheduled_date >= today` and `is_completed = false`) for the given enrollment. Completed past sessions are preserved for history.

---

## Fix 4: Error Message Exposes DB Constraint Name

**File:** `src/components/tracks/ProgramAssignmentWizard.tsx`

The current catch block passes `err?.message` directly to the toast, which surfaces raw database errors like:
> "duplicate key value violates unique constraint 'user_program_enrollments_user_id_program_id_key'"

This is bad UX and exposes internal schema names. After Fix 1 resolves the upsert, this scenario shouldn't happen — but as a safety net, we'll improve the error message to be user-friendly.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/stores/programStore.ts` | `enrollInProgram`: upsert + delete old calendar entries before re-inserting |
| `src/stores/programStore.ts` | `unenrollFromProgram`: also delete future incomplete calendar workouts |
| `src/components/tracks/ProgramAssignmentWizard.tsx` | Better error message in catch block |

---

## Why No DB Migration is Needed

The unique constraint already exists and is correct behavior (one enrollment record per user per program). The fix is entirely in application logic — using `upsert` to handle the conflict gracefully rather than crashing on it.
