

# Nutrition Overhaul — Implementation Plan

## What We're Building

### Phase 1: Database — `custom_foods` table
Create a shared food database table where users can add custom foods (including from failed barcode scans). All authenticated users can search public entries; creators can edit/delete their own.

### Phase 2: Nutritionix API Integration
Create an edge function `nutritionix-search` that proxies search and UPC barcode lookups to the Nutritionix API. **Requires two secrets**: `NUTRITIONIX_APP_ID` and `NUTRITIONIX_APP_KEY` — I'll request these from you before proceeding with code.

### Phase 3: Fix Barcode Scanner
- When Open Food Facts returns nothing, try Nutritionix UPC lookup as fallback
- If both fail, show a **manual entry form** (name, brand, serving, calories, protein, carbs, fats)
- On submit, save to `custom_foods` with the barcode so future scans find it instantly

### Phase 4: Expand Food Search
Update `FoodDiary.tsx` search dialog to aggregate results from:
1. Local hardcoded database (instant)
2. `custom_foods` table (database query)
3. Nutritionix API (debounced)
- Results grouped by source
- "Create Custom Food" button at bottom for manual entry

### Phase 5: Bug Fixes
- Fix `activeMealSlot` — add a meal slot picker directly on BarcodeScanner
- Fix date fetch on mount to use store's `selectedDate`
- Add toast notifications for add/remove operations

## Files

| Action | File |
|--------|------|
| Create | `supabase/functions/nutritionix-search/index.ts` |
| Create | `src/components/nutrition/CustomFoodForm.tsx` |
| Modify | `src/components/nutrition/BarcodeScanner.tsx` |
| Modify | `src/components/nutrition/FoodDiary.tsx` |
| Modify | `src/stores/mealBuilderStore.ts` |
| Migration | `custom_foods` table + RLS policies |

## Secrets Needed First
- `NUTRITIONIX_APP_ID` — from your Nutritionix developer account
- `NUTRITIONIX_APP_KEY` — from your Nutritionix developer account

I'll request these via the secrets tool before writing the edge function code. You can get them free at [developer.nutritionix.com](https://developer.nutritionix.com).

