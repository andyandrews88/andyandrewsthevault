

# Add Custom Date Range Picker Across All Analytics Components

## Components That Need Custom Date Range

1. **`MovementBalanceChart.tsx`** — currently has `1 week / 4 weeks / 12 weeks` buttons
2. **`ReadinessChart.tsx`** — currently has `7d / 14d / 30d` buttons
3. **`VolumeTrendChart.tsx`** — hardcoded to 4 weeks, no selector at all
4. **`StrengthTrendChart.tsx`** — no time range selector, fetches all history
5. **`ActivityHeatmap.tsx`** — hardcoded to 12 weeks
6. **`ClientPerformanceReport.tsx`** — has `4 / 8 / 12 / 24 weeks` select
7. **`WeightChart.tsx`** (progress) — displays all entries, no time filter

## Approach: Shared `DateRangeSelector` Component

Create a single reusable component that all analytics cards use, providing:
- Preset buttons: 1W, 2W, 1M, 3M, 6M, 1Y
- A "Custom" button that opens a popover with two Calendar pickers (From / To)
- Returns either a preset key or a `{ from: Date, to: Date }` object
- Compact design that fits in card headers

### New File: `src/components/ui/DateRangeSelector.tsx`
- Props: `onRangeChange(from: Date, to: Date)`, `presets` (optional override of which presets to show), `className`
- State: `activePreset` string or `'custom'`, `customFrom`, `customTo`
- When a preset is clicked, compute the date range and call `onRangeChange`
- When "Custom" is clicked, show a Popover with two Calendar pickers side-by-side (stacked on mobile), and an "Apply" button
- Highlight the active preset button

### Component Updates

Each component will be updated to:
1. Replace its current time selector with `<DateRangeSelector />`
2. Accept `fromDate` / `toDate` as Date objects instead of a weeks count
3. Pass the date range to its data-fetching function

**`MovementBalanceChart.tsx`**
- Replace the 3-button `TimeRange` toggle with `DateRangeSelector`
- Change `fetchData(weeks)` to `fetchData(fromDate, toDate)` using the Date objects directly
- Default preset: 1M

**`ReadinessChart.tsx`**
- Replace the `7d / 14d / 30d` buttons with `DateRangeSelector`
- Update the query to use `from` and `to` dates
- Default preset: 1W

**`VolumeTrendChart.tsx`**
- Add `DateRangeSelector` in the card header (currently has none)
- Update `fetchWeeklyVolume` call to accept a date range
- Default preset: 1M

**`StrengthTrendChart.tsx`**
- Add `DateRangeSelector` in the card header alongside the exercise selector
- Filter `history` results by the selected date range
- Default preset: 3M

**`ActivityHeatmap.tsx`**
- Add `DateRangeSelector` in the card header
- Replace hardcoded `WEEKS_TO_SHOW = 12` with computed weeks from selected range
- Default preset: 3M

**`ClientPerformanceReport.tsx`**
- Replace the `Select` dropdown with `DateRangeSelector`
- Pass dates instead of weeks string to the edge function
- Default preset: 2M (closest to current 8 weeks)

**`WeightChart.tsx`**
- Add `DateRangeSelector` above the chart
- Filter `entries` prop by selected date range before charting
- Default preset: 3M

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/DateRangeSelector.tsx` | New shared component with presets + custom calendar popover |
| `src/components/workout/MovementBalanceChart.tsx` | Replace time toggle with DateRangeSelector |
| `src/components/lifestyle/ReadinessChart.tsx` | Replace day buttons with DateRangeSelector |
| `src/components/workout/VolumeTrendChart.tsx` | Add DateRangeSelector (currently has none) |
| `src/components/workout/StrengthTrendChart.tsx` | Add DateRangeSelector |
| `src/components/workout/ActivityHeatmap.tsx` | Add DateRangeSelector, dynamic weeks |
| `src/components/admin/ClientPerformanceReport.tsx` | Replace Select with DateRangeSelector |
| `src/components/progress/WeightChart.tsx` | Add DateRangeSelector for filtering entries |

