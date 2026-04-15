

## Plan: Complete UI Consistency Overhaul — Every Component Matches Mockup

The previous changes updated global primitives (card, badge, tabs) and a few dashboard components, but left ~30+ components with inconsistent typography, spacing, and styling. This plan addresses every remaining gap systematically.

### Remaining Gaps Found

| Gap | Where | Fix |
|-----|-------|-----|
| `text-lg` / `text-xl` / `text-2xl` titles still used | GoalsPanel, ReadinessChart, BreathworkSection, ProgressTab, ProgramLibrary, WorkoutLogger, PrivateCoachingPanel | Reduce to `text-sm`/`text-base` |
| `text-sm` body text instead of `text-xs` | FoodDiary, MealSection, CalorieSummary, DailyCheckin, ProgressOverview | Scale down to `text-xs` |
| `p-4`/`p-5`/`p-6` padding on CardContent | ProgramCard, PrivateCoachingPanel, DailyCheckin, BreathworkSection, ProgressOverview | Standardize to `p-3` mobile / `p-4` desktop |
| Numeric values not using `font-mono` | ProgressOverview, CalorieSummary, some workout stats | Add `font-mono` class |
| Section headers using `Badge + h2 + p` pattern | ProgramLibrary, Nutrition page | Replace with `section-label` + compact title |
| `text-2xl` / `text-4xl` stat values | ProgressOverview (`text-2xl`), PrivateCoachingPanel (`text-4xl`), CalorieSummary (`text-2xl`) | Reduce to `text-lg font-mono` |
| `font-semibold` on non-header text | MealSection slot label, ExerciseCard name | Keep but reduce font size |
| Exercise card title `text-base uppercase` | ExerciseCard line 203 | Reduce to `text-sm` |
| `h-12 w-12` icons in empty states | WorkoutLogger, ProgressTab, DailyCheckin | Reduce to `h-8 w-8` |
| `text-xl` in empty state headings | WorkoutLogger line 309 | Reduce to `text-base` |
| `py-8` padding in empty states | WorkoutLogger, GoalsPanel | Reduce to `py-6` |
| ReadinessChart CardTitle `text-lg` | ReadinessChart line 71 | Reduce to `text-sm` |
| BreathworkSection CardTitle `text-lg` | Multiple places | Reduce to `text-sm` |
| VaultPage.tsx dynamic import error | Runtime error on load | Fix the import/export |
| `space-y-6` used everywhere | Most tab components | Reduce to `space-y-4` on mobile |

### Changes by File (~25 files)

**Fix runtime error:**
1. **`src/pages/VaultPage.tsx`** — Verify export matches what App.tsx expects; likely just needs a rebuild trigger

**Typography & Density fixes (component-by-component):**

2. **`src/components/goals/GoalsPanel.tsx`** — `text-lg` → `text-sm`, icon `w-5 h-5` → `w-4 h-4`
3. **`src/components/goals/GoalCard.tsx`** — Already compact, minor: ensure `font-mono` on all numeric values
4. **`src/components/lifestyle/ReadinessChart.tsx`** — CardTitle `text-lg` → remove (use default `text-sm`), `text-sm` description → `text-xs`
5. **`src/components/lifestyle/BreathworkSection.tsx`** — All `text-lg` CardTitles → default, `text-sm` → `text-xs` for descriptions
6. **`src/components/lifestyle/DailyCheckin.tsx`** — `p-6` → `p-3`, `text-2xl` readiness → `text-lg`, `text-lg` sleep hours → `text-base font-mono`
7. **`src/components/progress/ProgressTab.tsx`** — Remove duplicate "Your Progress" h3 (redundant with section-label header), `text-lg` → `text-sm`, `text-sm` → `text-xs` descriptions
8. **`src/components/progress/ProgressOverview.tsx`** — `text-2xl` stat values → `text-lg font-mono`, `p-4` → `p-3`
9. **`src/components/nutrition/CalorieSummary.tsx`** — `text-2xl` → `text-lg font-mono`, `w-5 h-5` icon → `w-4 h-4`
10. **`src/components/nutrition/MealSection.tsx`** — Already compact; minor: `text-sm` cal label → `text-xs font-mono`
11. **`src/components/nutrition/FoodDiary.tsx`** — `text-sm` → `text-xs` on search results text, food items
12. **`src/components/nutrition/NutritionCalculator.tsx`** — Step titles, labels: reduce font sizes
13. **`src/components/tracks/ProgramLibrary.tsx`** — `text-xl font-bold` heading → `section-label` + `text-base font-semibold`, `text-sm` description → `text-xs`
14. **`src/components/tracks/ProgramCard.tsx`** — `p-5` → `p-3`, icon `w-5 h-5` → `w-4 h-4`
15. **`src/components/workout/ExerciseCard.tsx`** — Title `text-base uppercase` → `text-sm uppercase`, `px-4` → `px-3`
16. **`src/components/workout/SetRow.tsx`** — Already compact; ensure inputs use `font-mono`
17. **`src/components/workout/WorkoutLogger.tsx`** — Empty state: `h-12` icon → `h-8`, `text-xl` → `text-base`, `py-8` → `py-6`, stat card values add `font-mono`
18. **`src/components/dashboard/PrivateCoachingPanel.tsx`** — `text-4xl` → `text-2xl font-mono`, `p-5` → `p-3`, `text-2xl` stats → `text-lg font-mono`
19. **`src/components/community/CommunityFeed.tsx`** — Minor: ensure community header uses compact styling
20. **`src/components/community/PostCard.tsx`** — Already updated; verify consistency
21. **`src/components/vault/LibraryTab.tsx`** — Already using sub-components; verify header sizes
22. **`src/components/workout/WorkoutHistoryView.tsx`** — Check and fix any oversized text
23. **`src/components/workout/PRBoard.tsx`** — Check stat values use `font-mono`
24. **`src/components/workout/ConditioningCard.tsx`** — Match ExerciseCard density

**Global spacing:**
25. **Multiple files** — Replace `space-y-6` with `space-y-4` in: `LifestyleTab.tsx`, `ProgressTab.tsx`, `WorkoutTab.tsx`, `LibraryTab.tsx`

### What Does NOT Change
- No database changes
- No route changes
- No feature additions or removals
- No functional logic changes
- All existing component APIs preserved

### Approach
Work file-by-file, applying the same density rules everywhere:
- Titles: `text-sm font-semibold` (never `text-lg` or larger inside cards)
- Labels: `text-[10px]` or `text-xs`, mono for data labels
- Numeric values: always `font-mono`
- Card padding: `p-3` mobile, `md:p-4` desktop
- Icons in cards: `w-4 h-4` (not `w-5 h-5`)
- Empty state icons: `h-8 w-8` (not `h-12`)
- Section spacing: `space-y-4` (not `space-y-6`)

