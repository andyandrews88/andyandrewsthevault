import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FoodItem } from '@/types/nutrition';
import { ScannedProduct } from '@/lib/openFoodFacts';
import { MeasurementUnit, calculateMacros } from '@/lib/unitConversions';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { format } from 'date-fns';

// ============= Types =============

export type MealSlotType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface MealFood {
  id: string;
  food: FoodItem | ScannedProduct;
  amount: number;
  unit: MeasurementUnit;
  mealSlot: MealSlotType;
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
  // Date-keyed diary entries (dateStr -> entries)
  diaryEntries: Record<string, MealFood[]>;

  // Selected date
  selectedDate: Date;

  // Saved meals (templates)
  savedMeals: SavedMeal[];

  // Preferred unit system
  preferredUnit: 'metric' | 'imperial';

  // Loading state
  isLoading: boolean;

  // Actions
  fetchDiaryForDate: (date: Date) => Promise<void>;
  addDiaryEntry: (food: FoodItem | ScannedProduct, mealSlot: MealSlotType, amount?: number, unit?: MeasurementUnit) => Promise<void>;
  removeDiaryEntry: (entryId: string) => Promise<void>;
  updateDiaryEntry: (entryId: string, amount: number, unit: MeasurementUnit) => Promise<void>;
  clearDiaryForDate: (date: Date) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setPreferredUnit: (unit: 'metric' | 'imperial') => void;

  // Saved meal templates
  saveMealTemplate: (name: string, foods: MealFood[]) => void;
  deleteSavedMeal: (mealId: string) => void;

  // Computed
  getEntriesForDate: (date: Date) => MealFood[];
  getTotalsForDate: (date: Date) => { calories: number; protein: number; carbs: number; fats: number };
}

// Helper to get date string
function dateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Helper to check if it's a FoodItem or ScannedProduct
function isFoodItem(food: FoodItem | ScannedProduct): food is FoodItem {
  return 'category' in food;
}

function getFoodId(food: FoodItem | ScannedProduct): string {
  if (isFoodItem(food)) return food.id;
  return food.barcode;
}

// ============= Store =============

