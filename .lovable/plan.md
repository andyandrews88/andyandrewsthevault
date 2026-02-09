

# Category Renaming, Page Descriptions, and MyFitnessPal-Style Nutrition UI

## Overview

This plan covers three changes:
1. **Rename categories** from Physics/Physiology/Process to Training/Nutrition/Lifestyle
2. **Add page descriptions** - Brief explanatory headers for each major page/section
3. **MyFitnessPal-style nutrition entry** - Redesign the meal logging UI to match the familiar MFP diary layout

---

## Part 1: Category Renaming

### Current vs New Categories

| Current | New | Description |
|---------|-----|-------------|
| Physics | Training | Movement patterns, technique, strength work |
| Physiology | Nutrition | Fuel systems, recovery protocols, eating strategies |
| Process | Lifestyle | Programming, sleep, stress management, habits |

### Files to Update

**src/types/resources.ts**
- Change `ResourceCategory` type from `'physics' | 'physiology' | 'process'` to `'training' | 'nutrition' | 'lifestyle'`
- Update `categoryLabels` mapping
- Update `categoryDescriptions` mapping

**src/data/resources.ts**
- Update all resource entries to use new category values
- Update comments (e.g., "// TRAINING - Movement Blueprints")

**src/components/vault/CategoryFilter.tsx**
- Update the categories array from `['all', 'physics', 'physiology', 'process']` to `['all', 'training', 'nutrition', 'lifestyle']`

**Database consideration**: If resources are stored in the database with the old category values, a migration may be needed. I'll check the database schema and update accordingly.

---

## Part 2: Page Descriptions

### Pages Needing Descriptions

Each major page or section will get a brief header explaining its purpose. These descriptions help new users understand what they can do on each page.

| Page/Section | Badge | Headline | Description |
|--------------|-------|----------|-------------|
| **Audit** (AuditForm) | STRUCTURAL AUDIT | Performance Assessment | Answer questions about your biometrics, strength, endurance, and lifestyle to identify performance gaps and get personalized recommendations. |
| **Results** | ANALYSIS COMPLETE | (Already has) | Already has good context |
| **Nutrition Calculator** | THE FUEL SYSTEM | (Already has) | Already has description |
| **Vault - Library** | KNOWLEDGE BANK | Training & Education Resources | Access curated videos, articles, and guides covering training techniques, nutrition strategies, and lifestyle optimization. |
| **Vault - Progress** | PROGRESS TRACKER | Body Composition & Metrics | Track your bodyweight, measurements, and body composition over time. See trends and monitor your transformation. |
| **Vault - Nutrition** | THE FUEL SYSTEM | (Already has) | Already has description |
| **Vault - Podcast** | Already has | Already has | Check if needs update |
| **Vault - Community** | Already has | Already has | Check if needs update |
| **Vault - Tracks** | No header | Training Programs | Choose your path: Foundation for building fundamentals or Performance for advanced optimization. |

### Implementation

Add a consistent header pattern at the top of each page/section:

```text
+------------------------------------------+
|            [BADGE: SECTION NAME]         |
|                                          |
|              Headline Text               |
|        Supporting description text       |
+------------------------------------------+
```

Files to modify:
- `src/components/audit/AuditForm.tsx` - Add header above progress bar
- `src/components/vault/LibraryTab.tsx` - Add description to CardHeader
- `src/components/progress/ProgressTab.tsx` - Add header section
- `src/pages/Vault.tsx` - Update Tracks section with header

---

## Part 3: MyFitnessPal-Style Nutrition Entry UI

### Current State

The current MealBuilder has:
- A single "Build Your Meal" card
- Totals bar at top
- List of added foods
- Search dialog to add foods
- Barcode scanner

### MyFitnessPal UI Pattern

MFP organizes the diary by meal slots:
- **Breakfast** - with its own calorie subtotal
- **Lunch** - with its own calorie subtotal  
- **Dinner** - with its own calorie subtotal
- **Snacks** - with its own calorie subtotal
- Daily totals at top/bottom

Each meal has:
- Quick "Add Food" button
- List of logged items with compact display (name, amount, calories)
- Per-meal macro summary

