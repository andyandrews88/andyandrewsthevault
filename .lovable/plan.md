

# Admin Coaching Command Center — MyStrengthBook + CoachRx Hybrid

## What We're Building

A professional coaching backend that combines the best features from MyStrengthBook (program builder with calendar edit mode, multi-week templates, auto-progressions, copy workouts between clients, % of 1RM programming, RPE/RIR protocols, performance reports) and CoachRx (unified program calendar, lifestyle coaching prescriptions, touchpoint tracking, consultation notes, assessment tools).

This is a large feature set. I recommend building it in two phases. **Phase 1** (this implementation) covers the core programming and client management features that will make the admin backend functional as a coaching platform. Phase 2 can add lifestyle prescriptions, automated check-ins, and advanced reporting.

---

## Phase 1 Scope

### 1. Program Template Library (Coach-Level)

**New table: `coach_program_templates`**
Reusable multi-week program templates that coaches can create once and assign to any client. Different from the existing `programs` / `program_workouts` tables which are public training tracks — these are private coach templates.

```text
coach_program_templates
├── id (uuid)
├── coach_id (uuid)         -- who created it
├── name (text)             -- "Upper/Lower 4-Day Split"
├── description (text)
├── duration_weeks (int)
├── days_per_week (int)
├── category (text)         -- strength, hypertrophy, powerlifting, etc.
├── created_at, updated_at
└── is_archived (bool)

coach_template_workouts
├── id (uuid)
├── template_id → coach_program_templates
├── week_number (int)
├── day_number (int)
├── workout_name (text)
├── notes (text)
├── exercises (jsonb)       -- same structure as program_workouts.exercises
│   [{ name, sets, reps, rpe, rir, percentage, tempo, rest_seconds, notes, video_url, set_type }]
└── created_at
```

### 2. Copy Workout Between Clients

**New edge function action: `copy_workout_to_user`** in `admin-workout-builder`
- Input: `sourceWorkoutId`, `targetUserId`, `targetDate`
- Creates a new workout for the target user, cloning all exercises and sets
- Admin user profile page gets a "Copy to Another Client" button on each workout row
- Opens a picker showing all clients, lets coach select target + date

### 3. Assign Template to Client

**New edge function action: `assign_template`** in `admin-workout-builder`
- Input: `templateId`, `targetUserId`, `startDate`, `trainingDays[]`
- Uses the same look-ahead scheduling algorithm as the existing program enrollment system
- Creates workouts on the client's calendar with exercises pre-populated
- Creates a `coach_client_assignments` row to track the relationship

**New table: `coach_client_assignments`**
```text
coach_client_assignments
├── id (uuid)
├── coach_id (uuid)
├── client_user_id (uuid)
├── template_id → coach_program_templates (nullable)
├── start_date (date)
├── status (text)           -- active, completed, cancelled
├── notes (text)
├── created_at
```

### 4. Calendar Edit Mode

**New page: `/admin/user/:userId/calendar`**
- Full calendar view of a client's workouts (month view)
- Click any date to create or edit a workout directly
- Drag workouts to reschedule (date change)
- Color-coded: completed (green), in-progress (amber), future (blue), missed (red)
- Quick-add: click empty date → workout name → exercises inline

### 5. Program Builder with Auto-Progressions

**New page: `/admin/templates`** — Template management dashboard
- List all coach templates with create/edit/archive/duplicate
- Template editor with week-by-week view
- "Duplicate Week" with auto-progression options:
  - Increase weight by X% or X lbs/kg
  - Increase reps by N
  - Decrease RIR by 1
  - Custom formula
- Percentage-based loads: exercises can specify `percentage: 85` meaning "85% of client's 1RM for this lift"
- RPE/RIR targets per set
- Tempo notation support (already exists in program system)

### 6. Enhanced Set Prescriptions

