

# Mobile UI Polish & World-Class Refinement Plan

## Issues Identified

### 1. Tab Bar Overflow (Critical)
The Vault has 8-9 tabs in a `grid grid-cols-5` on mobile, which means the second row (Podcast, Community, Tracks, Admin) wraps awkwardly. The icons are tiny (10px labels) and the touch targets are cramped. This is the most visible UX problem.

**Fix**: Convert to a horizontally scrollable pill bar with `overflow-x-auto scrollbar-hide` instead of a 2-row grid. Tabs become a single scrollable row with proper touch targets (min 44px height). Active tab gets a subtle underline/highlight.

### 2. Vault Header Takes Too Much Space
The logo + badges + title + subtitle + coaching link consume ~240px of vertical space before any content appears. On a 390px-wide phone, users have to scroll past all of this every time they switch tabs.

**Fix**: Condense the header on mobile — hide the subtitle, reduce logo size to `h-10`, and inline the badges next to the title. Save ~100px of vertical space.

### 3. Nutrition Page — Redundant Header
The `/nutrition` page has its own full logo + badge + title + long description paragraph (~300px of vertical space) before the calculator even starts. This feels disconnected from the Vault.

**Fix**: Tighten the header — smaller logo, shorter copy, remove the footer formula text on mobile.

### 4. CalorieSummary — Sticky Bar Overlap
The `CalorieSummary` is `sticky top-0` but the navbar is `fixed top-0 h-16`. The sticky summary slides under the navbar instead of below it.

**Fix**: Set `sticky top-16` so it sits below the navbar.

### 5. Food Search Dialog — Mobile Cramped
The food search dialog (`sm:max-w-lg`) doesn't use full screen on mobile. The 300px max-height scroll area is too short, and results are hard to tap.

**Fix**: Make the dialog full-screen on mobile (`h-[100dvh]` on small screens), expand the results area, and increase touch target size for food items.

### 6. CustomFoodForm — 4-Column Macro Grid Too Tight
The macro inputs (Calories, Protein, Carbs, Fats) are in a `grid-cols-4` which is extremely cramped on mobile — labels get truncated and inputs are too narrow to type in.

**Fix**: Change to `grid-cols-2` on mobile, `grid-cols-4` on desktop.

### 7. BarcodeScanner Component — Bulky Card Layout
The barcode scanner sits in a large Card with CardHeader/CardContent pattern. On mobile it takes too much space when collapsed and the manual entry UI is cluttered.

**Fix**: Simplify to a compact button that expands inline. Use a bottom sheet for scanner results and manual entry fallback.

### 8. HandPortionLogger — Small Touch Targets
The +/- buttons are `h-8 w-8` which is below the recommended 44px minimum. The edit button is even smaller at `h-7 w-7`.

**Fix**: Increase all touch targets to `h-10 w-10` minimum.

### 9. FoodDiaryItem — Hidden Action Buttons
Edit and delete buttons use `opacity-0 group-hover:opacity-100` which is invisible on mobile (no hover). They're set to `opacity-100` on mobile but still have `h-7 w-7` tiny touch targets.

**Fix**: Always show actions on mobile with proper sizing. Consider swipe-to-delete pattern or a long-press action sheet.

### 10. MealSection — No Visual Distinction Between Slots
All four meal sections (Breakfast, Lunch, Dinner, Snacks) look identical. No color coding or visual hierarchy.

**Fix**: Add subtle color accents per meal slot — warm tones for breakfast, neutral for lunch, cool for dinner, accent for snacks.

### 11. DateNavigator — Good But Tight
The Today button is a bit small (`h-7`). Calendar icon button could be more prominent.

**Fix**: Minor — increase Today button to `h-8`, add slight spacing.

### 12. Landing Page — CTA Buttons Stack Well But Sizing Inconsistent
The "Begin Structural Audit" and "Access The Vault" buttons stack vertically on mobile which is correct, but the second button is narrower (no `w-full`).

**Fix**: Add `w-full` to both CTAs on mobile.

---

## Implementation Plan

### Task 1: Fix Vault Tab Bar
Convert the 2-row grid to a single-row horizontally scrollable tab strip. Increase touch targets. Add active indicator animation.

**File**: `src/pages/Vault.tsx` (lines 83-127)

### Task 2: Condense Vault Header for Mobile
Reduce logo size, inline badges, hide subtitle on mobile.

**File**: `src/pages/Vault.tsx` (lines 53-79)

### Task 3: Fix CalorieSummary Sticky Position
Change `sticky top-0` to `sticky top-16` to account for the fixed navbar.

**File**: `src/components/nutrition/CalorieSummary.tsx` (line 46)

### Task 4: Mobile-Optimize Food Search Dialog
Full-screen on mobile, taller results area, larger tap targets for food items.

**File**: `src/components/nutrition/FoodDiary.tsx` (search dialog section)

### Task 5: Fix CustomFoodForm Macro Grid
Change `grid-cols-4` to `grid-cols-2 sm:grid-cols-4` for macro inputs.

**File**: `src/components/nutrition/CustomFoodForm.tsx` (line 137)

### Task 6: Increase Touch Targets Across Nutrition
HandPortionLogger buttons, FoodDiaryItem actions, DateNavigator.

**Files**: `HandPortionLogger.tsx`, `FoodDiaryItem.tsx`, `DateNavigator.tsx`

### Task 7: Add Meal Slot Color Accents
Subtle color differentiation for each meal section.

**File**: `src/components/nutrition/MealSection.tsx`

### Task 8: Polish Landing Page CTAs
Ensure both CTA buttons are full-width on mobile.

**File**: `src/components/landing/HeroSection.tsx`

### Task 9: Tighten Nutrition Page Header
Reduce vertical space on the `/nutrition` page header for mobile.

**File**: `src/pages/Nutrition.tsx`

---

## Priority Order
1. Tab bar (most impactful, seen on every page)
2. Vault header condensing
3. CalorieSummary sticky fix
4. Food search dialog mobile optimization
5. Touch targets across nutrition components
6. CustomFoodForm grid fix
7. Meal slot color accents
8. Landing page CTAs
9. Nutrition page header