### New UI Design

```text
+------------------------------------------+
|  Daily Summary Bar (sticky on scroll)    |
|  [1,847 / 2,400 cal]  P: 142g  C: 185g  F: 68g |
|  ████████████░░░░░░░░ 77% of goal        |
+------------------------------------------+

+------------------------------------------+
| BREAKFAST                        245 cal |
+------------------------------------------+
| 🥚 Eggs, scrambled (2 large)    140 cal  |
| 🍞 Whole wheat toast (1 slice)  105 cal  |
|                                          |
| [+ Add Food]                             |
+------------------------------------------+

+------------------------------------------+
| LUNCH                            520 cal |
+------------------------------------------+
| 🥗 Grilled chicken salad (1)    380 cal  |
| 🍎 Apple, medium                 95 cal  |
| 🥤 Water                          0 cal  |
|                                          |
| [+ Add Food]                             |
+------------------------------------------+

+------------------------------------------+
| DINNER                           712 cal |
+------------------------------------------+
| (No foods logged yet)                    |
|                                          |
| [+ Add Food]                             |
+------------------------------------------+

+------------------------------------------+
| SNACKS                           370 cal |
+------------------------------------------+
| 🥜 Almonds (1 oz)               165 cal  |
| 🍌 Banana, medium               105 cal  |
| 🧀 Greek yogurt (6 oz)          100 cal  |
|                                          |
| [+ Add Food]                             |
+------------------------------------------+
```

### Key Features

1. **Daily Progress Bar** - Visual indicator of calories consumed vs target
2. **Meal Sections** - Four collapsible sections (Breakfast, Lunch, Dinner, Snacks)
3. **Compact Food Items** - One line per food with name, quantity, and calories
4. **Per-Meal Totals** - Each meal shows its calorie subtotal
5. **Quick Add** - Prominent add button for each meal
6. **Swipe to Delete** - On mobile, swipe food items to remove
7. **Tap to Edit** - Tap a food item to adjust quantity

### State Management Updates

Update `mealBuilderStore.ts` to support:
- Meal slots: `breakfast`, `lunch`, `dinner`, `snacks`
- Per-slot food lists
- Move foods between meals
- Date-based logging (for history)

### New Components

| Component | Purpose |
|-----------|---------|
| `FoodDiary.tsx` | Main diary view with all meal sections |
| `MealSection.tsx` | Individual meal slot with food list |
| `FoodDiaryItem.tsx` | Compact single-line food display |
| `DailySummaryBar.tsx` | Sticky calorie/macro progress bar |

### Files to Modify

- `src/stores/mealBuilderStore.ts` - Add meal slot support
- `src/components/nutrition/NutritionResults.tsx` - Replace MealBuilder with FoodDiary
- Create new components in `src/components/nutrition/`

---

## Implementation Order

### Phase 1: Category Renaming
1. Update `src/types/resources.ts`
2. Update `src/data/resources.ts`
3. Update `src/components/vault/CategoryFilter.tsx`
4. Check and update database if needed

### Phase 2: Page Descriptions
1. Add header to AuditForm
2. Update LibraryTab description
3. Add header to ProgressTab
4. Update Tracks section in Vault

### Phase 3: MyFitnessPal UI
1. Update mealBuilderStore with meal slots
2. Create DailySummaryBar component
3. Create MealSection component
4. Create FoodDiaryItem component
5. Create FoodDiary parent component
6. Integrate into NutritionResults

---

## Technical Notes

### Category Migration

If the database has resources with old category values, I'll create a migration:

```sql
UPDATE vault_resources 
SET category = CASE 
  WHEN category = 'physics' THEN 'training'
  WHEN category = 'physiology' THEN 'nutrition'
  WHEN category = 'process' THEN 'lifestyle'
  ELSE category
END;
```

### Meal Slot Structure

```typescript
type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

interface DailyLog {
  date: string;
  meals: Record<MealSlot, MealFood[]>;
}
```

### Mobile Optimization

The MyFitnessPal UI is inherently mobile-friendly:
- Full-width meal sections
- Large touch targets for add buttons
- Swipe gestures for quick actions
- Compact food items fit more on screen

