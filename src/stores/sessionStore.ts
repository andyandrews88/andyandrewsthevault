import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type {
  ConditioningSet,
  ExerciseSet,
  Workout,
  WorkoutExercise,
} from "@/types/workout";
import { defaultSetUnit } from "@/lib/trainUnits";
import { findModality, guessModality } from "@/lib/conditioningModalities";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface LastPerformanceSet {
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  rir: number | null;
  unit: "kg" | "lb";
}

export interface LastPerformance {
  date: string;
  workout_id: string;
  sets: LastPerformanceSet[];
  best_e1rm: number | null;
}

interface PendingRetry {
  table: "exercise_sets" | "conditioning_sets";
  id: string;
  patch: Record<string, unknown>;
}

interface SessionState {
  workout: Workout | null;
  exercises: WorkoutExercise[];
  loading: boolean;
  error: string | null;
  saveStates: Record<string, SaveStatus>;
  saveErrors: Record<string, string>;
  pending: Record<string, PendingRetry>;
  lastPerformance: Record<string, LastPerformance | null>;
  loadingPerformance: Record<string, boolean>;

  loadSession: (workoutId: string) => Promise<void>;
  clearSession: () => void;

  patchSetLocal: (setId: string, patch: Partial<ExerciseSet>) => void;
  saveSet: (setId: string, patch: Partial<ExerciseSet>) => Promise<void>;
  toggleSetComplete: (setId: string, completed: boolean) => Promise<void>;
  addSet: (exerciseId: string, setType?: "warmup" | "working") => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;

  patchConditioningLocal: (setId: string, patch: Partial<ConditioningSet>) => void;
  saveConditioningSet: (setId: string, patch: Partial<ConditioningSet>) => Promise<void>;
  addConditioningSet: (exerciseId: string, modality?: string | null) => Promise<void>;
  deleteConditioningSet: (setId: string) => Promise<void>;

  addExercise: (name: string, type: "strength" | "conditioning") => Promise<void>;
  removeExercise: (exerciseId: string) => Promise<void>;

  retrySave: (rowId: string) => Promise<void>;
  finishSession: () => Promise<boolean>;
  reopenSession: () => Promise<void>;

  loadLastPerformance: (exerciseName: string) => Promise<void>;

  /** Writes a voice-dictated set, only ever called after explicit confirmation. */
  logVoiceSet: (
    exerciseId: string,
    setNumber: number,
    values: {
      weight?: number | null;
      unit?: "kg" | "lb" | null;
      reps?: number | null;
      rpe?: number | null;
    }
  ) => Promise<boolean>;
}

const EXERCISE_SELECT = `
  id, workout_id, exercise_name, order_index, notes, exercise_type, superset_group,
  workout_section, created_at, format, group_id, group_order, group_config, coach_instructions,
  exercise_sets(*),
  conditioning_sets(*)
`;

