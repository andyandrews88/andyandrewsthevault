

# Plan: Three Admin Enhancements

## 1. Admin Workout Builder — Weight Unit Toggle (kg/lbs)

**Problem**: The admin builder hardcodes "Kg" in set headers and has no unit conversion. The client-side `SetRow` uses `WeightInputPopup` with a kg/lbs toggle and stores everything in lbs internally.

**Changes**:
- **`src/pages/AdminWorkoutBuilderPage.tsx`**:
  - Add a `preferredUnit` state (`'kg' | 'lbs'`, default `'kg'`) with a toggle button in the builder header (similar to the client side).
  - Import `convertWeight` from `@/lib/weightConversion`.
  - In the set header row, change hardcoded "Kg" to display the selected unit dynamically.
  - When displaying set weights, convert from stored lbs to display unit. When saving, convert from display unit to lbs for storage.
  - Add a small kg/lbs toggle button near the workout header area so the coach can switch units.

## 2. Analytics — Per-Movement Volume Breakdown

**Problem**: The `CoachingAnalyticsDashboard` only shows aggregate weekly volume. Coaches need to see volume broken down by individual exercise/movement.

**Changes**:
- **`supabase/functions/admin-workout-builder/index.ts`** — In the `get_coaching_dashboard` action:
  - Add a query that joins `workout_exercises` → `exercise_sets` for the user in the date range, grouping by `exercise_name` and summing volume (`weight * reps` for completed working sets).
  - Return a new `movementVolume` array: `[{ exercise_name, total_volume, total_sets }]` sorted by volume descending.

- **`src/components/admin/CoachingAnalyticsDashboard.tsx`**:
  - Add a 4th card (or full-width section below the existing 3): "Volume by Movement" — a horizontal bar chart or sorted table showing each exercise name with its total volume in the date range. Use a `BarChart` from recharts.

## 3. Admin Client Dashboard — Show/Hide Sections Per Client

**Problem**: The current `useDashboardLayout` stores layout in localStorage keyed generically (`admin-profile-layout`), meaning all clients share the same layout. The coach needs per-client customization with the ability to hide sections entirely.

**Changes**:
- **`src/hooks/useDashboardLayout.ts`**:
  - Add a `hidden: Record<string, boolean>` field to `LayoutState`.
  - Add `toggleHidden(id)` and `isHidden(id)` to the returned API.
  - Update `resetLayout` to also clear hidden state.

- **`src/components/ui/CollapsibleDashboardSection.tsx`**:
  - In edit mode, add an eye/eye-off toggle button alongside the existing move arrows, allowing sections to be hidden.

- **`src/pages/AdminUserProfile.tsx`**:
  - Change the localStorage key from `"admin-profile-layout"` to `"admin-profile-layout-${userId}"` so each client gets their own saved layout.
  - Use the new `isHidden` check in the render loop to skip hidden sections.
  - In edit mode, show all sections (including hidden ones) with a visual "hidden" indicator so the coach can re-enable them.

## Implementation Order
1. Update `useDashboardLayout` with hidden state support
2. Update `CollapsibleDashboardSection` with hide toggle
3. Update `AdminUserProfile` with per-client layout key + hidden filtering
4. Add unit toggle to `AdminWorkoutBuilderPage`
5. Update edge function with movement volume query
6. Add movement volume chart to `CoachingAnalyticsDashboard`

