
# Nutrition Section: Full Audit and SWOT Analysis

## SWOT Analysis

### Strengths
- Scientific calculator engine is solid: Mifflin-St Jeor, Harris-Benedict, Katch-McArdle, Cunningham formulas all correctly implemented
- Macro split logic properly handles keto, balanced, high-carb, and zone diets
- Food database with 50+ items and barcode scanning via OpenFoodFacts API
- Unit conversion system (metric/imperial) with multiple measurement types
- Clean UI components: DailySummaryBar, MacroChart, MealPlanGenerator all well-built
- Database sync for nutrition calculator results and saved meals works correctly

### Weaknesses (Critical Bugs)
1. **Foods land in wrong meal slot**: The `getFoodsForSlot()` function on line 73 of FoodDiary.tsx distributes foods using `index % 4` -- pure math based on array position, completely ignoring which meal slot (breakfast/lunch/dinner/snacks) the user tapped "Add Food" on. The code even has a comment admitting this: *"For now, distribute foods evenly for demo purposes"*
2. **No meal slot property exists**: The `MealFood` type has no `mealSlot` field. Foods are dumped into a flat `currentMeal[]` array with zero slot association
3. **No per-date storage**: `currentMeal` is a single flat array with no date key. Navigating dates does nothing -- you see the same foods regardless of which day you're viewing
4. **Data lost on refresh**: The store's `partialize` config only persists `savedMeals` and `preferredUnit`. The active `currentMeal` array is NOT persisted to localStorage or the database, so any page refresh wipes all logged foods
5. **"Save" button is misleading**: The Save button creates a reusable meal template (like saving a recipe), not "save today's food diary." Users expect it to persist their daily log, but it asks for a meal name because it's building a template library

### Opportunities
- Build a proper date-keyed diary system backed by the database (one record per user per date per meal slot)
- Auto-save food entries to the database as they're added (like the workout logger does)
- Add meal slot metadata so foods stay in breakfast/lunch/dinner/snacks correctly
- Create a `user_food_diary` table for proper per-date persistence instead of relying on client-side state

### Threats
- Users will abandon the nutrition tracker entirely if food keeps appearing in wrong slots and disappearing on refresh
- The current architecture requires a significant rewrite of the data model -- small patches won't fix the fundamental issues
- The `MealBuilder` component (older version) and `FoodDiary` component (newer version) both exist, creating code duplication and confusion

---

## Bug Details

### BUG 1 (Critical) -- Foods appear in wrong meal slot
**File**: `src/components/nutrition/FoodDiary.tsx`, line 73-76
**Root cause**: `getFoodsForSlot` uses `i % 4 === slotIndex` to distribute foods across slots by array index. The `activeMealSlot` state is captured when the user taps "Add Food" but is never attached to the food item.
**Evidence**: The code comment on line 72 says *"In a full implementation, each MealFood would have a mealSlot property"*

### BUG 2 (Critical) -- No per-date food storage
**File**: `src/stores/mealBuilderStore.ts`
**Root cause**: `currentMeal` is a single flat array. `selectedDate` exists as state but nothing filters or keys foods by date. Every date shows the same foods.

### BUG 3 (Critical) -- Food diary lost on refresh
**File**: `src/stores/mealBuilderStore.ts`, line 159-162
**Root cause**: The `partialize` config only saves `savedMeals` and `preferredUnit` to localStorage. `currentMeal` is excluded, so it resets to `[]` on every page load.

### BUG 4 (Major) -- Save button creates templates, not daily logs
**File**: `src/components/nutrition/FoodDiary.tsx`, lines 94-100 and 129-150
**Root cause**: `saveMeal()` in the store creates a named `SavedMeal` template. There is no concept of "save today's diary." The entire persistence model is wrong for a daily food tracker.

---

## Implementation Plan

### Step 1: Create `user_food_diary` database table
A new table to store individual food entries per user, per date, per meal slot:

```text
user_food_diary
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- entry_date (date, NOT NULL)
- meal_slot (text, NOT NULL) -- 'breakfast', 'lunch', 'dinner', 'snacks'
- food_data (jsonb, NOT NULL) -- the FoodItem or ScannedProduct
- amount (numeric, NOT NULL, default 1)
- unit (text, NOT NULL, default 'piece')
- calculated_macros (jsonb, NOT NULL)
- created_at (timestamptz, default now())
```

With RLS policies: users can only CRUD their own entries. Add a unique composite consideration for (user_id, entry_date) queries.

### Step 2: Add `mealSlot` to `MealFood` type
**File**: `src/stores/mealBuilderStore.ts`
- Add `mealSlot: MealSlot` to the `MealFood` interface
- Update `addFood` to accept a `mealSlot` parameter and attach it to the food entry

### Step 3: Rewrite the store for date-keyed, auto-saving diary
**File**: `src/stores/mealBuilderStore.ts`
- Replace `currentMeal: MealFood[]` with `diaryEntries: Record<string, MealFood[]>` keyed by date string
- Add `fetchDiaryForDate(date)` that loads entries from `user_food_diary` table
- Add `addDiaryEntry(food, mealSlot, date)` that immediately inserts into the database
- Add `removeDiaryEntry(entryId)` that immediately deletes from the database
- Add `updateDiaryEntry(entryId, amount, unit)` that immediately updates the database
- Remove the confusing `saveMeal`/`loadMeal` template system from the main diary flow (keep saved meals as a separate feature accessible from a different button)

### Step 4: Fix FoodDiary component
**File**: `src/components/nutrition/FoodDiary.tsx`
- Replace `getFoodsForSlot()` modulo hack with a proper filter: `diaryEntries.filter(f => f.mealSlot === slot)`
- Pass `activeMealSlot` to `handleSelectFood` so the food is tagged to the correct slot
- Remove the "Save" button from the main toolbar (entries auto-save to database)
- Keep "Saved Meals" as a separate quick-add feature (load a template into a specific slot)
- Fetch diary entries when date changes via `fetchDiaryForDate()`

### Step 5: Update data sync hook
**File**: `src/hooks/useUserDataSync.ts`
- Remove the meal sync logic that was syncing the old `savedMeals` array
- The new diary entries will be synced directly via the store's database calls (real-time, not debounced)

### Step 6: Clean up dead code
- Remove or repurpose `MealBuilder.tsx` (the older flat meal builder) since `FoodDiary.tsx` replaces it
- Update `NutritionResults.tsx` tab label from "Build Meal" to "Food Diary"

## Summary of Changes

| File | Changes |
|------|---------|
| Database migration | Create `user_food_diary` table with RLS policies |
| `src/stores/mealBuilderStore.ts` | Add `mealSlot` to MealFood, rewrite for date-keyed DB-backed diary |
| `src/components/nutrition/FoodDiary.tsx` | Fix slot assignment, auto-save entries, fetch by date |
| `src/components/nutrition/MealSection.tsx` | No changes needed (already receives foods per slot) |
| `src/hooks/useUserDataSync.ts` | Remove old meal sync logic |
| `src/components/nutrition/NutritionResults.tsx` | Update tab label |
| `src/components/nutrition/MealBuilder.tsx` | Remove or mark as deprecated |
