

# Mobile UI Audit and Polish Plan

## Issues Identified

After a thorough visual and code review of every major section at 390px width, the following problems were found:

### 1. Main Tab Bar Overflow and Cramping
**File:** `src/pages/Vault.tsx` (lines 62-103)
- The 8-9 tab buttons (`Dashboard`, `Library`, `Progress`, `Lifestyle`, `Workouts`, `Podcast`, `Community`, `Tracks`, `Admin`) use `inline-flex w-max` with horizontal scroll, but each tab has both an icon AND text label even on small screens. The tabs appear cramped with tiny text.
- **Fix:** On mobile (below `sm`), hide the text labels entirely and show only icons. This gives each icon more breathing room and eliminates the need to scroll. Add a tooltip or `aria-label` for accessibility. Keep the text visible at `sm` breakpoint and above.

### 2. Vault Header Takes Too Much Vertical Space on Mobile
**File:** `src/pages/Vault.tsx` (lines 37-58)
- The logo (`h-20 md:h-28`), badge, heading, description, and coaching button stack up taking a large chunk of the viewport before the user reaches any content.
- **Fix:** Reduce logo size to `h-14` on mobile (keep `md:h-28`). Reduce heading to `text-xl` on mobile. Hide the description paragraph on mobile. Make the coaching button smaller on mobile.

### 3. Container Padding Too Wide on Mobile
**File:** `src/pages/Vault.tsx` (line 35)
- `px-6` is 24px padding on each side, eating 48px of a 390px screen.
- **Fix:** Change to `px-4 md:px-6` to recover 16px of horizontal space.

### 4. ExerciseCard and ConditioningCard 6-Column Grid Cramped
**Files:** `src/components/workout/ExerciseCard.tsx` (line 82), `src/components/workout/SetRow.tsx` (line 92), `src/components/workout/ConditioningCard.tsx` (line 69), `src/components/workout/ConditioningSetRow.tsx` (line 80)
- The grid `grid-cols-[40px_1fr_1fr_1fr_44px_32px]` forces 6 columns into ~340px usable width. The inputs get squeezed especially in ConditioningSetRow where the distance column has both an input AND a unit selector side-by-side.
- **Fix for SetRow:** Reduce the set number column from `40px` to `32px`, and the delete button column from `32px` to `28px`. Change grid to `grid-cols-[32px_1fr_1fr_1fr_40px_28px]` for a tighter but cleaner fit.
- **Fix for ConditioningSetRow:** Replace the 6-column grid on mobile with a stacked 2-row layout. Row 1: Set number, time, checkbox, delete. Row 2: Distance (with unit), calories. This eliminates the cramming entirely.

### 5. WorkoutHistoryView Header Overlap
**File:** `src/components/workout/WorkoutHistoryView.tsx` (lines 30-49)
- The workout title and Edit button + Completed badge sit side by side. On mobile, long workout names push the buttons off-screen or overlap.
- **Fix:** Stack the header vertically on mobile: title and date on top, buttons below. Use `flex-col sm:flex-row` pattern.

### 6. GoalCard Status Badge Crowding
**File:** `src/components/goals/GoalCard.tsx` (lines 42-53)
- The goal title uses `truncate` and the badge uses `shrink-0 ml-2`. On narrow screens, the badge can push against the truncated title, leaving very little text visible.
- **Fix:** Reduce badge text size to `text-[10px]` on mobile. Move the badge below the title on very small screens using `flex-wrap`.

### 7. GoalCard Stats Row Cramping
**File:** `src/components/goals/GoalCard.tsx` (lines 67-77)
- Three stats (`days remaining`, `weekly rate`, `ETA`) sit on one line with `justify-between`. On narrow cards, these can overlap.
- **Fix:** Use `flex-wrap gap-x-3 gap-y-1` instead of `justify-between` to allow graceful wrapping.

### 8. Progress Overview 4-Column Grid on Mobile
**File:** `src/components/progress/ProgressOverview.tsx` (line 36)
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` is correct, but the `text-2xl` values can still feel large in a single-column mobile view.
- **Fix:** This is actually fine. No change needed.

### 9. DailyCheckin Score Buttons
**File:** `src/components/lifestyle/DailyCheckin.tsx` (lines 214-226)
- The 5 rating buttons (`flex-1 py-2.5`) with sub-labels (`text-[10px]`) work reasonably but the sub-labels can get cut off.
- **Fix:** Increase minimum touch target by changing `py-2.5` to `py-3` and ensure the labels are always visible.

### 10. WeekStrip Day Buttons
**File:** `src/components/workout/WeekStrip.tsx` (lines 53-90)
- Already using `grid-cols-7` which is correct for a week view. However, the day labels (`text-xs`) and numbers (`text-lg`) are fine. Minor improvement: increase touch target height.
- **Fix:** Add `min-h-[56px]` to each day button to ensure a 56px touch target height.

### 11. WorkoutTab Sub-Tabs Redundancy
**File:** `src/components/workout/WorkoutTab.tsx` (lines 17-23)
- The description header (`text-center`) takes up vertical space on mobile before the content.
- **Fix:** Reduce heading size and hide the description paragraph on mobile using `hidden sm:block`.

### 12. Nutrition DailySummaryBar Calorie Text Overlap
**File:** `src/components/nutrition/DailySummaryBar.tsx` (lines 26-37)
- The calorie display shows consumed calories, slash, target, and a "remaining" indicator all on one line. On 390px, this can get cramped.
- **Fix:** Stack the calorie display vertically on mobile: consumed/target on one line, remaining on the next.

---

## Technical Summary

| File | Change Type |
|------|-------------|
| `src/pages/Vault.tsx` | Reduce header sizes, icon-only tabs on mobile, tighter padding |
| `src/components/workout/SetRow.tsx` | Tighten grid column widths |
| `src/components/workout/ExerciseCard.tsx` | Match header grid to SetRow |
| `src/components/workout/ConditioningSetRow.tsx` | Stack into 2 rows on mobile |
| `src/components/workout/ConditioningCard.tsx` | Match header grid to ConditioningSetRow |
| `src/components/workout/WorkoutHistoryView.tsx` | Stack header on mobile |
| `src/components/workout/WorkoutTab.tsx` | Hide description on mobile |
| `src/components/workout/WeekStrip.tsx` | Increase touch target height |
| `src/components/goals/GoalCard.tsx` | Wrap badge, wrap stats row |
| `src/components/nutrition/DailySummaryBar.tsx` | Stack calorie line on mobile |
| `src/components/lifestyle/DailyCheckin.tsx` | Increase button touch targets |

No database changes. No flow changes. Pure CSS/layout adjustments.

