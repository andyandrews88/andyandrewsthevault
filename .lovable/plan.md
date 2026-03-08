

# Comprehensive Platform Audit & Diagnostic Report

This audit covers every route, component, store, edge function, and data flow in the application. Findings are categorized by severity.

---

## CRITICAL BUGS (Data Loss / Broken Functionality)

### 1. Admin Workout Builder: `workout_section` Never Persisted
**Impact**: When the coach adds exercises to Warm Up or Cool Down sections, the `workout_section` field is NEVER sent to or saved by the edge function. The `add_exercise` action in `admin-workout-builder/index.ts` (line 72-91) does not include `workout_section` in the insert. The client-side `AdminWorkoutBuilderPage.tsx` sends `workoutSection` in the body (line 280-284) but the edge function ignores it. All exercises default to `'main'`.

**Fix**: Update the `add_exercise` case in the edge function to include `workout_section: body.workoutSection || 'main'` in the insert statement. Also update the `copy_workout_to_user` action (line 220-227) to preserve `workout_section`.

### 2. Admin Copy Workout Missing `workout_section`
**Impact**: The `copy_workout_to_user` action (line 220-227) does not copy `workout_section` from source exercises. Cloned workouts lose their warm-up/cool-down structure.

**Fix**: Add `workout_section: ex.workout_section || 'main'` to the insert in `copy_workout_to_user`.

### 3. Template Assignment Missing `workout_section`
**Impact**: When templates are assigned (`assign_template`, `batch_assign_template`, `propagate_template`), the created workout exercises never set `workout_section`. All template-generated workouts dump everything into the main section.

**Fix**: Update all three assignment cases to include `workout_section` from template exercise data.

---

## HIGH PRIORITY ISSUES

### 4. Admin Workout Builder: No Set Type (Warmup/Working) Support
**Impact**: The client-side `SetRow` component supports `warmup` vs `working` set types with visual distinction. The admin builder has no set type toggle at all -- every set is implicitly `'working'`. Coaches cannot designate warmup sets.

**Fix**: Add a set type toggle (or at minimum a warmup indicator) to the admin builder's set row. Mirror the client-side `SetRow` warmup styling.

### 5. Admin Workout Builder: No `WeightInputPopup` / Numpad
**Impact**: The client-side uses a polished `WeightInputPopup` with numpad, autofill from previous session, and BW-only button. The admin builder uses plain `<Input type="number">` fields. This was explicitly flagged by the user.

**Fix**: Either integrate the existing `WeightInputPopup` component, or build a simplified version for admin use. At minimum, add the autofill-from-previous and bodyweight-only capabilities.

### 6. No Password Reset Flow
**Impact**: The auth page (`Auth.tsx`) has no "Forgot Password" link. Users who forget their password have no self-service recovery option.

**Fix**: Add a forgot password link that calls `supabase.auth.resetPasswordForEmail()` and a password reset confirmation page.

### 7. Admin PRs Display Hardcoded to "kg"
**Impact**: In `AdminUserProfile.tsx` line 322, PRs are displayed as `{pr.max_weight}kg` but weights are stored in lbs internally. This shows incorrect units.

**Fix**: Convert from lbs to the client's preferred unit (or the admin's preferred unit) using `convertWeight`.

### 8. Admin Training Volume Hardcoded to "kg"
**Impact**: In `AdminUserProfile.tsx` line 275, workout volume shows `{Number(w.total_volume || 0).toLocaleString()} kg`. The `total_volume` in the database stores lbs (since all weights are stored in lbs). This displays incorrect values.

**Fix**: Apply unit conversion or display the correct unit label.

---

## MEDIUM PRIORITY ISSUES

### 9. `MovementBalanceChart` RLS Bypass Issue
**Impact**: When used in the admin context with `userId` prop, the component queries `workouts`, `workout_exercises`, and `exercise_sets` tables. These all have RLS policies that only allow `auth.uid() = user_id`. The admin's session cannot read another user's data through the client-side Supabase client.

**Status**: This may silently return empty data for admin coaching analytics. Needs verification -- if the admin sees "No data" on the movement balance chart, this is the cause.

**Fix**: Either create a dedicated edge function for admin movement balance data, or add RLS policies that allow admins to read workout data.

