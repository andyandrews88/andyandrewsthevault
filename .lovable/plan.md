

# Enhanced Nutrition System - User-Friendly Upgrades

## Overview
Transform the existing nutrition calculator into a more interactive, client-friendly experience with three major features:

1. **Unit Conversion Toggle** - Switch between grams, ounces, cups, tablespoons, etc.
2. **Custom Meal Builder** - Drag-and-drop foods to build meals and see real-time calorie totals
3. **Barcode Scanner** - Scan products at the supermarket to get instant nutrition info

---

## Feature 1: Multi-Unit Measurement System

### How It Works
- Add a unit selector next to each food item (grams, ounces, cups, tablespoons, pieces)
- Users can toggle between metric (grams) and imperial (ounces) globally
- Food quantities update automatically when switching units
- Serving sizes become adjustable sliders or inputs

### User Experience
```text
+------------------------------------------+
|  Chicken Breast                          |
|  [  4  ] [ oz ▼ ]     = 120 cal         |
|           - grams                        |
|           - ounces                       |
|           - pieces                       |
+------------------------------------------+
```

### Unit Conversion Reference
| Unit | Conversion |
|------|------------|
| 1 oz | 28.35 grams |
| 1 cup | ~240 grams (varies by food density) |
| 1 tbsp | ~15 grams |
| 1 tsp | ~5 grams |

---

## Feature 2: Custom Meal Builder

### How It Works
- A new "Build Your Meal" tab in the nutrition results section
- Users search and add foods from the database to their meal
- Each food shows adjustable servings with real-time macro updates
- Running totals update instantly as foods are added/removed
- Save meals for quick access later

### User Interface Flow
```text
+--------------------------------------------------+
|  MY CUSTOM MEAL                    Total: 650 cal|
|  ------------------------------------------------|
|  + Chicken Breast (6 oz)    180 cal   39g P      |
|  + White Rice (1 cup)       205 cal   4g P       |
|  + Broccoli (1 cup)         31 cal    3g P       |
|  + Olive Oil (1 tbsp)       120 cal   0g P       |
|  ------------------------------------------------|
|  TOTALS: 536 cal | 46g P | 48g C | 14g F         |
|  ------------------------------------------------|
|  [Search foods...]                    [Save Meal]|
+--------------------------------------------------+
```

### Data Storage
- Meals stored in browser local storage (zustand persist)
- Optional: Save to database for logged-in users (future enhancement)

---

## Feature 3: Barcode Scanner

### How It Works
1. User clicks "Scan Barcode" button
2. Camera opens using device camera (mobile or webcam)
3. Barcode is detected and read
4. Product info fetched from Open Food Facts API (free, no API key required)
5. Nutrition data displayed and can be added to meal

### Technology Stack
- **react-barcode-scanner** - Camera-based barcode detection
- **Open Food Facts API** - Free product database with nutrition data
  - Endpoint: `https://world.openfoodfacts.org/api/v2/product/{barcode}`
  - No authentication required for read access

### Scanner UI
```text
+----------------------------------+
|  [Camera Preview Window]         |
|                                  |
|      Point camera at barcode     |
|                                  |
+----------------------------------+
|  Or enter barcode manually:      |
|  [_______________] [Look Up]     |
+----------------------------------+

After scan:
+----------------------------------+
|  PRODUCT FOUND                   |
|  Cheerios (General Mills)        |
|  Serving: 1 cup (39g)           |
|  --------------------------------|
|  140 cal | 3g P | 29g C | 2g F  |
|  --------------------------------|
|  [Add to My Meal] [Scan Another] |
+----------------------------------+
```

### Error Handling
- Product not found: Allow manual entry
- Camera not available: Show manual barcode input field
- API offline: Show error with retry option

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/nutrition/MealBuilder.tsx` | Custom meal builder with add/remove foods |
| `src/components/nutrition/BarcodeScanner.tsx` | Camera scanner + Open Food Facts integration |
| `src/components/nutrition/UnitConverter.tsx` | Unit selection dropdown component |
| `src/components/nutrition/ScannedFoodCard.tsx` | Display card for scanned products |
| `src/stores/mealBuilderStore.ts` | Zustand store for custom meals |
| `src/lib/openFoodFacts.ts` | API client for Open Food Facts |
| `src/lib/unitConversions.ts` | Unit conversion utilities |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/nutrition/FoodCard.tsx` | Add unit selector, adjustable serving input |
| `src/components/nutrition/FoodDatabase.tsx` | Add unit toggle, integrate meal builder |
| `src/components/nutrition/NutritionResults.tsx` | Add "Build Meal" tab, integrate scanner |
| `src/types/nutrition.ts` | Add types for units, scanned products, custom meals |
| `package.json` | Add react-barcode-scanner dependency |

---

## Technical Details

### Unit Conversion System
- Foods will store a base unit (grams) and available alternative units
- Conversion factors defined per food category (liquids vs solids vs pieces)
- User preference for default unit system stored in nutrition store

### Meal Builder Store Structure
```text
mealBuilderStore:
  - currentMeal: { foods: [...], totals: {...} }
  - savedMeals: [{ name, foods, totals, createdAt }]
  - addFood(food, servings)
  - removeFood(foodId)
  - updateServings(foodId, servings)
  - saveMeal(name)
  - loadMeal(mealId)
  - clearCurrentMeal()
```

### Open Food Facts API Response Handling
The API returns detailed product data. We'll extract:
- Product name
- Serving size
- Calories (energy-kcal_100g)
- Protein (proteins_100g)
- Carbs (carbohydrates_100g)
- Fat (fat_100g)
- Fiber (fiber_100g)

---

## Implementation Order

1. **Phase 1: Unit Conversions** (Foundation)
   - Create unit conversion utilities
   - Update FoodCard with unit selector
   - Add global unit preference toggle

2. **Phase 2: Meal Builder** (Core Feature)
   - Create mealBuilderStore
   - Build MealBuilder component
   - Integrate with NutritionResults page
   - Add save/load functionality

3. **Phase 3: Barcode Scanner** (Advanced Feature)
   - Install barcode scanner library
   - Create Open Food Facts API client
   - Build scanner component with camera
   - Add manual barcode entry fallback
   - Integrate scanned foods with meal builder

---

## Mobile Optimization

Following the existing mobile UX guidelines:
- Large touch targets for unit selectors (48px minimum)
- Full-width buttons on mobile for scanner
- Compact food cards in meal builder
- Bottom sheet for scanner on mobile devices
- Clear visual feedback when foods are added

