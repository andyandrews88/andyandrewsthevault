

# Two-Mode Nutrition Tracker: Hand Portions vs. Detailed Logging

## The Core Idea

Users choose their tracking method at the top of the Food Diary tab:

- **Simple Mode (Hand Portions)**: Tap how many palms/fists/thumbs/cupped hands you ate, then pick what you ate from a quick list. Low friction, Precision Nutrition style.
- **Detailed Mode (MyFitnessPal style)**: The current food diary with exact foods, amounts, and units. High precision.

Both modes save to the same `user_food_diary` database table so the AI weekly review can reference all data regardless of method.

---

## How the Hand Portion Tracker Works (User Flow)

1. User sees 4 large tap targets, one per portion type:
   - ✋ **Palms** (Protein) -- stepper: 0, 0.5, 1, 1.5, 2...
   - 🤲 **Cupped Hands** (Carbs) -- same stepper
   - 👍 **Thumbs** (Fats) -- same stepper
   - 👊 **Fists** (Veggies) -- same stepper

2. When the user taps + on any portion (e.g., taps ✋ to add 1 palm of protein), a popup appears asking **"What did you eat?"** with a filtered list of foods from that macro category:
   - ✋ Palm tapped --> shows protein sources (chicken breast, salmon, eggs, etc.)
   - 🤲 Cupped Hand tapped --> shows carb sources (rice, oats, sweet potato, etc.)
   - 👍 Thumb tapped --> shows fat sources (avocado, olive oil, almonds, etc.)
   - 👊 Fist tapped --> shows vegetables (broccoli, spinach, mixed greens, etc.)

3. User picks the source from a scrollable list (with search). The entry is logged with the portion count and the source food, and macros are auto-calculated using the formula: `portions x gramsPerPortion = macro grams`, then the food's calorie density fills in the rest.

4. The entry appears in the meal slot (Breakfast/Lunch/Dinner/Snacks) with a simple display: "✋ 1 Palm -- Chicken Breast (120 cal)"

---

## What Gets Stored

Each hand-portion entry saves to `user_food_diary` with:
- `food_data`: the selected food item (same as detailed mode)
- `amount`: the portion count (e.g., 1.5)
- `unit`: a new unit value `'palm'`, `'cupped_hand'`, `'thumb'`, or `'fist'`
- `meal_slot`: which meal it belongs to
- `calculated_macros`: auto-calculated from portion size x food's macro density

This means both tracking modes produce compatible data for the CalorieSummary, the AI weekly review, and all existing analytics.

---

## Technical Plan

### New Files

| File | Purpose |
|------|---------|
| `src/components/nutrition/HandPortionLogger.tsx` | The simple-mode UI: 4 portion type cards with steppers, source picker popup |
| `src/components/nutrition/PortionSourcePicker.tsx` | Popup/dialog that shows filtered foods by macro category when a portion is added |

### Modified Files

| File | Change |
|------|--------|
| `src/components/nutrition/FoodDiary.tsx` | Add a toggle at the top: "Simple" vs "Detailed" mode. Simple mode renders `HandPortionLogger`, Detailed mode renders the current meal sections |
| `src/lib/handPortions.ts` | Add `PORTION_UNITS` mapping and a `portionToMacros()` function that converts a portion count + food item into calculated macros |
| `src/lib/unitConversions.ts` | Add `'palm'`, `'cupped_hand'`, `'thumb'`, `'fist'` to the `MeasurementUnit` type and handle them in `calculateMacros()` |
| `src/stores/mealBuilderStore.ts` | No structural changes needed -- `addDiaryEntry` already accepts any unit. Just needs the new unit values to flow through |

### HandPortionLogger.tsx (New Component)

The main simple-mode view, organized by meal slot. For each meal slot:
- 4 portion-type rows (Protein/Carbs/Fats/Veggies), each with:
  - Emoji + label on the left
  - Current count in the center (e.g., "2 palms")
  - Plus/minus stepper buttons on the right
- Tapping "+" opens the `PortionSourcePicker` filtered to the relevant food category
- Below the steppers, a list of what was logged (e.g., "1 palm -- Chicken Breast")
- Daily totals shown at the top via the existing `CalorieSummary` component

### PortionSourcePicker.tsx (New Component)

A dialog/popover that appears when adding a portion:
- Header: "What protein did you eat?" (or carbs/fats/veggies depending on type)
- Search bar at top for filtering
- Scrollable grid of popular items from the food database, filtered by category mapping:
  - Palm --> `lean_protein`, `whole_protein`, `dairy_vegetarian` (protein-dominant items)
  - Cupped Hand --> `carbohydrate`, `fruit`
  - Thumb --> `healthy_fat`
  - Fist --> `vegetable`
- Each item shows name + emoji/icon, tapping it confirms the entry
- "Custom" option at bottom for items not in the database

### Unit Conversion Updates

Add to `src/lib/unitConversions.ts`:
- New unit types: `'palm' | 'cupped_hand' | 'thumb' | 'fist'`
- In `calculateMacros()`, when the unit is a portion type, multiply the food's macro values by the portion count (treating each portion as 1 serving of that food, since the food database already has reasonable serving sizes that approximate hand portions)

### Mode Toggle in FoodDiary

At the top of the Food Diary, below the date navigator:
- A `ToggleGroup` with two options: "✋ Simple" and "📊 Detailed"
- Persisted in the store as `trackingMode: 'simple' | 'detailed'`
- Simple mode renders `HandPortionLogger`
- Detailed mode renders the existing `MealSection` cards
- Both modes share the same `CalorieSummary` at the top and the same underlying data

### Macro Calculation for Hand Portions

When a user logs "1 palm of chicken breast":
1. Look up chicken breast: 26g protein, 0g carbs, 1.5g fats per serving (113g / 4oz)
2. One palm is approximately one serving of protein, so log it as 1 serving
3. Calculated macros: 120 cal, 26g P, 0g C, 1.5g F
4. This is stored exactly like a detailed entry but with `unit: 'palm'`

This keeps the math grounded in real food data rather than just assuming "1 palm = 25g protein" generically -- the actual food source makes it more accurate.

---

## Summary

The key insight is that both modes write to the same database and the same store. The hand portion mode is just a simpler UI layer on top of the same data model. Users who want speed use Simple mode. Users who want precision use Detailed mode. The AI review sees all of it.

No database changes needed. No edge function changes.
