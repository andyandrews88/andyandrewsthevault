
# Upgrade Recipe Ideas: Clickable Cards + 50+ Recipes

## Problem

1. **Recipe cards don't do anything when clicked** -- they have `variant="interactive"` (shows pointer cursor) but no click handler or detail view
2. **Only 17 recipes exist** in `src/data/recipes.ts`
3. **Missing categories**: no smoothies, protein bowls, or overnight oats

## Solution

### 1. Add a Recipe Detail Modal

Create a new `RecipeDetailModal` component that opens when a recipe card is clicked, showing:
- Recipe name, prep time, servings
- Full macro breakdown (calories, protein, carbs, fats)
- Complete ingredient list with quantities
- Step-by-step instructions
- Tags

### 2. Wire up click handlers in MealPlanGenerator

Add state to track the selected recipe and open the modal when a card is clicked.

### 3. Expand to 50+ recipes across new categories

Update the `MealType` type in `src/types/nutrition.ts` to add `smoothie` and update the tab structure. Then expand `src/data/recipes.ts` with 35+ new recipes across these categories:

**New recipe categories/types to add:**

| Category | Examples | Count |
|----------|----------|-------|
| Smoothies | Berry Protein Smoothie, Green Machine, Tropical Protein, PB Banana Smoothie, Chocolate Recovery | ~8 |
| Protein Bowls | Chicken Burrito Bowl, Tuna Poke Bowl, Turkey Taco Bowl, Shrimp Rice Bowl, Tofu Power Bowl | ~6 |
| Overnight Oats | Classic PB Overnight Oats, Berry Protein Oats, Chocolate Banana Oats, Apple Cinnamon Oats | ~5 |
| Additional Breakfast | Protein Pancakes, Egg Muffin Cups, Avocado Toast + Eggs | ~4 |
| Additional Lunch | Grilled Chicken Salad, Tuna Lettuce Wraps, Shrimp Tacos | ~4 |
| Additional Dinner | Lean Beef Tacos, Cod & Vegetables, Turkey Meatballs | ~4 |
| Additional Snacks | Protein Energy Balls, Edamame, Tuna Rice Cakes, Greek Yogurt Bark | ~6 |

All recipes will emphasize **high-protein, low-calorie** options with full macro data.

### 4. Update Tab Structure in MealPlanGenerator

Change from 4 tabs to 6 tabs to accommodate the new categories:

- Breakfast (includes overnight oats)
- Lunch
- Dinner
- Snacks
- Smoothies (new)
- Bowls (new)

Also remove the `.slice(0, 3)` limit so all recipes in each category are visible.

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/nutrition/RecipeDetailModal.tsx` | **NEW** -- Modal showing full recipe details |
| `src/components/nutrition/MealPlanGenerator.tsx` | Add click handlers, state for selected recipe, render modal, update tabs to 6 categories |
| `src/data/recipes.ts` | Expand from 17 to 50+ recipes with smoothies, protein bowls, overnight oats |
| `src/types/nutrition.ts` | Add `smoothie` and `bowl` to `MealType` union |

## RecipeDetailModal Design

```
+------------------------------------------+
|  [X]  Classic Chicken & Rice Bowl        |
|        15-30 min  |  1 serving           |
+------------------------------------------+
|  550 kcal  | 45g P | 58g C | 12g F      |
+------------------------------------------+
|  INGREDIENTS                             |
|  - 6 oz chicken breast                   |
|  - 1.5 cups white rice                   |
|  - 1 cup broccoli                        |
|  - 0.5 tbsp olive oil                    |
+------------------------------------------+
|  INSTRUCTIONS                            |
|  1. Cook rice according to directions    |
|  2. Season chicken with salt & pepper    |
|  3. Grill chicken to 165F               |
|  4. Steam broccoli until tender-crisp    |
|  5. Slice and serve over rice            |
+------------------------------------------+
|  Tags: meal-prep, balanced, gluten-free  |
+------------------------------------------+
```

## Technical Details

- The modal uses the existing `Dialog` component from `@/components/ui/dialog`
- Recipe data stays as static TypeScript arrays (no database needed)
- Each recipe card gets an `onClick` that sets `selectedRecipe` state
- The modal reads `instructions` and `ingredients` arrays already present in the Recipe type