Update the exercises JSONB structure to support:
```json
{
  "name": "Back Squat (High Bar)",
  "sets": 4,
  "reps": "5",
  "rpe": 8,
  "rir": 2,
  "percentage": 82.5,
  "tempo": "30X1",
  "rest_seconds": 180,
  "notes": "Pause at bottom",
  "video_url": "...",
  "set_type": "working",
  "superset_with": "Face Pull"
}
```

### 7. Client Overview Dashboard Enhancement

Update `/admin/user/:userId` with:
- "Assign Program" button (opens template picker + scheduling wizard)
- "Copy Workout to Client" action on each workout row
- Training calendar mini-view showing the month
- Active program assignment badge
- Touchpoint log: quick notes about coaching interactions (new `coach_touchpoints` table)

**New table: `coach_touchpoints`**
```text
coach_touchpoints
├── id (uuid)
├── coach_id (uuid)
├── client_user_id (uuid)
├── touchpoint_type (text)  -- note, check-in, call, email
├── content (text)
├── created_at
```

### 8. Coach Dashboard Enhancement

Update `/admin` with:
- "My Templates" quick link
- "Clients needing attention" — clients who haven't logged in 3+ days
- Quick-assign workflow: select template → select clients → schedule

---

## File Changes Summary

| File | Change |
|------|--------|
| **New migration** | Create `coach_program_templates`, `coach_template_workouts`, `coach_client_assignments`, `coach_touchpoints` tables with RLS |
| **`supabase/functions/admin-workout-builder/index.ts`** | Add actions: `copy_workout_to_user`, `assign_template`, `create_template`, `update_template`, `list_templates`, `get_template_detail`, `duplicate_template_week`, `add_touchpoint`, `get_touchpoints` |
| **New: `src/pages/AdminTemplates.tsx`** | Template management page with list + editor |
| **New: `src/pages/AdminClientCalendar.tsx`** | Full calendar view for a client's workouts |
| **New: `src/components/admin/TemplateEditor.tsx`** | Week-by-week template editor with exercise builder, auto-progression, % of 1RM |
| **New: `src/components/admin/CopyWorkoutDialog.tsx`** | Client picker + date selector for copying workouts |
| **New: `src/components/admin/AssignTemplateWizard.tsx`** | Template selector → client → start date → training days |
| **New: `src/components/admin/TouchpointLog.tsx`** | Quick coaching notes log per client |
| **New: `src/components/admin/ClientCalendarView.tsx`** | Month calendar component for admin client view |
| **`src/pages/AdminUserProfile.tsx`** | Add calendar mini-view, assign program button, copy workout actions, touchpoint log |
| **`src/pages/AdminDashboard.tsx`** | Add "My Templates" link, "Clients needing attention" section |
| **`src/App.tsx`** | Add routes: `/admin/templates`, `/admin/user/:userId/calendar` |

---

## Technical Details

**RLS for new tables**: All coach tables use `has_role(auth.uid(), 'admin')` for full CRUD. No client access needed — clients see results through existing `workouts` table.

**Copy workout flow**:
1. Admin clicks "Copy" on a workout row in client profile
2. Dialog shows list of all users (fetched via service role in edge function)
3. Admin selects target user + date
4. Edge function creates workout + exercises + sets for target user

**Auto-progression algorithm**:
- "Duplicate Week N → Week N+1" action in template editor
- Each exercise gets progression rules: `{ type: 'weight_increase', value: 2.5, unit: 'kg' }` or `{ type: 'rpe_increase', value: 0.5 }` or `{ type: 'rir_decrease', value: 1 }`
- Applied to all exercises in the duplicated week

**% of 1RM resolution**:
- When assigning a template to a client, the system looks up the client's PRs from `personal_records`
- If `percentage: 85` and client's 1RM for "Back Squat" is 140kg, prescribed weight = 119kg (rounded to nearest 2.5)
- If no PR exists, the field shows "85% of 1RM" as a text hint instead of a number

