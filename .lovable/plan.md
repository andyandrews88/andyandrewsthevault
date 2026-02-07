

# Comprehensive Nutrition Calculator - "The Fuel System"

## Overview

Build an engineering-grade nutrition calculator that integrates seamlessly into The Vault ecosystem. This will be the most comprehensive macro calculator available, combining scientific formulas, personalized recommendations, meal planning, and a curated food database - all presented in the Industrial-Elite aesthetic.

---

## Calculator Architecture

### Core Calculations

The calculator will implement multiple BMR formulas and let users compare results:

| Formula | Use Case |
|---------|----------|
| Mifflin-St Jeor | Most accurate for general population (default) |
| Harris-Benedict (Revised) | Classic formula, good baseline |
| Katch-McArdle | Best when body fat % is known |
| Cunningham | Athletes with known lean body mass |

**Activity Multipliers:**

```text
Sedentary (desk job, little exercise)      = BMR x 1.2
Lightly Active (1-3 days/week)             = BMR x 1.375
Moderately Active (3-5 days/week)          = BMR x 1.55
Very Active (6-7 days/week)                = BMR x 1.725
Extremely Active (2x/day, physical job)    = BMR x 1.9
```

**Goal Modifiers:**

```text
Aggressive Cut    = TDEE - 750 (1.5 lb/week loss)
Moderate Cut      = TDEE - 500 (1 lb/week loss)
Conservative Cut  = TDEE - 250 (0.5 lb/week loss)
Maintenance       = TDEE
Lean Bulk         = TDEE + 250
Standard Bulk     = TDEE + 500
Aggressive Bulk   = TDEE + 750
```

---

## Data Input Flow (Multi-Step Form)

### Step 1: Biometrics
- Weight (lbs/kg toggle)
- Height (inches/cm toggle)
- Age
- Biological Sex (affects formula)
- Body Fat % (optional - enables Katch-McArdle)

### Step 2: Activity Assessment
- Base Activity Level (sedentary to extremely active)
- Training Days per Week
- Training Style (strength, cardio, hybrid, CrossFit)
- Job Activity Level (seated, standing, physical labor)

### Step 3: Goals
- Primary Goal (fat loss, maintenance, muscle gain, recomposition, performance)
- Rate of Change (aggressive, moderate, conservative)
- Timeline Preference (optional)

### Step 4: Dietary Preferences
- Diet Type (standard, keto, low-carb, high-carb, zone, custom)
- Protein Priority (minimum, moderate, high, maximum)
- Food Restrictions (vegetarian, vegan, dairy-free, gluten-free)
- Meal Frequency (2-6 meals per day)

---

## Results Dashboard

### Primary Output Display

```text
+--------------------------------------------------+
|  DAILY FUEL TARGETS                              |
|                                                  |
|  Calories: 2,847                                 |
|  ----------------------------------------        |
|  Protein:   214g (30%)   |   856 kcal           |
|  Carbs:     320g (45%)   | 1,280 kcal           |
|  Fats:       79g (25%)   |   711 kcal           |
+--------------------------------------------------+
```

### Advanced Metrics Displayed

| Metric | Description |
|--------|-------------|
| BMR | Basal Metabolic Rate |
| TDEE | Total Daily Energy Expenditure |
| Target Calories | TDEE adjusted for goal |
| Protein (g/lb) | Grams per pound of bodyweight |
| Lean Mass Protein | Grams per pound of lean mass |
| Fiber Target | Minimum daily fiber recommendation |
| Water Intake | Hydration recommendation |
| Meal Breakdown | Calories/macros per meal |

### Visualization Components
- Macro pie chart (protein/carbs/fats breakdown)
- Weekly calorie trend visualization
- Comparison view (show all formula results)

---

## Protein Source Database

### Curated Food Database (50+ items)

**Lean Proteins:**

