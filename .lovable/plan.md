

# Recipe Ingredients Overhaul: Precise, Professional Measurements

## Problem

Currently, recipe ingredients display like this:
- `0.5x peanut butter`
- `1.5x chicken breast`
- `1x oats`

This is lazy and unusable for anyone actually cooking. No grams, no ounces, no cups -- just a vague multiplier of an unnamed serving size. People following these recipes for body composition results need exact, weighed measurements.

## Solution

Cross-reference each recipe ingredient's `foodId` and `quantity` with the food database to compute the **exact gram weight**, then display it in multiple useful units (grams primary, plus a practical unit like oz or cups where appropriate). Also show per-ingredient macro breakdown so users can see exactly what each ingredient contributes.

## What Changes

### 1. `src/components/nutrition/RecipeDetailModal.tsx`

Transform the ingredient list from a basic bullet list into a detailed, professional ingredient display:

**For each ingredient, show:**
- Food name (proper case, from the database -- not the raw foodId)
- Primary measurement: exact grams (e.g., "170g")
- Secondary measurement: practical unit (e.g., "6 oz" or "1.5 cups")
- Original serving context (e.g., "1.5 servings" dimmed)
- Per-ingredient macros: cal / P / C / F in a compact row

**Layout:** Each ingredient becomes a small card-like row with the name and measurements on the left, and a compact macro summary on the right.

**Example transformation:**
```
BEFORE:  - 1.5x chicken breast
AFTER:   Chicken Breast
         170g / 6 oz (1.5 servings of 4 oz)
         180 cal | 39g P | 0g C | 2.3g F
```

**Implementation:**
- Import `foodDatabase` from `@/data/foodDatabase`
- For each ingredient, look up the food item by `foodId`
- Calculate: `grams = food.servingGrams * ingredient.quantity`
- Calculate: `ounces = grams / 28.35` (rounded to 1 decimal)
- Calculate macros: multiply each macro by `ingredient.quantity`
- Show the food's `servingSize` as context (e.g., "1.5 x 4 oz serving")

### 2. `src/data/recipes.ts` -- No structural changes needed

The recipe data already has the correct `quantity` multipliers against the food database serving sizes. The food database already has `servingGrams`, `servingSize`, and all macros per serving. We just need to USE this data in the modal display.

## Visual Design

```text
+------------------------------------------+
| INGREDIENTS                              |
+------------------------------------------+
| Chicken Breast                           |
| 170g (6 oz)                    180 kcal  |
| 39g P · 0g C · 2.3g F                   |
+------------------------------------------+
| White Rice                               |
| 210g (1.5 cups cooked)        315 kcal   |
| 6g P · 69g C · 0.8g F                   |
+------------------------------------------+
| Broccoli                                 |
| 85g (3 oz)                     25 kcal   |
| 2g P · 5g C · 0g F                      |
+------------------------------------------+
```

Each ingredient row will use a subtle card background (`bg-muted/30 rounded-lg p-3`) to visually separate them and make the list scannable.

## Files Modified

| File | Change |
|------|--------|
| `src/components/nutrition/RecipeDetailModal.tsx` | Replace simple bullet list with detailed ingredient cards showing exact grams, ounces, and per-ingredient macros |

One file changed. No database changes. No flow changes. No new dependencies.

