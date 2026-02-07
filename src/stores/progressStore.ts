import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { BodyEntry, WearableConnection, WearableDataPoint, BodyEntryFormData, calculateBMI } from '@/types/progress';
import { format } from 'date-fns';

interface ProgressState {
  // Body entries
  bodyEntries: BodyEntry[];
  isLoadingEntries: boolean;
  
  // Wearable connections
  wearableConnections: WearableConnection[];
  isLoadingConnections: boolean;
  
  // Wearable data
  wearableData: WearableDataPoint[];
  isLoadingWearableData: boolean;
  
  // User preferences
  usesImperial: boolean;
  
  // Actions
  fetchBodyEntries: () => Promise<void>;
  addBodyEntry: (data: BodyEntryFormData) => Promise<void>;
  updateBodyEntry: (id: string, data: Partial<BodyEntryFormData>) => Promise<void>;
  deleteBodyEntry: (id: string) => Promise<void>;
  
  fetchWearableConnections: () => Promise<void>;
  fetchWearableData: (startDate?: Date, endDate?: Date) => Promise<void>;
  
  setUsesImperial: (value: boolean) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  bodyEntries: [],
  isLoadingEntries: false,
  wearableConnections: [],
  isLoadingConnections: false,
  wearableData: [],
  isLoadingWearableData: false,
  usesImperial: false,

  fetchBodyEntries: async () => {
    set({ isLoadingEntries: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_body_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      
      set({ bodyEntries: (data || []) as BodyEntry[] });
    } catch (error) {
      console.error('Error fetching body entries:', error);
    } finally {
      set({ isLoadingEntries: false });
    }
  },

  addBodyEntry: async (formData: BodyEntryFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate BMI if we have weight and height
      let bmi: number | null = null;
      if (formData.weight && formData.height) {
        const heightM = formData.height / 100;
        bmi = Math.round((formData.weight / (heightM * heightM)) * 10) / 10;
      }

      const entry = {
        user_id: user.id,
        entry_date: format(formData.entry_date, 'yyyy-MM-dd'),
        weight_kg: formData.weight,
        height_cm: formData.height,
        bmi,
        body_fat_percent: formData.body_fat_percent,
        measurement_source: formData.measurement_source,
        neck_cm: formData.neck,
        shoulders_cm: formData.shoulders,
        chest_cm: formData.chest,
        waist_cm: formData.waist,
        hips_cm: formData.hips,
        left_bicep_cm: formData.left_bicep,
        right_bicep_cm: formData.right_bicep,
        left_forearm_cm: formData.left_forearm,
        right_forearm_cm: formData.right_forearm,
        left_thigh_cm: formData.left_thigh,
        right_thigh_cm: formData.right_thigh,
        left_calf_cm: formData.left_calf,
        right_calf_cm: formData.right_calf,
        lean_mass_kg: formData.lean_mass,
        fat_mass_kg: formData.fat_mass,
        bone_density: formData.bone_density,
        visceral_fat_rating: formData.visceral_fat_rating,
        trunk_fat_percent: formData.trunk_fat_percent,
        left_arm_fat_percent: formData.left_arm_fat_percent,
        right_arm_fat_percent: formData.right_arm_fat_percent,
        left_leg_fat_percent: formData.left_leg_fat_percent,
        right_leg_fat_percent: formData.right_leg_fat_percent,
        notes: formData.notes || null,
        uses_imperial: formData.uses_imperial,
      };

      const { error } = await supabase
        .from('user_body_entries')
        .insert(entry);

      if (error) throw error;

      // Refresh entries
      await get().fetchBodyEntries();
    } catch (error) {
      console.error('Error adding body entry:', error);
      throw error;
    }
  },

