

# Admin Control Center + AI Intelligence Briefing

## Overview
Four major additions: user management controls, maximizable drawers, enriched client data with filters, and a comprehensive AI intelligence system.

---

## 1. User Management Controls

### New Edge Function: `supabase/functions/admin-manage-user/index.ts`
Actions supported via service role:
- **suspend** — `admin.auth.admin.updateUserById(targetUserId, { ban_duration: "876000h" })` to block login
- **unsuspend** — reset ban_duration to "none"
- **archive** — prefix display_name with "[Archived]" + suspend auth
- **delete** — `admin.auth.admin.deleteUser(targetUserId)` (permanent)
- **remove_role** — delete from user_roles table
- **get_status** — return banned status, archived flag, roles, last sign-in

Add to `supabase/config.toml`:
```toml
[functions.admin-manage-user]
verify_jwt = false
```

### UI: Action menu in Client Directory (`AdminDetailDrawer.tsx`)
- Add a `DropdownMenu` on each user row with: Suspend, Unsuspend, Archive, Delete, Remove Roles
- Delete requires a confirmation `AlertDialog` with the user's name typed to confirm
- Suspend/unsuspend toggles based on current status (fetched via `get_status` action on drawer open)
- Color-code suspended/archived rows with a muted/strikethrough style

---

## 2. Maximizable Drawer Panels

### Changes to `AdminDetailDrawer.tsx`
- Add `isMaximized` state toggle
- When maximized: `SheetContent` className changes from `w-full sm:max-w-2xl` to `w-full sm:max-w-[95vw] h-[95vh]`
- Add a Maximize/Minimize button (Maximize2/Minimize2 icons) in the SheetHeader
- Works on all section types (users, training, nutrition, lifestyle, community, content)

---

## 3. Enriched Client Directory with Filters

### Update `admin-detail` edge function (users section)
Add to the user data returned:
- `hasNutrition` — whether user has entry in user_nutrition_data
- `mealCount` — count from user_meals
- `hasAudit` — whether user has entry in user_audit_data
- `latestWeight` — most recent weight_kg from user_body_entries
- `latestBF` — most recent body_fat_percent
- `avgEnergy`, `avgSleep` — from user_daily_checkins (last 30 days)
- `diaryEntriesThisWeek` — food diary count this week
- `programEnrolled` — boolean from user_program_enrollments
- `status` — active/suspended/archived (from auth ban status)

### UI Changes to Client Directory
- Add a filter bar above the table with toggles: "All", "Active", "Inactive 7d+", "Has Program", "No Nutrition", "Suspended"
- Add optional columns (toggled via a column picker dropdown): Last Check-in, Avg Energy, Weight, Nutrition Status, Program Status
- Default view shows: Name, Last Workout, Compliance, Workouts
- Expanded view adds the lifestyle/nutrition columns

---

## 4. AI Intelligence Briefing System

### New Edge Function: `supabase/functions/admin-intelligence/index.ts`
- Collects ALL platform data in parallel (users, workouts, PRs, check-ins, goals, nutrition, food diary, body entries, community, programs, calendar workouts, assignments)
- Builds per-user summaries with every metric
- Constructs a comprehensive data prompt
- Sends to Lovable AI (google/gemini-3-flash-preview) with a corporate-grade system prompt

The AI produces a structured report with these sections:
1. Executive Summary
2. User Acquisition & Retention
3. Training Performance Analysis
4. Readiness & Lifestyle Intelligence
5. Nutrition & Body Composition
6. Goal Tracking & Accountability
7. Program Compliance & Coaching Effectiveness
8. Community Health
9. Strategic Recommendations (Top 5 priority actions)
10. Client Priority Matrix (🟢 On Track / 🟡 Watch / 🔴 Intervention Needed)

Add to `supabase/config.toml`:
```toml
[functions.admin-intelligence]
verify_jwt = false
```

### New Component: `src/components/admin/AIIntelligenceBriefing.tsx`
- Full-width card on the Admin Dashboard
- "Generate Intelligence Briefing" button
- Loading state with skeleton
- Renders the report with `react-markdown` for proper formatting of headers, bullets, and the priority matrix
- Timestamp of when report was generated
- "Regenerate" button after initial generation

### Integration into `AdminDashboard.tsx`
- Add the AIIntelligenceBriefing component prominently at the top of the dashboard, right after the header
- Replace or supplement the existing `AdminWeeklyReport` (which is simpler and less comprehensive)

---

## Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/admin-manage-user/index.ts` | User suspend/archive/delete/status |
| `supabase/functions/admin-intelligence/index.ts` | Comprehensive AI analytics |
| `src/components/admin/AIIntelligenceBriefing.tsx` | AI briefing UI component |

## Files to Modify
| File | Changes |
|------|---------|
| `supabase/config.toml` | Add admin-manage-user and admin-intelligence function configs |
| `src/components/admin/AdminDetailDrawer.tsx` | Maximize toggle, user management actions, filter bar, enriched columns |
| `supabase/functions/admin-detail/index.ts` | Add nutrition/lifestyle/body/program data to users section |
| `src/pages/AdminDashboard.tsx` | Add AIIntelligenceBriefing component |

## Dependencies
- `react-markdown` — needs to be installed for rendering the AI report with proper formatting

