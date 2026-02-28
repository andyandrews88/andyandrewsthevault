

# Client Coaching Dashboard

## Analysis

**Existing schema supports this directly:**
- `exercise_sets` has `weight`, `reps`, `rir`, `is_completed`, `set_type` columns
- `workouts` has `date`, `user_id`, `is_completed`, `total_volume`
- `ClientPerformanceReport` already exists but lacks RIR analysis and donut compliance

**No Tremor** — the app uses `recharts` throughout. I'll use recharts (`AreaChart`, `LineChart`, `PieChart`) to match the existing design system.

## Implementation Steps

### 1. Create SQL Views (Migration)

Two database views for performant aggregation:

**`weekly_volume_summary`** — Groups by user + ISO week, sums `weight × reps` for completed working sets:
```sql
CREATE VIEW weekly_volume_summary AS
SELECT w.user_id,
       date_trunc('week', w.date::timestamp) AS week_start,
       SUM(COALESCE(s.weight,0) * COALESCE(s.reps,0)) AS total_tonnage,
       COUNT(DISTINCT w.id) AS workout_count
FROM workouts w
JOIN workout_exercises we ON we.workout_id = w.id
JOIN exercise_sets s ON s.exercise_id = we.id
WHERE w.is_completed = true AND s.is_completed = true AND s.set_type = 'working'
GROUP BY w.user_id, date_trunc('week', w.date::timestamp);
```

**`weekly_rir_summary`** — Average RIR per user per week (only sets with RIR recorded):
```sql
CREATE VIEW weekly_rir_summary AS
SELECT w.user_id,
       date_trunc('week', w.date::timestamp) AS week_start,
       ROUND(AVG(s.rir)::numeric, 1) AS avg_rir,
       COUNT(*) AS sets_with_rir
FROM workouts w
JOIN workout_exercises we ON we.workout_id = w.id
JOIN exercise_sets s ON s.exercise_id = we.id
WHERE w.is_completed = true AND s.is_completed = true
  AND s.set_type = 'working' AND s.rir IS NOT NULL
GROUP BY w.user_id, date_trunc('week', w.date::timestamp);
```

RLS: Views inherit RLS from underlying tables, so authenticated users can only see their own data. For admin access, the edge function uses the service role client.

### 2. Extend Edge Function (`admin-workout-builder`)

Add a new action `get_coaching_dashboard` that queries both views filtered by `userId` and date range, plus computes compliance (completed/total workouts ratio). Returns:
- `weeklyVolume[]` — from the view
- `weeklyRir[]` — from the view  
- `compliance` — `{ completed, total, percentage }`

### 3. New Component: `CoachingAnalyticsDashboard`

**File:** `src/components/admin/CoachingAnalyticsDashboard.tsx`

Three charts in a responsive grid:

1. **Volume Trend** — `recharts AreaChart` with gradient fill, plotting `total_tonnage` over weeks
2. **Proximity to Failure** — `recharts LineChart` plotting `avg_rir` with inverted Y-axis (lower RIR = higher intensity, visually higher on chart via `reversed` domain)
3. **Compliance** — `recharts PieChart` (donut) showing completed vs incomplete ratio

All wrapped with `DateRangeSelector` (4wk/12wk presets + custom).

### 4. Client-Side Access

Also create a lightweight version for the **client's own analytics tab** (`WorkoutTab > Analytics`) that queries the views directly via the Supabase client (RLS handles auth). This avoids the edge function overhead for the user's own data.

### 5. Integration Points

- **Admin User Profile** (`AdminUserProfile.tsx`): Add `CoachingAnalyticsDashboard` below the existing training section, passing `userId`
- **Client Analytics** (`WorkoutTab.tsx`): Add the client-facing version alongside existing `VolumeTrendChart` and `StrengthTrendChart`

## Files to Create/Modify

| File | Change |
|------|--------|
| Migration SQL | Create `weekly_volume_summary` and `weekly_rir_summary` views |
| `supabase/functions/admin-workout-builder/index.ts` | Add `get_coaching_dashboard` action |
| `src/components/admin/CoachingAnalyticsDashboard.tsx` | **New** — Admin-facing dashboard with 3 charts |
| `src/components/workout/IntensityTrendChart.tsx` | **New** — Client-facing RIR trend chart |
| `src/components/workout/ComplianceDonut.tsx` | **New** — Client-facing compliance donut |
| `src/components/workout/WorkoutTab.tsx` | Add IntensityTrendChart and ComplianceDonut to analytics tab |
| `src/pages/AdminUserProfile.tsx` | Add CoachingAnalyticsDashboard to training section |