  updateBodyEntry: async (id: string, formData: Partial<BodyEntryFormData>) => {
    try {
      const updates: Record<string, unknown> = {};
      
      if (formData.entry_date) updates.entry_date = format(formData.entry_date, 'yyyy-MM-dd');
      if (formData.weight !== undefined) updates.weight_kg = formData.weight;
      if (formData.height !== undefined) updates.height_cm = formData.height;
      if (formData.body_fat_percent !== undefined) updates.body_fat_percent = formData.body_fat_percent;
      if (formData.measurement_source !== undefined) updates.measurement_source = formData.measurement_source;
      if (formData.neck !== undefined) updates.neck_cm = formData.neck;
      if (formData.shoulders !== undefined) updates.shoulders_cm = formData.shoulders;
      if (formData.chest !== undefined) updates.chest_cm = formData.chest;
      if (formData.waist !== undefined) updates.waist_cm = formData.waist;
      if (formData.hips !== undefined) updates.hips_cm = formData.hips;
      if (formData.left_bicep !== undefined) updates.left_bicep_cm = formData.left_bicep;
      if (formData.right_bicep !== undefined) updates.right_bicep_cm = formData.right_bicep;
      if (formData.left_forearm !== undefined) updates.left_forearm_cm = formData.left_forearm;
      if (formData.right_forearm !== undefined) updates.right_forearm_cm = formData.right_forearm;
      if (formData.left_thigh !== undefined) updates.left_thigh_cm = formData.left_thigh;
      if (formData.right_thigh !== undefined) updates.right_thigh_cm = formData.right_thigh;
      if (formData.left_calf !== undefined) updates.left_calf_cm = formData.left_calf;
      if (formData.right_calf !== undefined) updates.right_calf_cm = formData.right_calf;
      if (formData.lean_mass !== undefined) updates.lean_mass_kg = formData.lean_mass;
      if (formData.fat_mass !== undefined) updates.fat_mass_kg = formData.fat_mass;
      if (formData.bone_density !== undefined) updates.bone_density = formData.bone_density;
      if (formData.visceral_fat_rating !== undefined) updates.visceral_fat_rating = formData.visceral_fat_rating;
      if (formData.notes !== undefined) updates.notes = formData.notes;
      if (formData.uses_imperial !== undefined) updates.uses_imperial = formData.uses_imperial;

      // Recalculate BMI if weight or height changed
      if (formData.weight !== undefined || formData.height !== undefined) {
        const entries = get().bodyEntries;
        const currentEntry = entries.find(e => e.id === id);
        const weight = formData.weight ?? currentEntry?.weight_kg;
        const height = formData.height ?? currentEntry?.height_cm;
        
        if (weight && height) {
          const heightM = height / 100;
          updates.bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
        }
      }

      const { error } = await supabase
        .from('user_body_entries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await get().fetchBodyEntries();
    } catch (error) {
      console.error('Error updating body entry:', error);
      throw error;
    }
  },

  deleteBodyEntry: async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_body_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchBodyEntries();
    } catch (error) {
      console.error('Error deleting body entry:', error);
      throw error;
    }
  },

  fetchWearableConnections: async () => {
    set({ isLoadingConnections: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_wearable_connections')
        .select('id, user_id, device_type, is_connected, last_sync_at, sync_error, created_at, updated_at')
        .eq('user_id', user.id);

      if (error) throw error;
      
      set({ wearableConnections: (data || []) as WearableConnection[] });
    } catch (error) {
      console.error('Error fetching wearable connections:', error);
    } finally {
      set({ isLoadingConnections: false });
    }
  },

  fetchWearableData: async (startDate?: Date, endDate?: Date) => {
    set({ isLoadingWearableData: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('user_wearable_data')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      if (startDate) {
        query = query.gte('recorded_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('recorded_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      
      set({ wearableData: (data || []) as WearableDataPoint[] });
    } catch (error) {
      console.error('Error fetching wearable data:', error);
    } finally {
      set({ isLoadingWearableData: false });
    }
  },

  setUsesImperial: (value: boolean) => {
    set({ usesImperial: value });
  },
}));
