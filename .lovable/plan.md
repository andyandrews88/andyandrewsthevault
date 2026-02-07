

# Fix: Nutrition Calculator Unit Conversion Bug

## Problem Identified

The calculator produces extreme caloric intake values because **metric unit conversion is broken**. When users select metric units (kg/cm), the raw values are stored directly but the calculation engine treats them as imperial (lbs/inches).

### Example of the Bug

If a user enters:
- Weight: 80 kg, Height: 180 cm (metric toggle ON)

The calculator incorrectly interprets this as:
- 80 lbs converted to 36.3 kg (extremely underweight)
- 180 inches converted to 457 cm (15 feet tall)

This produces a wildly inflated BMR and therefore extreme calorie targets (often 4,000-6,000+ calories).

---

## Root Cause

In `NutritionCalculator.tsx`, the `BiometricsStep` component saves user input directly without converting to internal units:

```typescript
// Current (broken):
onChange={(e) => onChange({ weight: parseFloat(e.target.value) || undefined })}

// The toInternalUnits() function exists but is never called
```

The `toInternalUnits()` utility in `nutritionStore.ts` is defined but never used.

---

## Solution

### Option A: Convert on Input (Recommended)

Convert metric values to imperial when storing, and convert back for display. This keeps the internal data model consistent.

**Changes to `NutritionCalculator.tsx`:**

1. Import the conversion utility from the store
2. When unit system is metric, convert kg to lbs and cm to inches before saving
3. When displaying, convert internal lbs/inches back to kg/cm for metric users

### Option B: Convert at Calculation Time

Keep raw values in store and convert during calculation based on the stored `unitSystem` flag.

**Recommendation:** Option A is cleaner and follows the documented intent ("Always stored in lbs/inches internally").

---

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/nutrition/NutritionCalculator.tsx` | Add unit conversion on weight/height input and display |

### Code Changes

**BiometricsStep component:**

1. Add helper functions to convert display values to internal and vice versa
2. Modify weight input:
   - On change: if metric, convert kg to lbs before saving
   - On display: if metric, convert stored lbs to kg for the input value
3. Modify height input:
   - On change: if metric, convert cm to inches before saving
   - On display: if metric, convert stored inches to cm for the input value

### Conversion Formulas

```text
Input (metric to internal):
  weight: kg * 2.20462 = lbs
  height: cm / 2.54 = inches

Display (internal to metric):
  weight: lbs / 2.20462 = kg
  height: inches * 2.54 = cm
```

---

## Validation

After the fix, expected results for a 180 lb, 70 inch (5'10"), 30-year-old male:
- BMR (Mifflin-St Jeor): ~1,800 calories
- TDEE (Moderately Active): ~2,800 calories
- These are realistic values for the demographic

---

## Technical Notes

- The existing `toInternalUnits` and `toDisplayUnits` functions in `nutritionStore.ts` can be imported and reused
- Round displayed metric values to 1 decimal place for cleaner UX
- Ensure body fat percentage is not affected (it's already unit-agnostic)

