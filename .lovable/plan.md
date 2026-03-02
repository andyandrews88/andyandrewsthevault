

# CoachRx-Style Weekly Calendar for Admin Coaching

## Current State
The admin calendar (`AdminClientCalendar.tsx`) is a basic monthly grid showing colored dots for workouts. Clicking navigates away to the full workout builder page. This is far from CoachRx's dense, inline weekly workflow.

## What CoachRx Does (from the screenshot)
1. **Weekly column layout** (Mon-Sun) showing 2 weeks at a time with date headers
2. **Inline workout cards** per day showing exercise names, sets/reps, weights, coach notes, and client feedback with green/red completion dots
3. **"Add New" button** on each day for quick workout creation
4. **Side drawer/panel** for building workouts inline without navigating away -- includes title, warmup section, exercise list, cooldown, and Save/Cancel buttons
5. **Week navigation** with arrows, "Today" button, and month/year header
6. **Rest day labels** on empty days
7. **Comments** on workout cards
8. **Exercise/Lifestyle toggle** for switching views

## Implementation Plan

### Phase 1: New Weekly Calendar Page (`AdminClientCalendar.tsx` rewrite)

**Layout:**
- Replace monthly grid with a 7-column weekly grid (Mon-Sun)
- Show 2 weeks at a time (like CoachRx)
- Each column has a day header with date number, and "Add New" + delete buttons
- Empty days show "rest" label

**Navigation:**
- `< Feb 2026 >` with arrows to shift by 1 week
- "Today" button to jump to current week
- Back button to client profile

**Workout Cards in each day column:**
- Dark card with workout name as colored header (matching CoachRx green/red/orange for status)
- Exercise list: `A) Exercise Name` with sets/reps/weight details
- Coach notes inline
- Client comments section
- Green dot = completed, red dot = missed/incomplete
- Click card to open side drawer for editing

### Phase 2: Inline Workout Builder Drawer

**Right-side panel (Sheet/Drawer)** that opens when clicking a workout card or "Add New":
- Title input
- Warmup text area
- Exercise list with: Name, Tempo, Reps, Sets, Rest fields
- `+ Exercise` and `+ Conditioning` buttons
- Cooldown text area
- Save Workout / Cancel buttons
- Reuses existing edge function actions (`create_workout`, `add_exercise`, `update_set`, etc.)

### Phase 3: Edge Function Updates

**New action: `get_client_week`**
- Accepts `userId`, `startDate`, `endDate`
- Returns workouts with full exercise + set details for the date range (not just workout summaries)
- Avoids N+1 queries by fetching all at once

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/AdminClientCalendar.tsx` | Full rewrite -- weekly grid with inline cards |
| `src/components/admin/WeeklyCalendarGrid.tsx` | New -- the 7-column grid component |
| `src/components/admin/CalendarWorkoutCard.tsx` | New -- individual workout card with exercises |
| `src/components/admin/CalendarWorkoutDrawer.tsx` | New -- side drawer for inline editing/creating |
| `supabase/functions/admin-workout-builder/index.ts` | Add `get_client_week` action |

### Technical Details

**Weekly date calculation:**
```text
getStartOfWeek(date) → Monday
Show 2 weeks: [Monday ... Sunday, Monday+7 ... Sunday+7]
Grid: CSS grid-cols-7 with scrollable columns
```

**Data flow:**
1. On mount/week change: call `get_client_week` with date range
2. Group workouts by date into a `Map<string, WorkoutWithExercises[]>`
3. Each column renders cards from its date bucket
4. "Add New" creates workout via existing `create_workout` action, then opens drawer
5. Drawer saves use existing `add_exercise`, `update_set`, `finish_workout` actions
6. On save/close drawer, refresh the week data

**Drawer workout builder (simplified version of AdminWorkoutBuilderPage):**
- Exercise name + search
- Sets/reps/weight inline inputs
- Notes per exercise
- Warmup/cooldown text fields
- Save persists to DB, Cancel discards unsaved changes

**Mobile:** On screens < 768px, show a scrollable horizontal week strip (like current WeekStrip component) with a single-day detail view below, since 7 columns won't fit.