function sortExercises(rows: any[]): WorkoutExercise[] {
  return rows
    .map((row) => ({
      ...row,
      group_config: (row.group_config ?? {}) as Record<string, unknown>,
      sets: ((row.exercise_sets ?? []) as ExerciseSet[]).sort(
        (a, b) => a.set_number - b.set_number
      ),
      conditioning_sets: ((row.conditioning_sets ?? []) as ConditioningSet[]).sort(
        (a, b) => a.set_number - b.set_number
      ),
    }))
    .sort((a, b) => a.order_index - b.order_index) as unknown as WorkoutExercise[];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  workout: null,
  exercises: [],
  loading: false,
  error: null,
  saveStates: {},
  saveErrors: {},
  pending: {},
  lastPerformance: {},
  loadingPerformance: {},

  clearSession: () =>
    set({
      workout: null,
      exercises: [],
      error: null,
      saveStates: {},
      saveErrors: {},
      pending: {},
    }),

  loadSession: async (workoutId) => {
    set({ loading: true, error: null });
    try {
      const [{ data: workout, error: wErr }, { data: exRows, error: eErr }] = await Promise.all([
        supabase.from("workouts").select("*").eq("id", workoutId).maybeSingle(),
        supabase.from("workout_exercises").select(EXERCISE_SELECT).eq("workout_id", workoutId),
      ]);
      if (wErr) throw wErr;
      if (eErr) throw eErr;
      set({
        workout: (workout as unknown as Workout) ?? null,
        exercises: sortExercises(exRows ?? []),
        loading: false,
      });
    } catch (e: any) {
      set({ loading: false, error: e.message ?? "Could not load this session" });
    }
  },

  patchSetLocal: (setId, patch) => {
    set({
      exercises: get().exercises.map((ex) => ({
        ...ex,
        sets: ex.sets?.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
      })),
    });
  },

  saveSet: async (setId, patch) => {
    get().patchSetLocal(setId, patch);
    set({
      saveStates: { ...get().saveStates, [setId]: "saving" },
      saveErrors: { ...get().saveErrors, [setId]: "" },
    });
    const { error } = await supabase.from("exercise_sets").update(patch as any).eq("id", setId);
    if (error) {
      set({
        saveStates: { ...get().saveStates, [setId]: "error" },
        saveErrors: { ...get().saveErrors, [setId]: error.message },
        pending: {
          ...get().pending,
          [setId]: { table: "exercise_sets", id: setId, patch: patch as any },
        },
      });
      return;
    }
    const { [setId]: _removed, ...rest } = get().pending;
    set({ saveStates: { ...get().saveStates, [setId]: "saved" }, pending: rest });
  },

  toggleSetComplete: async (setId, completed) => {
    await get().saveSet(setId, { is_completed: completed } as Partial<ExerciseSet>);
    if (completed) {
      // estimated_1rm + PR sync happen in the database trigger; refresh this row
      const { data } = await supabase
        .from("exercise_sets")
        .select("estimated_1rm")
        .eq("id", setId)
        .maybeSingle();
      if (data) get().patchSetLocal(setId, { estimated_1rm: data.estimated_1rm });
    }
  },

  addSet: async (exerciseId, setType = "working") => {
    const exercise = get().exercises.find((e) => e.id === exerciseId);
    const existing = exercise?.sets ?? [];
    const last = existing[existing.length - 1];
    const payload = {
      exercise_id: exerciseId,
      set_number: existing.length + 1,
      set_type: setType,
      unit: last?.unit ?? defaultSetUnit(),
      weight: last?.weight ?? null,
      reps: last?.reps ?? null,
      is_completed: false,
    };
    const { data, error } = await supabase.from("exercise_sets").insert(payload).select().single();
    if (error || !data) return;
    set({
      exercises: get().exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: [...(ex.sets ?? []), data as unknown as ExerciseSet] } : ex
      ),
    });
  },

  deleteSet: async (setId) => {
    const prev = get().exercises;
    set({
      exercises: prev.map((ex) => ({ ...ex, sets: ex.sets?.filter((s) => s.id !== setId) })),
    });
    const { error } = await supabase.from("exercise_sets").delete().eq("id", setId);
    if (error) set({ exercises: prev });
  },

  patchConditioningLocal: (setId, patch) => {
    set({
      exercises: get().exercises.map((ex) => ({
        ...ex,
        conditioning_sets: ex.conditioning_sets?.map((s) =>
          s.id === setId ? { ...s, ...patch } : s
        ),
      })),
    });
  },

  saveConditioningSet: async (setId, patch) => {
    get().patchConditioningLocal(setId, patch);
    set({
      saveStates: { ...get().saveStates, [setId]: "saving" },
      saveErrors: { ...get().saveErrors, [setId]: "" },
    });
    const { error } = await supabase.from("conditioning_sets").update(patch as any).eq("id", setId);
    if (error) {
      set({
        saveStates: { ...get().saveStates, [setId]: "error" },
        saveErrors: { ...get().saveErrors, [setId]: error.message },
        pending: {
          ...get().pending,
          [setId]: { table: "conditioning_sets", id: setId, patch: patch as any },
        },
      });
      return;
    }
    const { [setId]: _removed, ...rest } = get().pending;
    set({ saveStates: { ...get().saveStates, [setId]: "saved" }, pending: rest });
  },

  addConditioningSet: async (exerciseId, modality = null) => {
    const exercise = get().exercises.find((e) => e.id === exerciseId);
    const existing = exercise?.conditioning_sets ?? [];
    const last = existing[existing.length - 1];
    const payload = {
      exercise_id: exerciseId,
      set_number: existing.length + 1,
      modality: modality ?? last?.modality ?? null,
      distance_unit:
        last?.distance_unit ?? findModality(modality)?.distanceUnit ?? "meters",
      speed_unit: last?.speed_unit ?? findModality(modality)?.speedUnit ?? null,
      is_completed: false,
    };
    const { data, error } = await supabase
      .from("conditioning_sets")
      .insert(payload)
      .select()
      .single();
    if (error || !data) return;
    set({
      exercises: get().exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, conditioning_sets: [...(ex.conditioning_sets ?? []), data as unknown as ConditioningSet] }
          : ex
      ),
    });
  },

  deleteConditioningSet: async (setId) => {
    const prev = get().exercises;
    set({
      exercises: prev.map((ex) => ({
        ...ex,
        conditioning_sets: ex.conditioning_sets?.filter((s) => s.id !== setId),
      })),
    });
    const { error } = await supabase.from("conditioning_sets").delete().eq("id", setId);
    if (error) set({ exercises: prev });
  },

  addExercise: async (name, type) => {
    const workout = get().workout;
    if (!workout) return;
    const orderIndex = get().exercises.length;
    const { data, error } = await supabase
      .from("workout_exercises")
      .insert({
        workout_id: workout.id,
        exercise_name: name,
        order_index: orderIndex,
        exercise_type: type,
        workout_section: "main",
        format: type === "conditioning" ? "conditioning" : "straight",
      })
      .select(EXERCISE_SELECT)
      .single();
    if (error || !data) return;
    set({ exercises: [...get().exercises, ...sortExercises([data])] });
    const created = data as any;
    if (type === "conditioning") {
      await get().addConditioningSet(created.id, guessModality(name));
    } else {
      await get().addSet(created.id);
    }
  },

  removeExercise: async (exerciseId) => {
    const prev = get().exercises;
    set({ exercises: prev.filter((e) => e.id !== exerciseId) });
    const { error } = await supabase.from("workout_exercises").delete().eq("id", exerciseId);
    if (error) set({ exercises: prev });
  },

  retrySave: async (rowId) => {
    const entry = get().pending[rowId];
    if (!entry) return;
    if (entry.table === "exercise_sets") {
      await get().saveSet(rowId, entry.patch as Partial<ExerciseSet>);
    } else {
      await get().saveConditioningSet(rowId, entry.patch as Partial<ConditioningSet>);
    }
  },

  finishSession: async () => {
    const workout = get().workout;
    if (!workout) return false;
    if (Object.keys(get().pending).length > 0) return false;
    const { error } = await supabase
      .from("workouts")
      .update({ is_completed: true })
      .eq("id", workout.id);
    if (error) return false;
    set({ workout: { ...workout, is_completed: true } });
    return true;
  },

  reopenSession: async () => {
    const workout = get().workout;
    if (!workout) return;
    await supabase.from("workouts").update({ is_completed: false }).eq("id", workout.id);
    set({ workout: { ...workout, is_completed: false } });
  },

  loadLastPerformance: async (exerciseName) => {
    const key = exerciseName.toLowerCase();
    if (get().lastPerformance[key] !== undefined || get().loadingPerformance[key]) return;
    set({ loadingPerformance: { ...get().loadingPerformance, [key]: true } });
    const currentWorkoutId = get().workout?.id;

    const { data } = await supabase
      .from("workout_exercises")
      .select(
        `id, workout_id, workouts!inner(id, date, user_id),
         exercise_sets(set_number, weight, reps, rpe, rir, unit, is_completed, set_type, estimated_1rm)`
      )
      .ilike("exercise_name", exerciseName)
      .order("date", { referencedTable: "workouts", ascending: false })
      .limit(15);

    const sessions = (data ?? [])
      .filter((row: any) => row.workout_id !== currentWorkoutId)
      .map((row: any) => {
        const sets = (row.exercise_sets ?? [])
          .filter((s: any) => s.is_completed && s.set_type === "working")
          .sort((a: any, b: any) => a.set_number - b.set_number);
        return { date: row.workouts.date as string, workout_id: row.workout_id as string, sets };
      })
      .filter((s: any) => s.sets.length > 0)
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

    const latest = sessions[0];
    const result: LastPerformance | null = latest
      ? {
          date: latest.date,
          workout_id: latest.workout_id,
          sets: latest.sets.map((s: any) => ({
            set_number: s.set_number,
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            rir: s.rir,
            unit: s.unit ?? "lb",
          })),
          best_e1rm: latest.sets.reduce(
            (m: number | null, s: any) =>
              s.estimated_1rm && (!m || s.estimated_1rm > m) ? s.estimated_1rm : m,
            null as number | null
          ),
        }
      : null;

    set({
      lastPerformance: { ...get().lastPerformance, [key]: result },
      loadingPerformance: { ...get().loadingPerformance, [key]: false },
    });
  },

  logVoiceSet: async (exerciseId, setNumber, values) => {
    const exercise = get().exercises.find((e) => e.id === exerciseId);
    if (!exercise) return false;

    let target = (exercise.sets ?? []).find((s) => s.set_number === setNumber);
    let guard = 0;
    while (!target && guard < 30) {
      guard += 1;
      const before = get().exercises.find((e) => e.id === exerciseId)?.sets?.length ?? 0;
      await get().addSet(exerciseId);
      const sets = get().exercises.find((e) => e.id === exerciseId)?.sets ?? [];
      if (sets.length === before) break; // insert failed — stop rather than loop
      target = sets.find((s) => s.set_number === setNumber);
    }
    if (!target) return false;

    const patch: Partial<ExerciseSet> = {};
    if (values.weight !== null && values.weight !== undefined) patch.weight = values.weight;
    if (values.unit) patch.unit = values.unit;
    if (values.reps !== null && values.reps !== undefined) patch.reps = values.reps;
    if (values.rpe !== null && values.rpe !== undefined) patch.rpe = values.rpe;
    patch.is_completed = true;

    await get().saveSet(target.id, patch);
    if (get().saveStates[target.id] === "error") return false;

    const { data } = await supabase
      .from("exercise_sets")
      .select("estimated_1rm")
      .eq("id", target.id)
      .maybeSingle();
    if (data) get().patchSetLocal(target.id, { estimated_1rm: data.estimated_1rm });
    return true;
  },
}));