| Food | Serving | Protein | Calories | Notes |
|------|---------|---------|----------|-------|
| Chicken Breast | 4 oz | 26g | 120 | Go-to lean protein |
| Ground Turkey 93/7 | 4 oz | 22g | 150 | Versatile option |
| Egg Whites | 4 large | 14g | 68 | Pure protein |
| Tilapia | 4 oz | 23g | 110 | Budget-friendly fish |
| Shrimp | 4 oz | 24g | 112 | Quick-cooking |

**Whole Proteins:**

| Food | Serving | Protein | Calories | Notes |
|------|---------|---------|----------|-------|
| Whole Eggs | 3 large | 18g | 210 | Complete amino profile |
| Salmon | 4 oz | 25g | 200 | Omega-3 rich |
| Ribeye Steak | 4 oz | 23g | 290 | High satiety |
| Ground Beef 80/20 | 4 oz | 20g | 280 | Flavor and fat |

**Dairy/Vegetarian:**

| Food | Serving | Protein | Calories | Notes |
|------|---------|---------|----------|-------|
| Greek Yogurt 0% | 1 cup | 23g | 130 | Probiotic benefits |
| Cottage Cheese 2% | 1 cup | 25g | 180 | Casein-rich |
| Whey Protein | 1 scoop | 25g | 120 | Fast absorption |
| Casein Protein | 1 scoop | 24g | 120 | Slow release |
| Tofu (firm) | 4 oz | 10g | 90 | Plant-based complete |
| Tempeh | 4 oz | 20g | 190 | Fermented soy |

**Carbohydrate Sources:**

| Food | Serving | Carbs | Fiber | Calories |
|------|---------|-------|-------|----------|
| White Rice | 1 cup cooked | 45g | 0.6g | 205 |
| Brown Rice | 1 cup cooked | 45g | 3.5g | 215 |
| Oats | 1 cup cooked | 27g | 4g | 160 |
| Sweet Potato | 1 medium | 26g | 4g | 115 |
| Banana | 1 medium | 27g | 3g | 105 |

**Healthy Fats:**

| Food | Serving | Fat | Calories | Notes |
|------|---------|-----|----------|-------|
| Avocado | 1/2 medium | 15g | 160 | Monounsaturated |
| Olive Oil | 1 tbsp | 14g | 120 | EVOO preferred |
| Almonds | 1 oz (23) | 14g | 160 | Vitamin E source |
| Peanut Butter | 2 tbsp | 16g | 190 | Natural only |

---

## Meal Plan Generator

### Sample Day Builder

Based on calculated macros and meal frequency, generate a template day:

```text
SAMPLE DAY - 2,847 Calories | 214g P | 320g C | 79g F

MEAL 1 - Breakfast (712 cal)
- 4 whole eggs (280 cal, 24g P, 2g C, 20g F)
- 1 cup oatmeal cooked (160 cal, 5g P, 27g C, 3g F)
- 1 banana (105 cal, 1g P, 27g C, 0g F)
- 1 tbsp peanut butter (95 cal, 4g P, 3g C, 8g F)

MEAL 2 - Lunch (712 cal)
- 6 oz chicken breast (180 cal, 39g P, 0g C, 2g F)
- 1.5 cups white rice (308 cal, 7g P, 68g C, 1g F)
- 1 cup broccoli (55 cal, 4g P, 10g C, 0g F)
- 1/2 avocado (160 cal, 2g P, 9g C, 15g F)

MEAL 3 - Pre-Workout (475 cal)
- 1.5 scoops whey protein (180 cal, 38g P, 3g C, 2g F)
- 1 cup rice cakes (295 cal, 5g P, 65g C, 1g F)

MEAL 4 - Post-Workout/Dinner (712 cal)
- 6 oz salmon (300 cal, 38g P, 0g C, 16g F)
- 1 large sweet potato (180 cal, 4g P, 41g C, 0g F)
- 2 cups mixed vegetables (100 cal, 5g P, 20g C, 0g F)
- 1 tbsp olive oil (120 cal, 0g P, 0g C, 14g F)

MEAL 5 - Pre-Bed (236 cal)
- 1 cup cottage cheese 2% (180 cal, 25g P, 8g C, 5g F)
- 10 almonds (56 cal, 2g P, 2g C, 5g F)
```

