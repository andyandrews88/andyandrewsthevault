

# Plan: Admin Mobile UI Overhaul

## Problem Summary
The Client Directory table in the `AdminDetailDrawer` scrolls horizontally and gets stuck on mobile because the `<Table>` inside `overflow-x-auto` fights with the Sheet's own scroll, causing scroll trapping. Beyond that, several admin sections have mobile-hostile patterns that need fixing.

## Audit of All Admin Sections — Mobile Issues Found

### 1. Client Directory (AdminDetailDrawer — users section) — CRITICAL
- **Scroll trapping**: The table uses `overflow-x-auto` inside a sheet with `overflow-y-auto`, causing bidirectional scroll conflict on touch
- **Too many columns visible**: On mobile, columns like "Last Check-in", "Compliance" are hidden via `md:table-cell` but "Last Workout", "Workouts", and action columns still force horizontal scroll
- **Fix**: On mobile, replace the table with a stacked card layout (one card per client) showing name, avatar, last workout badge, and workout count. Keep the table for desktop. Use `useIsMobile()` to switch

### 2. AdminDashboard header — MODERATE
- **Lines 128-137**: The "Quick Assign" and "My Templates" buttons overflow on narrow screens, pushing against the title
- **Fix**: Stack buttons below the title on mobile, or collapse into a single dropdown/action menu

### 3. AdminUserProfile header — MODERATE
- **Lines 419-455**: The user info (email, sex, age, height, weight, location, join date, days) wraps poorly on mobile — too many inline items create visual clutter
- **Fix**: Limit inline items on mobile to 2-3 key stats, put the rest behind a collapsible "More info" section

### 4. AdminUserProfile — Training section table — MODERATE
- **Lines 254-278**: The "Recent Workouts" table has 5 columns (Workout, Date, Status, Volume, Actions) that overflow on mobile
- **Fix**: On mobile, switch to card layout or hide Volume/Actions columns, show actions via swipe or long-press

### 5. AdminUserProfile — Check-in History table — MODERATE
- **Lines 303-316**: 6 columns (Date, Sleep Hrs, Sleep Q, Energy, Stress, Drive) — too wide for mobile
- **Fix**: On mobile, show as compact cards or a 2-column grid of scores per date

### 6. PTSessionTracker tables — MODERATE
- **Lines 305-336**: Session History table (Date, Workout, Notes, Actions) — Notes column truncates but still takes space
- **Lines 376-411**: Invoices table (Date, Amount, Status, Link, Delete) — 5 columns
- **Fix**: Card-based layouts on mobile for both

### 7. AdminDetailDrawer — Sheet width — MINOR
- The Sheet is `w-full sm:max-w-2xl` which is fine, but the maximize button (`95vw`) isn't useful on mobile
- **Fix**: Hide the maximize button on mobile

### 8. AI Intelligence Briefing header — MINOR
- **Line 150**: `flex-row` header with title + timestamp badge + two buttons wraps awkwardly on mobile
- **Fix**: Stack controls below title on mobile

## Implementation Priority

| Priority | Area | Effort |
|----------|------|--------|
| 1 (Critical) | Client Directory → card layout on mobile | Medium |
| 2 | AdminDashboard header buttons | Small |
| 3 | AdminUserProfile header info overflow | Small |
| 4 | Training table → mobile cards | Medium |
| 5 | Check-in table → mobile layout | Medium |
| 6 | PT Session/Invoice tables → mobile cards | Medium |
| 7 | Hide maximize button on mobile | Trivial |
| 8 | AI Briefing header wrap | Small |

## Technical Approach

All changes use the existing `useIsMobile()` hook. Pattern: render a card-based layout when `isMobile` is true, keep existing tables for desktop. No new components needed — just conditional rendering within existing files.

### Files to modify:
- `src/components/admin/AdminDetailDrawer.tsx` — Client Directory mobile cards + hide maximize on mobile
- `src/pages/AdminDashboard.tsx` — Header button layout
- `src/pages/AdminUserProfile.tsx` — Header info, training table, check-in table
- `src/components/admin/PTSessionTracker.tsx` — Session/invoice tables
- `src/components/admin/AIIntelligenceBriefing.tsx` — Header wrap fix

No database changes. No new dependencies.

