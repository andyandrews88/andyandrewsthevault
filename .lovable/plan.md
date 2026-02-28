

# Movement Balance Chart Improvements

## Changes

### 1. Radar Chart: Full Names Instead of Abbreviations
**`src/components/workout/MovementBalanceChart.tsx`**
- Change `PolarAngleAxis dataKey` from `"short"` to `"pattern"` (which already contains the full label)
- Reduce font size from 11 to 9 and reduce `outerRadius` from `"70%"` to `"60%"` so full names fit without overlapping

### 2. Clickable Pattern Cards with Exercise Breakdown Drawer
**`src/components/workout/MovementBalanceChart.tsx`**
- Add state for `selectedPattern: MovementPattern | null`
- Track per-exercise volume data during `fetchData`: for each pattern, store an array of `{ exerciseName, volume, sets }` (not just a Set of names)
- Update `PatternVolumeData` type locally to include `exerciseBreakdown: { name: string; volume: number; sets: number }[]`
- When a card in the `cards` view is clicked, set `selectedPattern` and show a `Sheet` (drawer) with:
  - Pattern name + total volume header
  - List of exercises sorted by volume descending, each showing: exercise name, volume (in preferred unit), set count, and a simple horizontal bar showing proportion of pattern total
  - Weekly volume mini-chart for that pattern (from `weeklyData`)
- Also make the radar polygon segments and bar chart segments clickable to open the same drawer

### Files Changed

| File | Change |
|------|--------|
| `src/components/workout/MovementBalanceChart.tsx` | Use full labels on radar axis (smaller font, smaller radius), add `exerciseBreakdown` tracking in fetch, add `selectedPattern` state + Sheet drawer with per-exercise breakdown and weekly trend |

