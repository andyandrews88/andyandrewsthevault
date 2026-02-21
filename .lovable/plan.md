

# Nutrition Tracker Enhancement: Hand Portions, Bug Fixes, and Recipe Logging

## Overview

Three deliverables: (1) a Precision Nutrition hand-portion conversion layer with a CalorieSummary component, (2) five bug fixes for existing diary issues, and (3) a "Log to Diary" feature on recipes.

---

## 1. Hand Portion Conversion Utility

**New file: `src/lib/handPortions.ts`**

A utility that converts gram-based macros into PN hand portions:

| Portion | Emoji | Equals | Used For |
|---------|-------|--------|----------|
| Palm | ✋ | 25g protein | Protein |
| Cupped Hand | &#x1F932; | 25g carbs | Carbs |
| Thumb | &#x1F44D; | 10g fat | Fats |
| Fist | &#x270A; | 1 serving veggies | Vegetables (estimated from fiber) |

Functions exported:
- `macrosToPortions(protein, carbs, fats)` -- returns `{ palms, cuppedHands, thumbs }` as decimal values
- `portionsFromTargets(targetProtein, targetCarbs, targetFats)` -- returns target portions for the day
- `formatPortionProgress(consumed, target)` -- returns "4/6" style string

---

## 2. CalorieSummary Component

**New file: `src/components/nutrition/CalorieSummary.tsx`**

Placed at the top of the Food Diary tab (above the date navigator). Shows:

- Row 1: Calories consumed / target with progress bar (existing style)
- Row 2: Hand portion icons in a horizontal strip:
  - `✋ 4/6 Palms` (protein)
  - `&#x1F932; 6/8 Cupped Hands` (carbs)  
  - `&#x1F44D; 5/7 Thumbs` (fats)
- Each portion shows a mini progress indicator (filled/empty dots or a small progress bar)

This replaces the current `DailySummaryBar` in the Food Diary view with a richer component that includes both calorie/gram data AND hand portions side by side.

**Modified file: `src/components/nutrition/FoodDiary.tsx`**
- Replace `<DailySummaryBar>` with `<CalorieSummary>` which internally renders both the calorie bar and hand portions

---

## 3. Bug Fixes

### Bug A: Barcode Scanner hardcodes 'snacks' (line 142)
**File: `src/components/nutrition/BarcodeScanner.tsx`**
- Add `mealSlot: MealSlotType` prop to `BarcodeScannerProps`
- Change `addDiaryEntry(scannedProduct, 'snacks', ...)` to `addDiaryEntry(scannedProduct, mealSlot, ...)`

**File: `src/components/nutrition/FoodDiary.tsx`**
- Pass `activeMealSlot` as a prop to `<BarcodeScanner mealSlot={activeMealSlot} />`

### Bug B: FoodDatabase hardcodes 'snacks' (line 63)
**File: `src/components/nutrition/FoodDatabase.tsx`**
- Add `mealSlot?: MealSlotType` prop
- Use `mealSlot || 'snacks'` in `addDiaryEntry` call
- Pass it from `NutritionResults.tsx` when rendered in the Foods tab

### Bug C: FoodDiaryItem edit preview shows stale macros
**File: `src/components/nutrition/FoodDiaryItem.tsx`**
- Import `calculateMacros` from `@/lib/unitConversions`
- Add a `useMemo` that recalculates macros from `editAmount` and `editUnit` using the food's base values
- Display the recalculated preview macros instead of `calculatedMacros` (which reflects the saved state, not the pending edit)

### Bug D: selectedDate serialization
**File: `src/stores/mealBuilderStore.ts`**
- The store already excludes `selectedDate` from `partialize` (only persists `savedMeals` and `preferredUnit`), so the Date object initializes fresh as `new Date()` on each load. This is actually correct behavior -- no change needed. The date is intentionally ephemeral.

### Bug E: Loading indicator during fetch
**File: `src/components/nutrition/FoodDiary.tsx`**
- Import `Skeleton` from `@/components/ui/skeleton`
- When `isLoading` is true, render 4 skeleton cards (one per meal slot) instead of the real `MealSection` components
- This prevents showing stale data from a previous date during transitions

---

## 4. Recipe Logging Feature

### RecipeDetailModal -- "Log to Diary" button
**File: `src/components/nutrition/RecipeDetailModal.tsx`**
- Add `onLogToDiary?: (recipe: Recipe, slot: MealSlotType) => void` prop
- Add a "Log to Diary" button at the bottom of the modal (before tags)
- On click, show a small inline slot picker (4 buttons: Breakfast / Lunch / Dinner / Snack)
- On slot selection, call `onLogToDiary(recipe, selectedSlot)` and close the modal

### MealPlanGenerator -- quick-log button on recipe cards
**File: `src/components/nutrition/MealPlanGenerator.tsx`**
- Add `onLogRecipe?: (recipe: Recipe, slot: MealSlotType) => void` prop
- Add a small "+" icon button on each recipe card (top-right, stops click propagation)
- On click, show a dropdown or popover with the 4 meal slot options
- On slot selection, call `onLogRecipe(recipe, slot)`

### Recipe logging logic
**File: `src/components/nutrition/NutritionResults.tsx`**
- Create a `handleLogRecipe(recipe, slot)` function that:
  1. Iterates `recipe.ingredients`
  2. For each ingredient, calls `getFoodById(ing.foodId)` to resolve the food item
  3. Calls `addDiaryEntry(food, slot, ing.quantity, 'piece')` for each resolved ingredient
  4. Shows a toast: "Logged {recipe.name} to {slot}"
- Pass this handler to both `<MealPlanGenerator onLogRecipe={handleLogRecipe} />` and through `<RecipeDetailModal onLogToDiary={handleLogRecipe} />`

### Hand portion display on entries
**File: `src/components/nutrition/FoodDiaryItem.tsx`**
- After the calorie display, add a small inline portion indicator using the hand portion utility
- Example: `120 cal ✋1 👍0.5` showing that this food item contributes 1 palm of protein and half a thumb of fat
- Keep it subtle (text-xs, muted color) so it doesn't clutter the compact row

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/handPortions.ts` | Create | Macro-to-hand-portion conversion utility |
| `src/components/nutrition/CalorieSummary.tsx` | Create | Combined calorie + hand portion summary bar |
| `src/components/nutrition/FoodDiary.tsx` | Modify | Use CalorieSummary, pass mealSlot to BarcodeScanner, add loading skeletons |
| `src/components/nutrition/BarcodeScanner.tsx` | Modify | Accept mealSlot prop instead of hardcoding 'snacks' |
| `src/components/nutrition/FoodDatabase.tsx` | Modify | Accept mealSlot prop instead of hardcoding 'snacks' |
| `src/components/nutrition/FoodDiaryItem.tsx` | Modify | Fix edit preview macros, add hand portion indicators |
| `src/components/nutrition/RecipeDetailModal.tsx` | Modify | Add "Log to Diary" button with slot picker |
| `src/components/nutrition/MealPlanGenerator.tsx` | Modify | Add quick-log button on recipe cards |
| `src/components/nutrition/NutritionResults.tsx` | Modify | Wire up recipe logging handler, pass mealSlot to FoodDatabase |

No database changes required. No edge function changes.