export const useMealBuilderStore = create<MealBuilderState>()(
  persist(
    (set, get) => ({
      diaryEntries: {},
      savedMeals: [],
      selectedDate: new Date(),
      preferredUnit: 'imperial',
      isLoading: false,

      fetchDiaryForDate: async (date) => {
        const ds = dateStr(date);
        set({ isLoading: true });

        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.user) {
            set({ isLoading: false });
            return;
          }

          const { data, error } = await supabase
            .from('user_food_diary')
            .select('*')
            .eq('user_id', session.session.user.id)
            .eq('entry_date', ds)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('Error fetching diary:', error);
            set({ isLoading: false });
            return;
          }

          const entries: MealFood[] = (data || []).map((row) => ({
            id: row.id,
            food: row.food_data as unknown as FoodItem | ScannedProduct,
            amount: Number(row.amount),
            unit: row.unit as MeasurementUnit,
            mealSlot: row.meal_slot as MealSlotType,
            calculatedMacros: row.calculated_macros as unknown as { calories: number; protein: number; carbs: number; fats: number },
          }));

          set((state) => ({
            diaryEntries: { ...state.diaryEntries, [ds]: entries },
            isLoading: false,
          }));
        } catch (err) {
          console.error('Error fetching diary:', err);
          set({ isLoading: false });
        }
      },

      addDiaryEntry: async (food, mealSlot, amount = 1, unit = 'piece') => {
        const { selectedDate } = get();
        const ds = dateStr(selectedDate);
        const servingGrams = food.servingGrams;
        const macros = calculateMacros(
          food.calories, food.protein, food.carbs, food.fats,
          servingGrams, amount, unit
        );

        const tempId = `${getFoodId(food)}-${Date.now()}`;
        const entry: MealFood = {
          id: tempId,
          food,
          amount,
          unit,
          mealSlot,
          calculatedMacros: macros,
        };

        // Optimistic update
        set((state) => ({
          diaryEntries: {
            ...state.diaryEntries,
            [ds]: [...(state.diaryEntries[ds] || []), entry],
          },
        }));

        // Persist to DB
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.user) return;

          const { data, error } = await supabase
            .from('user_food_diary')
            .insert({
              user_id: session.session.user.id,
              entry_date: ds,
              meal_slot: mealSlot,
              food_data: food as unknown as Json,
              amount,
              unit,
              calculated_macros: macros as unknown as Json,
            })
            .select('id')
            .single();

          if (error) {
            console.error('Error saving diary entry:', error);
            // Rollback
            set((state) => ({
              diaryEntries: {
                ...state.diaryEntries,
                [ds]: (state.diaryEntries[ds] || []).filter((e) => e.id !== tempId),
              },
            }));
            return;
          }

          // Replace temp ID with real DB ID
          if (data) {
            set((state) => ({
              diaryEntries: {
                ...state.diaryEntries,
                [ds]: (state.diaryEntries[ds] || []).map((e) =>
                  e.id === tempId ? { ...e, id: data.id } : e
                ),
              },
            }));
          }
        } catch (err) {
          console.error('Error saving diary entry:', err);
        }
      },

      removeDiaryEntry: async (entryId) => {
        const { selectedDate, diaryEntries } = get();
        const ds = dateStr(selectedDate);
        const prev = diaryEntries[ds] || [];

        // Optimistic
        set((state) => ({
          diaryEntries: {
            ...state.diaryEntries,
            [ds]: (state.diaryEntries[ds] || []).filter((e) => e.id !== entryId),
          },
        }));

        try {
          const { error } = await supabase
            .from('user_food_diary')
            .delete()
            .eq('id', entryId);

          if (error) {
            console.error('Error deleting diary entry:', error);
            set((state) => ({ diaryEntries: { ...state.diaryEntries, [ds]: prev } }));
          }
        } catch (err) {
          console.error('Error deleting diary entry:', err);
        }
      },

      updateDiaryEntry: async (entryId, amount, unit) => {
        const { selectedDate, diaryEntries } = get();
        const ds = dateStr(selectedDate);
        const prev = diaryEntries[ds] || [];
        const existing = prev.find((e) => e.id === entryId);
        if (!existing) return;

        const macros = calculateMacros(
          existing.food.calories, existing.food.protein, existing.food.carbs, existing.food.fats,
          existing.food.servingGrams, amount, unit
        );

        // Optimistic
        set((state) => ({
          diaryEntries: {
            ...state.diaryEntries,
            [ds]: (state.diaryEntries[ds] || []).map((e) =>
              e.id === entryId ? { ...e, amount, unit, calculatedMacros: macros } : e
            ),
          },
        }));

        try {
          const { error } = await supabase
            .from('user_food_diary')
            .update({ amount, unit, calculated_macros: macros as unknown as Json })
            .eq('id', entryId);

          if (error) {
            console.error('Error updating diary entry:', error);
            set((state) => ({ diaryEntries: { ...state.diaryEntries, [ds]: prev } }));
          }
        } catch (err) {
          console.error('Error updating diary entry:', err);
        }
      },

      clearDiaryForDate: async (date) => {
        const ds = dateStr(date);
        const prev = get().diaryEntries[ds] || [];

        set((state) => ({
          diaryEntries: { ...state.diaryEntries, [ds]: [] },
        }));

        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.user) return;

          const { error } = await supabase
            .from('user_food_diary')
            .delete()
            .eq('user_id', session.session.user.id)
            .eq('entry_date', ds);

          if (error) {
            console.error('Error clearing diary:', error);
            set((state) => ({ diaryEntries: { ...state.diaryEntries, [ds]: prev } }));
          }
        } catch (err) {
          console.error('Error clearing diary:', err);
        }
      },

      setSelectedDate: (date) => {
        set({ selectedDate: date });
        // Auto-fetch when date changes
        get().fetchDiaryForDate(date);
      },

      setPreferredUnit: (unit) => set({ preferredUnit: unit }),

      saveMealTemplate: (name, foods) => {
        if (foods.length === 0) return;
        const totals = foods.reduce(
          (acc, f) => ({
            calories: acc.calories + f.calculatedMacros.calories,
            protein: acc.protein + f.calculatedMacros.protein,
            carbs: acc.carbs + f.calculatedMacros.carbs,
            fats: acc.fats + f.calculatedMacros.fats,
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        const meal: SavedMeal = {
          id: `meal-${Date.now()}`,
          name,
          foods: [...foods],
          totals,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ savedMeals: [meal, ...state.savedMeals] }));
      },

      deleteSavedMeal: (mealId) => {
        set((state) => ({
          savedMeals: state.savedMeals.filter((m) => m.id !== mealId),
        }));
      },

      getEntriesForDate: (date) => {
        return get().diaryEntries[dateStr(date)] || [];
      },

      getTotalsForDate: (date) => {
        const entries = get().diaryEntries[dateStr(date)] || [];
        return entries.reduce(
          (acc, e) => ({
            calories: acc.calories + e.calculatedMacros.calories,
            protein: acc.protein + e.calculatedMacros.protein,
            carbs: acc.carbs + e.calculatedMacros.carbs,
            fats: acc.fats + e.calculatedMacros.fats,
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
