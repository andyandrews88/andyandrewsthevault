

# Program Builder Redesign + Client List Upgrade

## Two major improvements inspired by CoachRx:

---

## 1. Program Builder — Popup-Based Workout Editor (CoachRx Style)

**Current state**: The workout editor in `ProgramAdmin.tsx` already uses a dialog popup (`WorkoutEditor` component at line 271). The `TemplateEditor.tsx` uses an inline card-based approach. Both work but feel cramped.

**Changes**:

### A. Make the workout editor dialog expandable/larger
- **`ProgramAdmin.tsx` line 662**: Change `DialogContent` from `sm:max-w-lg` to `sm:max-w-2xl lg:max-w-4xl` — gives room for the exercise fields like CoachRx's layout
- Add a maximize/expand button on the dialog that toggles to `max-w-[95vw] h-[90vh]` for full-screen editing on desktop
- On mobile, the dialog already goes full-width via shadcn defaults

### B. Improve exercise row layout to match CoachRx reference
- **`ExerciseRowEditor`** (line 166): Restructure the grid from current `grid-cols-3` + `grid-cols-2` to a single-row layout on desktop: Name | Sets | Reps | Tempo | Rest | %1RM | Notes — all in one line (like CoachRx image-8)
- On mobile: stack into 2 rows (name + delete on row 1, fields in `grid-cols-3` on row 2)
- Video URL stays collapsible below

### C. Improve `TemplateEditor.tsx` to use the same dialog-based editing
- Currently uses inline card editing which is inconsistent with `ProgramAdmin`
- Refactor to use the same `WorkoutEditor` dialog pattern for consistency, or deprecate in favor of `ProgramAdmin`'s approach

---

## 2. Client List — CoachRx-Inspired Table View

**Current state**: The Admin Dashboard shows clients as a simple table with Name + Joined date. The "Users" drawer in `AdminDetailDrawer` shows Name, Joined, Workouts count, Streak — but it's bare.

**Changes to `AdminDetailDrawer.tsx` (users section)**:

### A. Add a summary stats bar at top (like CoachRx image-9)
Four stat cards above the table:
- **Total Clients** — count
- **Compliance** — average workout completion rate across all clients (completed workouts / total scheduled from programs)
- **Active This Week** — users who logged a workout in last 7 days
- **Avg Check-in Streak** — average streak across users

### B. Enrich the client table rows
Each row shows:
- **Avatar** (initials) + **Name** + last active date (like "Last consult" in CoachRx)
- **Last Workout** — date badge, color-coded: green if within 3 days, yellow if 4-7 days, red if >7 days (like CoachRx's Exercise Due)
- **Last Check-in** — similar date badge
- **Workout Compliance** — percentage (completed / total program workouts), displayed as colored text
- **Tags** — if we add a tagging system later, placeholder for now

### C. Update the `admin-detail` edge function
- For the `users` section, add: last workout date, total scheduled program workouts, completed program workouts, last check-in date
- This data already exists in the DB; just needs to be aggregated

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/ProgramAdmin.tsx` | Expand dialog size, add maximize toggle, restructure `ExerciseRowEditor` to single-row desktop layout |
| `src/components/admin/AdminDetailDrawer.tsx` | Redesign users section with stat bar + enriched table rows |
| `supabase/functions/admin-detail/index.ts` | Add last_workout_date, compliance data, last_checkin_date to users response |

## Mobile Considerations
- Program builder dialog: full-screen on mobile (already default), exercise fields stack vertically in `grid-cols-3`
- Client list: on mobile, hide lower-priority columns (compliance, tags) and show only Name + Last Workout + status badge. Use horizontal scroll or responsive hiding via `hidden md:table-cell`