### Recipe Recommendations

Link to curated high-protein recipes organized by:
- Meal type (breakfast, lunch, dinner, snacks)
- Prep time (under 15 min, 15-30 min, 30+ min)
- Protein content per serving
- Diet compatibility (keto, vegetarian, etc.)

---

## Integration Points

### Audit Integration
- Use weight from audit data if available
- Pre-fill biometrics from existing audit results
- Protein intake question in audit links to calculator

### Vault Integration
- New "Nutrition" tab alongside Library, Podcast, Community, Tracks
- Food database searchable in Vault
- Premium recipes and meal plans for members

### Results Page Integration
- If "protein: unsure" in audit, recommend the calculator
- Link from Systemic Recovery leak to nutrition resources

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/types/nutrition.ts` | Type definitions for nutrition data, foods, meals |
| `src/data/foodDatabase.ts` | Curated food database with macros |
| `src/data/recipes.ts` | Sample recipe data |
| `src/stores/nutritionStore.ts` | Zustand store for calculator state |
| `src/components/nutrition/NutritionCalculator.tsx` | Main calculator component (multi-step form) |
| `src/components/nutrition/NutritionResults.tsx` | Results display with charts |
| `src/components/nutrition/MacroChart.tsx` | Pie chart for macro breakdown |
| `src/components/nutrition/FoodDatabase.tsx` | Searchable food list |
| `src/components/nutrition/MealPlanGenerator.tsx` | Sample day builder |
| `src/components/nutrition/FoodCard.tsx` | Individual food item display |
| `src/pages/Nutrition.tsx` | Standalone nutrition calculator page |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add /nutrition route |
| `src/pages/Vault.tsx` | Add Nutrition tab to TabsList |
| `src/components/layout/Navbar.tsx` | Add Nutrition link to nav |

---

## UI/UX Design

### Visual Style
- Maintain Industrial-Elite dark mode aesthetic
- Use monospace fonts for all numerical data
- Primary cyan for protein, success green for carbs, accent gold for fats
- Card-based layout matching existing Vault components

### Form Experience
- Multi-step wizard similar to Audit form
- Progress indicator at top
- Real-time calculation preview as user inputs data
- Unit toggles (metric/imperial) persist across session

### Results Display
- Large, prominent macro display with percentages
- Interactive pie chart with hover states
- Collapsible sections for advanced metrics
- Export/print functionality placeholder

### Mobile Optimization
- Responsive grid layouts
- Touch-friendly sliders for activity level
- Stacked card layout on small screens

---

## Calculator Formulas Reference

### Mifflin-St Jeor (Default)
```text
Men:    BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age) + 5
Women:  BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age) - 161
```

### Katch-McArdle (Requires Body Fat %)
```text
BMR = 370 + (21.6 x Lean Body Mass in kg)
LBM = Weight x (1 - Body Fat %)
```

### Protein Recommendations by Goal
```text
Fat Loss:           1.0 - 1.2g per lb bodyweight
Maintenance:        0.8 - 1.0g per lb bodyweight
Muscle Gain:        1.0 - 1.2g per lb bodyweight
High Protein Focus: 1.2 - 1.5g per lb bodyweight
```

### Macro Splits by Diet Type
```text
Standard:    30% P / 40% C / 30% F
High Carb:   25% P / 50% C / 25% F
Low Carb:    35% P / 25% C / 40% F
Keto:        30% P / 5% C  / 65% F
Zone:        30% P / 40% C / 30% F
```

---

## Implementation Order

1. Create type definitions and Zustand store
2. Build food database with macro data
3. Create multi-step calculator form
4. Implement BMR/TDEE calculation logic
5. Build results display with charts
6. Add food database search component
7. Create meal plan generator
8. Add /nutrition route and navigation
9. Integrate Nutrition tab into Vault
10. Connect audit store for pre-filled data