### 10. Dashboard Layout Stored in localStorage Only
**Impact**: Per-client dashboard layouts (`admin-profile-layout-${userId}`) are stored only in the browser's localStorage. If the coach switches devices or clears browser data, all customizations are lost.

**Fix**: Consider persisting layout preferences in a database table (e.g., `coach_dashboard_layouts`).

### 11. `CoachingAnalyticsDashboard` Volume Tooltip Shows "lbs" Hardcoded
**Impact**: Line 122 in `CoachingAnalyticsDashboard.tsx` hardcodes `formatter={(v: number) => [\`${v.toLocaleString()} lbs\`, "Volume"]}`. This doesn't respect the coach's unit preference.

**Fix**: Use the preferred unit from the weight conversion utility.

### 12. Community Direct Messages Missing Read Receipts
**Impact**: DMs have an `is_read` column but the read status update only happens on admin side via `fetchDirectMessages`. The client-side community feed doesn't mark messages as read when displayed.

### 13. Wearable Connections Disabled
**Impact**: `ProgressTab.tsx` line 37 has `fetchWearableConnections` commented out with "temporarily disabled". The `WearableConnect` component exists but isn't being used.

---

## LOW PRIORITY / POLISH

### 14. Landing Page PricingSection Not Rendered
**Impact**: `PricingSection` is imported in the file list but not used in `Index.tsx`. If pricing was intended to show, it's missing.

### 15. Admin Dashboard Pending Exercise Query Uses `as any` Cast
**Impact**: Line 89-93 in `AdminDashboard.tsx` uses `as any` to work around Supabase client type issues. This hides potential runtime errors.

### 16. Profile Settings Unit Conversion Not Applied
**Impact**: When `unit_preference` is set to "imperial", the weight and height labels change (lbs/in) but the values stored in the database (`weight_kg`, `height_cm`) are not converted on display or save. A user entering "180" in imperial mode saves it as 180 in the `weight_kg` column.

**Fix**: Apply conversion on save (imperial -> metric) and on display (metric -> imperial).

### 17. Edge Functions `verify_jwt = false`
**Impact**: All edge functions in `config.toml` have `verify_jwt = false`. While the functions do their own auth checks internally, this means the Supabase gateway doesn't pre-filter unauthenticated requests, adding unnecessary load.

### 18. Missing Error Boundaries
**Impact**: No React error boundaries anywhere in the app. A crash in any component takes down the entire page.

### 19. Admin Client Calendar Missing Workout Section Display
**Impact**: The calendar view shows workout names but doesn't indicate if exercises are in warm-up/main/cool-down sections.

### 20. No Loading State for `MovementBalanceChart` in Admin Context
**Impact**: When the chart is loading data for a client, there's no skeleton or spinner specific to the admin embedding.

---

## EXECUTION PLAN

```text
Phase 1: Critical Fixes (Data Integrity)
  1. Fix workout_section in edge function add_exercise
  2. Fix workout_section in copy_workout_to_user
  3. Fix workout_section in all template assignment flows
  4. Fix PR weight unit display in AdminUserProfile
  5. Fix training volume unit display in AdminUserProfile

Phase 2: High Priority (Feature Parity)
  6. Add set type (warmup/working) toggle to admin builder
  7. Add WeightInputPopup or enhanced weight entry to admin builder
  8. Add password reset flow to Auth page
  9. Fix CoachingAnalyticsDashboard volume tooltip units

Phase 3: Medium Priority (Data Access)
  10. Verify/fix MovementBalanceChart RLS for admin context
  11. Fix ProfileSettings unit conversion on save/display
  12. Add DM read receipt marking on client side

Phase 4: Polish
  13. Add React error boundaries
  14. Consider database-backed layout persistence
  15. Clean up type casts and disabled features
```

Total files requiring changes:
- `supabase/functions/admin-workout-builder/index.ts` (items 1-3, 6)
- `src/pages/AdminWorkoutBuilderPage.tsx` (items 5, 7)
- `src/pages/AdminUserProfile.tsx` (items 4, 8)
- `src/components/admin/CoachingAnalyticsDashboard.tsx` (item 9)
- `src/pages/Auth.tsx` (item 6)
- `src/pages/ProfileSettings.tsx` (item 11)
- `src/components/workout/MovementBalanceChart.tsx` (item 10)

