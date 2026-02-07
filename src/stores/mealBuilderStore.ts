import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FoodItem } from '@/types/nutrition';
import { ScannedProduct } from '@/lib/openFoodFacts';
import { MeasurementUnit, calculateMacros } from '@/lib/unitConversions';

// ============= Types =============

export interface MealFood {
  id: string;
  food: FoodItem | ScannedProduct;
  amount: number;
  unit: MeasurementUnit;
  calculatedMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface SavedMeal {
  id: string;
  name: string;
  foods: MealFood[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  createdAt: string;
}

interface MealBuilderState {
  // Current meal being built
  currentMeal: MealFood[];
  
  // Saved meals for quick access
  savedMeals: SavedMeal[];
  
  // Preferred unit system
  preferredUnit: 'metric' | 'imperial';
  
  // Actions
  addFood: (food: FoodItem | ScannedProduct, amount?: number, unit?: MeasurementUnit) => void;
  removeFood: (foodId: string) => void;
  updateFoodAmount: (foodId: string, amount: number, unit: MeasurementUnit) => void;
  clearCurrentMeal: () => void;
  saveMeal: (name: string) => void;
  loadMeal: (mealId: string) => void;
  deleteSavedMeal: (mealId: string) => void;
  setPreferredUnit: (unit: 'metric' | 'imperial') => void;
  
  // Computed
  getCurrentTotals: () => { calories: number; protein: number; carbs: number; fats: number };
}

// Helper to check if it's a FoodItem or ScannedProduct
function isFoodItem(food: FoodItem | ScannedProduct): food is FoodItem {
  return 'category' in food;
}

// Helper to get unique ID for a food
function getFoodId(food: FoodItem | ScannedProduct): string {
  if (isFoodItem(food)) {
    return food.id;
  }
  return food.barcode;
}

// ============= Store =============

export const useMealBuilderStore = create<MealBuilderState>()(
  persist(
    (set, get) => ({
      currentMeal: [],
      savedMeals: [],
      preferredUnit: 'imperial',

      addFood: (food, amount = 1, unit = 'piece') => {
        const servingGrams = food.servingGrams;
        const macros = calculateMacros(
          food.calories,
          food.protein,
          food.carbs,
          food.fats,
          servingGrams,
          amount,
          unit
        );

        const mealFood: MealFood = {
          id: `${getFoodId(food)}-${Date.now()}`,
          food,
          amount,
          unit,
          calculatedMacros: macros,
        };

        set((state) => ({
          currentMeal: [...state.currentMeal, mealFood],
        }));
      },

      removeFood: (foodId) => {
        set((state) => ({
          currentMeal: state.currentMeal.filter((f) => f.id !== foodId),
        }));
      },

      updateFoodAmount: (foodId, amount, unit) => {
        set((state) => ({
          currentMeal: state.currentMeal.map((mealFood) => {
            if (mealFood.id !== foodId) return mealFood;

            const macros = calculateMacros(
              mealFood.food.calories,
              mealFood.food.protein,
              mealFood.food.carbs,
              mealFood.food.fats,
              mealFood.food.servingGrams,
              amount,
              unit
            );

            return {
              ...mealFood,
              amount,
              unit,
              calculatedMacros: macros,
            };
          }),
        }));
      },

      clearCurrentMeal: () => {
        set({ currentMeal: [] });
      },

      saveMeal: (name) => {
        const { currentMeal } = get();
        if (currentMeal.length === 0) return;

        const totals = get().getCurrentTotals();
        
        const savedMeal: SavedMeal = {
          id: `meal-${Date.now()}`,
          name,
          foods: [...currentMeal],
          totals,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          savedMeals: [savedMeal, ...state.savedMeals],
        }));
      },

      loadMeal: (mealId) => {
        const { savedMeals } = get();
        const meal = savedMeals.find((m) => m.id === mealId);
        
        if (meal) {
          // Re-generate IDs to avoid conflicts
          const loadedFoods = meal.foods.map((f) => ({
            ...f,
            id: `${getFoodId(f.food)}-${Date.now()}-${Math.random()}`,
          }));
          
          set({ currentMeal: loadedFoods });
        }
      },

      deleteSavedMeal: (mealId) => {
        set((state) => ({
          savedMeals: state.savedMeals.filter((m) => m.id !== mealId),
        }));
      },

      setPreferredUnit: (unit) => {
        set({ preferredUnit: unit });
      },

      getCurrentTotals: () => {
        const { currentMeal } = get();
        
        return currentMeal.reduce(
          (acc, food) => ({
            calories: acc.calories + food.calculatedMacros.calories,
            protein: acc.protein + food.calculatedMacros.protein,
            carbs: acc.carbs + food.calculatedMacros.carbs,
            fats: acc.fats + food.calculatedMacros.fats,
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );
      },
    }),
    {
      name: 'meal-builder-store',
      partialize: (state) => ({
        savedMeals: state.savedMeals,
        preferredUnit: state.preferredUnit,
      }),
    }
  )
);
