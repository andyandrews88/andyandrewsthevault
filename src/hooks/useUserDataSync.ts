import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useMealBuilderStore } from '@/stores/mealBuilderStore';
import { useAuditStore } from '@/stores/auditStore';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export function useUserDataSync() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const nutritionStore = useNutritionStore();
  
  const hasFetchedRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);

  // Fetch user data from database on login
  useEffect(() => {
    if (!isInitialized) return;
    
    const userId = user?.id;
    
    // Reset fetch flag when user changes
    if (prevUserIdRef.current !== userId) {
      hasFetchedRef.current = false;
      prevUserIdRef.current = userId ?? null;
    }
    
    if (!isAuthenticated || !userId || hasFetchedRef.current) return;
    
    async function fetchUserData() {
      if (!userId) return;
      
      // hasFetchedRef set after success below
      
      try {
        // Fetch nutrition data
        const { data: nutritionData } = await supabase
          .from('user_nutrition_data')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (nutritionData) {
          if (nutritionData.biometrics) {
            nutritionStore.updateBiometrics(nutritionData.biometrics as Record<string, unknown>);
          }
          if (nutritionData.activity) {
            nutritionStore.updateActivity(nutritionData.activity as Record<string, unknown>);
          }
          if (nutritionData.goals) {
            nutritionStore.updateGoals(nutritionData.goals as Record<string, unknown>);
          }
          if (nutritionData.dietary) {
            nutritionStore.updateDietary(nutritionData.dietary as Record<string, unknown>);
          }
        }

        // Fetch saved meals
        const { data: mealsData } = await supabase
          .from('user_meals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (mealsData && mealsData.length > 0) {
          // Hydrate saved meals into store
          const savedMeals = mealsData.map(meal => ({
            id: meal.id,
            name: meal.name,
            foods: (meal.foods as unknown[]) || [],
            totals: (meal.totals as Record<string, number>) || { calories: 0, protein: 0, carbs: 0, fats: 0 },
            createdAt: meal.created_at,
          }));
          // Replace local saved meals with database meals
          useMealBuilderStore.setState({ savedMeals: savedMeals as never });
        }

        // Fetch audit data
        const { data: auditData } = await supabase
          .from('user_audit_data')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (auditData?.data) {
          useAuditStore.setState({ 
            data: auditData.data as Record<string, unknown>,
            results: auditData.results as never 
          });
        }
        hasFetchedRef.current = true;
      } catch (error) {
        // hasFetchedRef stays false, will retry on next auth change
        console.error('Error fetching user data:', error);
      }
    }

    fetchUserData();
  }, [isAuthenticated, user?.id, isInitialized, nutritionStore]);

  // Save nutrition data to database (debounced)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const userId = user.id;

    const saveNutritionData = debounce(async () => {
      const state = useNutritionStore.getState();
      
      try {
        // Check if record exists
        const { data: existing } = await supabase
          .from('user_nutrition_data')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('user_nutrition_data')
            .update({
              biometrics: state.biometrics as unknown as Json,
              activity: state.activity as unknown as Json,
              goals: state.goals as unknown as Json,
              dietary: state.dietary as unknown as Json,
              results: state.results as unknown as Json,
            })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('user_nutrition_data')
            .insert({
              user_id: userId,
              biometrics: state.biometrics as unknown as Json,
              activity: state.activity as unknown as Json,
              goals: state.goals as unknown as Json,
              dietary: state.dietary as unknown as Json,
              results: state.results as unknown as Json,
            });
        }
      } catch (error) {
        console.error('Error saving nutrition data:', error);
      }
    }, 2000);

    // Subscribe to nutrition store changes
    const unsubscribe = useNutritionStore.subscribe(saveNutritionData);
    
    return () => unsubscribe();
  }, [isAuthenticated, user?.id]);

  // Note: Meal diary entries are now auto-saved directly via the mealBuilderStore
  // The old debounced savedMeals sync has been removed

  // Save audit data to database (debounced)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const userId = user.id;

    const saveAuditData = debounce(async () => {
      const state = useAuditStore.getState();
      
      if (Object.keys(state.data).length === 0) return;
      
      try {
        // Check if record exists
        const { data: existing } = await supabase
          .from('user_audit_data')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('user_audit_data')
            .update({
              data: state.data as unknown as Json,
              results: state.results as unknown as Json,
            })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('user_audit_data')
            .insert({
              user_id: userId,
              data: state.data as unknown as Json,
              results: state.results as unknown as Json,
            });
        }
      } catch (error) {
        console.error('Error saving audit data:', error);
      }
    }, 2000);

    const unsubscribe = useAuditStore.subscribe(saveAuditData);
    
    return () => unsubscribe();
  }, [isAuthenticated, user?.id]);
}
