import { create } from "zustand";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type LogSource = "manual" | "voice" | "photo" | "database";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  entry_date: string;
  meal_slot: string;
  food_data: { description?: string; items?: string[] } | null;
  calculated_macros: Partial<Macros> | null;
  source: LogSource;
  photo_path: string | null;
  transcript: string | null;
  ai_estimate: Record<string, unknown> | null;
  is_confirmed: boolean;
  confirmed_at: string | null;
  coach_comment: string | null;
  created_at: string;
}

export interface NutritionTarget {
  id: string;
  user_id: string;
  effective_from: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  fiber_g: number | null;
  notes: string | null;
  set_by: string | null;
}

export interface NewEntryInput {
  entry_date: string;
  meal_slot: MealSlot;
  description: string;
  macros: Macros;
  source: LogSource;
  photoFile?: File | null;
  transcript?: string | null;
  aiEstimate?: Record<string, unknown> | null;
}

interface NutritionLogState {
  selectedDate: string;
  entries: FoodEntry[];
  target: NutritionTarget | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  photoUrls: Record<string, string>;

  setSelectedDate: (date: string) => void;
  loadDay: (date?: string, userId?: string) => Promise<void>;
  addEntry: (input: NewEntryInput) => Promise<boolean>;
  updateEntry: (id: string, patch: Partial<FoodEntry>) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<void>;
  signPhoto: (path: string) => Promise<string | null>;
  saveTarget: (
    userId: string,
    effectiveFrom: string,
    values: Partial<NutritionTarget>
  ) => Promise<boolean>;
}

export const emptyMacros = (): Macros => ({ calories: 0, protein: 0, carbs: 0, fats: 0 });

export function sumMacros(entries: FoodEntry[], confirmedOnly = true): Macros {
  return entries.reduce((acc, e) => {
    if (confirmedOnly && !e.is_confirmed) return acc;
    const m = e.calculated_macros ?? {};
    return {
      calories: acc.calories + Number(m.calories ?? 0),
      protein: acc.protein + Number(m.protein ?? 0),
      carbs: acc.carbs + Number(m.carbs ?? 0),
      fats: acc.fats + Number(m.fats ?? 0),
    };
  }, emptyMacros());
}

export const useNutritionLogStore = create<NutritionLogState>((set, get) => ({
  selectedDate: format(new Date(), "yyyy-MM-dd"),
  entries: [],
  target: null,
  loading: false,
  saving: false,
  error: null,
  photoUrls: {},

  setSelectedDate: (date) => set({ selectedDate: date }),

  loadDay: async (date, userId) => {
    const day = date ?? get().selectedDate;
    set({ loading: true, error: null, selectedDate: day });
    try {
      let uid = userId;
      if (!uid) {
        const { data } = await supabase.auth.getUser();
        uid = data.user?.id;
      }
      if (!uid) throw new Error("Not signed in");

      const [{ data: entries, error: eErr }, { data: targets, error: tErr }] = await Promise.all([
        supabase
          .from("user_food_diary")
          .select("*")
          .eq("user_id", uid)
          .eq("entry_date", day)
          .order("created_at", { ascending: true }),
        supabase
          .from("nutrition_targets")
          .select("*")
          .eq("user_id", uid)
          .lte("effective_from", day)
          .order("effective_from", { ascending: false })
          .limit(1),
      ]);
      if (eErr) throw eErr;
      if (tErr) throw tErr;

      set({
        entries: (entries ?? []) as unknown as FoodEntry[],
        target: ((targets ?? [])[0] as unknown as NutritionTarget) ?? null,
        loading: false,
      });
    } catch (e: unknown) {
      set({ loading: false, error: (e as Error).message ?? "Could not load today's nutrition" });
    }
  },

  addEntry: async (input) => {
    set({ saving: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      let photoPath: string | null = null;
      if (input.photoFile) {
        const ext = input.photoFile.name.split(".").pop() || "jpg";
        const path = `${uid}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("meal-photos")
          .upload(path, input.photoFile, { upsert: false });
        if (upErr) throw upErr;
        photoPath = path;
      }

      const payload = {
        user_id: uid,
        entry_date: input.entry_date,
        meal_slot: input.meal_slot,
        food_data: { description: input.description },
        amount: 1,
        unit: "serving",
        calculated_macros: input.macros,
        source: input.source,
        photo_path: photoPath,
        transcript: input.transcript ?? null,
        ai_estimate: (input.aiEstimate ?? null) as never,
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_food_diary")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      set({ entries: [...get().entries, data as unknown as FoodEntry], saving: false });
      return true;
    } catch (e: unknown) {
      set({ saving: false, error: (e as Error).message ?? "Could not save this entry" });
      return false;
    }
  },

  updateEntry: async (id, patch) => {
    const prev = get().entries;
    set({ entries: prev.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
    const { error } = await supabase
      .from("user_food_diary")
      .update(patch as never)
      .eq("id", id);
    if (error) {
      set({ entries: prev, error: error.message });
      return false;
    }
    return true;
  },

  deleteEntry: async (id) => {
    const prev = get().entries;
    set({ entries: prev.filter((e) => e.id !== id) });
    const { error } = await supabase.from("user_food_diary").delete().eq("id", id);
    if (error) set({ entries: prev, error: error.message });
  },

  signPhoto: async (path) => {
    const cached = get().photoUrls[path];
    if (cached) return cached;
    const { data } = await supabase.storage.from("meal-photos").createSignedUrl(path, 3600);
    if (!data?.signedUrl) return null;
    set({ photoUrls: { ...get().photoUrls, [path]: data.signedUrl } });
    return data.signedUrl;
  },

  saveTarget: async (userId, effectiveFrom, values) => {
    set({ saving: true, error: null });
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("nutrition_targets")
      .upsert(
        {
          user_id: userId,
          effective_from: effectiveFrom,
          calories: values.calories ?? null,
          protein_g: values.protein_g ?? null,
          carbs_g: values.carbs_g ?? null,
          fats_g: values.fats_g ?? null,
          fiber_g: values.fiber_g ?? null,
          notes: values.notes ?? null,
          set_by: userData.user?.id ?? null,
        },
        { onConflict: "user_id,effective_from" }
      )
      .select()
      .single();
    if (error) {
      set({ saving: false, error: error.message });
      return false;
    }
    set({ saving: false, target: data as unknown as NutritionTarget });
    return true;
  },
}));
