import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { 
  Workout, 
  WorkoutExercise, 
  ExerciseSet, 
  ConditioningSet,
  PersonalRecord,
  ExerciseHistory,
  WeeklyVolume,
  WorkoutDay,
  isConditioningExercise
} from '@/types/workout';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { WeightUnit, getStoredUnit, setStoredUnit } from '@/lib/weightConversion';

// Helper to cast Supabase set rows to ExerciseSet (set_type comes as string)
function castSet(s: any): ExerciseSet {
  return { ...s, set_type: (s.set_type as 'warmup' | 'working') || 'working', duration_seconds: s.duration_seconds ?? null };
}
function castSets(sets: any[]): ExerciseSet[] {
  return (sets || []).map(castSet);
}
function castExercises(exercisesData: any[]): WorkoutExercise[] {
  return (exercisesData || []).map(e => ({
    ...e,
    exercise_type: (e.exercise_type as 'strength' | 'conditioning') || 'strength',
    superset_group: e.superset_group || null,
    sets: castSets(e.sets || []).sort((a, b) => a.set_number - b.set_number),
    conditioning_sets: (e.conditioning_sets || []).map((cs: any) => ({
      ...cs,
      distance_unit: (cs.distance_unit as 'miles' | 'km' | 'meters') || 'miles'
    })).sort((a: ConditioningSet, b: ConditioningSet) => a.set_number - b.set_number),
  })) as WorkoutExercise[];
}

interface WorkoutState {
  // Current workout session
  activeWorkout: Workout | null;
  exercises: WorkoutExercise[];
  isEditing: boolean;
  
  // History and records
  recentWorkouts: Workout[];
  personalRecords: PersonalRecord[];
  
  // Calendar navigation
  selectedDate: Date;
  viewingWorkout: Workout | null;
  viewingExercises: WorkoutExercise[];
  workoutDays: WorkoutDay[];
  
  // Unit preference
  preferredUnit: WeightUnit;
  setPreferredUnit: (unit: WeightUnit) => void;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // New PR celebration
  newPR: { exerciseName: string; weight: number } | null;
  clearNewPR: () => void;

  // Rest timer trigger
  restTimerTrigger: number;
  
  // Calendar actions
  setSelectedDate: (date: Date) => void;
  fetchWorkoutByDate: (date: Date) => Promise<void>;
  
  // Workout session actions
  startWorkout: (name: string, date?: Date) => Promise<void>;
  addExercise: (name: string) => Promise<void>;
  removeExercise: (exerciseId: string) => Promise<void>;
  addSet: (exerciseId: string, setType?: 'warmup' | 'working') => Promise<void>;
  removeSet: (setId: string) => Promise<void>;
  updateSet: (setId: string, data: Partial<ExerciseSet>) => void;
  completeSet: (setId: string, exerciseName: string, weight: number, reps: number, rir?: number | null) => Promise<boolean>;
  loadLastSession: (exerciseId: string, exerciseName: string) => Promise<void>;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => Promise<void>;
  
  // Superset actions
  linkSuperset: (exerciseId: string, targetExerciseId: string) => Promise<void>;
  unlinkSuperset: (exerciseId: string) => Promise<void>;
  
  // Conditioning actions
  addConditioningSet: (exerciseId: string) => Promise<void>;
  removeConditioningSet: (setId: string) => Promise<void>;
  updateConditioningSet: (setId: string, data: Partial<ConditioningSet>) => void;
  completeConditioningSet: (setId: string) => Promise<void>;
  
  // Fetching
  fetchActiveWorkout: () => Promise<void>;
  loadWorkoutIntoActive: (workoutId: string) => Promise<void>;
  fetchWorkoutHistory: (days?: number) => Promise<void>;
  fetchPersonalRecords: () => Promise<void>;
  fetchExerciseHistory: (exerciseName: string) => Promise<ExerciseHistory[]>;
  fetchWeeklyVolume: (weeks?: number) => Promise<WeeklyVolume[]>;
  fetchWorkoutDays: (weeks?: number) => Promise<WorkoutDay[]>;
  getLastSessionSets: (exerciseName: string) => Promise<{ weight: number; reps: number }[]>;
  editWorkout: (workoutId: string) => Promise<void>;
  updateWorkoutNotes: (notes: string) => void;
  moveExercise: (exerciseId: string, direction: 'up' | 'down') => Promise<void>;
  replaceExercise: (exerciseId: string, newName: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: null,
  exercises: [],
  isEditing: false,
  recentWorkouts: [],
  personalRecords: [],
  selectedDate: new Date(),
  viewingWorkout: null,
  viewingExercises: [],
  workoutDays: [],
  preferredUnit: getStoredUnit(),
  isLoading: false,
  isSaving: false,
  newPR: null,
  restTimerTrigger: 0,
  
  clearNewPR: () => set({ newPR: null }),
  
  setPreferredUnit: (unit: WeightUnit) => {
    setStoredUnit(unit);
    set({ preferredUnit: unit });
  },
  
  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
  },
  
  fetchWorkoutByDate: async (date: Date) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const user = session.user;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const { data: workout } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .eq('is_completed', true)
      .order('total_volume', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (workout) {
      const { data: exercisesData } = await supabase
        .from('workout_exercises')
        .select('*, sets:exercise_sets(*)')
        .eq('workout_id', workout.id)
        .order('order_index');
      
      set({ viewingWorkout: workout, viewingExercises: castExercises(exercisesData || []) });
    } else {
      set({ viewingWorkout: null, viewingExercises: [] });
    }
  },
  
  startWorkout: async (name: string, date?: Date) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const user = session.user;
    
    set({ isSaving: true });
    
    const workoutDate = date || new Date();
    
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        workout_name: name,
        date: format(workoutDate, 'yyyy-MM-dd'),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error starting workout:', error);
      set({ isSaving: false });
      return;
    }
    
    set({ activeWorkout: workout, exercises: [], isSaving: false });
  },
  
  addExercise: async (name: string) => {
    const { activeWorkout, exercises } = get();
    if (!activeWorkout) return;
    
    const exerciseType = isConditioningExercise(name) ? 'conditioning' : 'strength';
    
    const { data: exercise, error } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: activeWorkout.id,
        exercise_name: name,
        order_index: exercises.length,
        exercise_type: exerciseType,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding exercise:', error);
      return;
    }
    
    if (exerciseType === 'conditioning') {
      const { data: firstSet } = await supabase
        .from('conditioning_sets')
        .insert({ exercise_id: exercise.id, set_number: 1 })
        .select()
        .single();
      
      const newExercise: WorkoutExercise = { 
        ...exercise, 
        exercise_type: 'conditioning',
        superset_group: exercise.superset_group || null,
        conditioning_sets: firstSet ? [{...firstSet, distance_unit: (firstSet.distance_unit as 'miles' | 'km' | 'meters') || 'miles'}] : [],
        sets: []
      };
      set({ exercises: [...exercises, newExercise] });
    } else {
      const { data: firstSet } = await supabase
        .from('exercise_sets')
        .insert({ exercise_id: exercise.id, set_number: 1 })
        .select()
        .single();
      
      const newExercise: WorkoutExercise = { 
        ...exercise, 
        exercise_type: 'strength',
        superset_group: exercise.superset_group || null,
        sets: firstSet ? [castSet(firstSet)] : [],
        conditioning_sets: []
      };
      set({ exercises: [...exercises, newExercise] });
    }
  },
  
  removeExercise: async (exerciseId: string) => {
    const { exercises } = get();
    await supabase.from('workout_exercises').delete().eq('id', exerciseId);
    set({ exercises: exercises.filter(e => e.id !== exerciseId) });
  },
  
  addSet: async (exerciseId: string, setType: 'warmup' | 'working' = 'working') => {
    const { exercises } = get();
    const exercise = exercises.find(e => e.id === exerciseId);
    console.log('[addSet] exerciseId:', exerciseId, 'setType:', setType, 'found:', !!exercise);
    if (!exercise) return;
    
    const newSetNumber = (exercise.sets?.length || 0) + 1;
    
    const { data: newSet, error } = await supabase
      .from('exercise_sets')
      .insert({
        exercise_id: exerciseId,
        set_number: newSetNumber,
        set_type: setType,
      })
      .select()
      .single();
    
    if (error || !newSet) return;
    
    set({
      exercises: exercises.map(e => 
        e.id === exerciseId 
          ? { ...e, sets: [...(e.sets || []), castSet(newSet)] }
          : e
      )
    });
  },
  
  removeSet: async (setId: string) => {
    const { exercises } = get();
    await supabase.from('exercise_sets').delete().eq('id', setId);
    set({
      exercises: exercises.map(e => ({
        ...e,
        sets: e.sets?.filter(s => s.id !== setId)
      }))
    });
  },
  
  // Conditioning set actions
  addConditioningSet: async (exerciseId: string) => {
    const { exercises } = get();
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    
    const newSetNumber = (exercise.conditioning_sets?.length || 0) + 1;
    
    const { data: newSet, error } = await supabase
      .from('conditioning_sets')
      .insert({ exercise_id: exerciseId, set_number: newSetNumber })
      .select()
      .single();
    
    if (error || !newSet) return;
    
    const typedSet: ConditioningSet = {
      ...newSet,
      distance_unit: (newSet.distance_unit as 'miles' | 'km' | 'meters') || 'miles'
    };
    
    set({
      exercises: exercises.map(e => 
        e.id === exerciseId 
          ? { ...e, conditioning_sets: [...(e.conditioning_sets || []), typedSet] }
          : e
      )
    });
  },
  
  removeConditioningSet: async (setId: string) => {
    const { exercises } = get();
    await supabase.from('conditioning_sets').delete().eq('id', setId);
    set({
      exercises: exercises.map(e => ({
        ...e,
        conditioning_sets: e.conditioning_sets?.filter(s => s.id !== setId)
      }))
    });
  },
  
  updateConditioningSet: (setId: string, data: Partial<ConditioningSet>) => {
    const { exercises } = get();
    set({
      exercises: exercises.map(e => ({
        ...e,
        conditioning_sets: e.conditioning_sets?.map(s => 
          s.id === setId ? { ...s, ...data } : s
        )
      }))
    });
    supabase.from('conditioning_sets').update(data).eq('id', setId).then(() => {});
  },
  
  completeConditioningSet: async (setId: string) => {
    const { exercises } = get();
    await supabase.from('conditioning_sets').update({ is_completed: true }).eq('id', setId);
    set({
      exercises: exercises.map(e => ({
        ...e,
        conditioning_sets: e.conditioning_sets?.map(s => 
          s.id === setId ? { ...s, is_completed: true } : s
        )
      }))
    });
  },
  
  updateSet: (setId: string, data: Partial<ExerciseSet>) => {
    const { exercises } = get();
    set({
      exercises: exercises.map(e => ({
        ...e,
        sets: e.sets?.map(s => 
          s.id === setId ? { ...s, ...data } : s
        )
      }))
    });
    // Build the DB update payload — include duration_seconds if present
    const dbData: any = { ...data };
    supabase.from('exercise_sets').update(dbData).eq('id', setId).then(() => {});
  },
  
  completeSet: async (setId: string, exerciseName: string, weight: number, reps: number, rir?: number | null) => {
    console.log('[completeSet] setId:', setId, 'exercise:', exerciseName, 'weight:', weight, 'reps:', reps, 'rir:', rir);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || !weight) { console.log('[completeSet] no session or weight'); return false; }
    const user = session.user;
    
    const { exercises, activeWorkout, personalRecords } = get();
    
    const updateData: any = { is_completed: true, weight, reps };
    if (rir !== undefined) updateData.rir = rir;
    
    await supabase.from('exercise_sets').update(updateData).eq('id', setId);
    
    // Update local state
    set({
      exercises: exercises.map(e => ({
        ...e,
        sets: e.sets?.map(s => 
          s.id === setId ? { ...s, is_completed: true, weight, reps, rir: rir ?? s.rir } : s
        )
      }))
    });

    // Trigger rest timer
    set({ restTimerTrigger: get().restTimerTrigger + 1 });

    // Find the set to check if it's a working set before checking PR
    const currentSet = exercises.flatMap(e => e.sets || []).find(s => s.id === setId);
    const setType = currentSet?.set_type || 'working';
    
    // Only check PR for working sets
    if (setType !== 'working') return false;
    
    const normalizedName = exerciseName.toLowerCase();
    const currentPR = personalRecords.find(pr => pr.exercise_name === normalizedName);
    
    if (!currentPR || weight > currentPR.max_weight) {
      const { data: newPR } = await supabase
        .from('personal_records')
        .upsert({
          user_id: user.id,
          exercise_name: normalizedName,
          max_weight: weight,
          max_reps: reps,
          workout_id: activeWorkout?.id,
          set_id: setId,
          achieved_at: new Date().toISOString(),
        }, { onConflict: 'user_id,exercise_name' })
        .select()
        .single();
      
      if (newPR) {
        set({ 
          personalRecords: currentPR 
            ? personalRecords.map(pr => pr.exercise_name === normalizedName ? newPR : pr)
            : [...personalRecords, newPR],
          newPR: { exerciseName, weight }
        });

        import('@/stores/goalStore').then(({ useGoalStore }) => {
          useGoalStore.getState().syncGoalsAfterPR(exerciseName, weight);
        });

        return true;
      }
    }
    
    return false;
  },
  
  loadLastSession: async (exerciseId: string, exerciseName: string) => {
    console.log('[loadLastSession] exerciseId:', exerciseId, 'exerciseName:', exerciseName);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { console.log('[loadLastSession] no session'); return; }
    
    const lastSets = await get().getLastSessionSets(exerciseName);
    console.log('[loadLastSession] lastSets:', lastSets);
    if (lastSets.length === 0) { console.log('[loadLastSession] no previous sets found'); return; }
    
    const { exercises } = get();
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    
    await supabase.from('exercise_sets').delete().eq('exercise_id', exerciseId);
    
    const { data: newSets } = await supabase
      .from('exercise_sets')
      .insert(
        lastSets.map((s, i) => ({
          exercise_id: exerciseId,
          set_number: i + 1,
          weight: s.weight,
          reps: s.reps,
          is_completed: false,
        }))
      )
      .select();
    
    if (newSets) {
      set({
        exercises: exercises.map(e =>
          e.id === exerciseId ? { ...e, sets: castSets(newSets) } : e
        )
      });
    }
  },
  
  // Superset actions
  linkSuperset: async (exerciseId: string, targetExerciseId: string) => {
    console.log('[linkSuperset] exerciseId:', exerciseId, 'targetId:', targetExerciseId);
    const { exercises } = get();
    const target = exercises.find(e => e.id === targetExerciseId);
    const groupId = target?.superset_group || crypto.randomUUID();
    
    // Update both exercises
    await Promise.all([
      supabase.from('workout_exercises').update({ superset_group: groupId }).eq('id', exerciseId),
      supabase.from('workout_exercises').update({ superset_group: groupId }).eq('id', targetExerciseId),
    ]);
    
    set({
      exercises: exercises.map(e => 
        e.id === exerciseId || e.id === targetExerciseId
          ? { ...e, superset_group: groupId }
          : e
      )
    });
  },
  
  unlinkSuperset: async (exerciseId: string) => {
    const { exercises } = get();
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise?.superset_group) return;
    
    const groupId = exercise.superset_group;
    const groupMembers = exercises.filter(e => e.superset_group === groupId);
    
    // If only 2 in group, unlink both
    if (groupMembers.length <= 2) {
      await Promise.all(
        groupMembers.map(e => 
          supabase.from('workout_exercises').update({ superset_group: null }).eq('id', e.id)
        )
      );
      set({
        exercises: exercises.map(e => 
          e.superset_group === groupId ? { ...e, superset_group: null } : e
        )
      });
    } else {
      // Just remove this one
      await supabase.from('workout_exercises').update({ superset_group: null }).eq('id', exerciseId);
      set({
        exercises: exercises.map(e => 
          e.id === exerciseId ? { ...e, superset_group: null } : e
        )
      });
    }
  },
  
  finishWorkout: async () => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    
    set({ isSaving: true });
    
    await supabase.from('workouts').update({ is_completed: true }).eq('id', activeWorkout.id);
    
    const wasEditing = get().isEditing;
    const currentSelectedDate = get().selectedDate;
    set({ activeWorkout: null, exercises: [], isSaving: false, isEditing: false });
    if (wasEditing) {
      get().fetchWorkoutByDate(currentSelectedDate);
    }
  },

  editWorkout: async (workoutId: string) => {
    set({ isLoading: true });

    await supabase.from('workouts').update({ is_completed: false }).eq('id', workoutId);

    const { data: workout } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (!workout) {
      set({ isLoading: false });
      return;
    }

    const { data: exercisesData } = await supabase
      .from('workout_exercises')
      .select('*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)')
      .eq('workout_id', workoutId)
      .order('order_index');

    set({
      activeWorkout: workout,
      exercises: castExercises(exercisesData || []),
      viewingWorkout: null,
      viewingExercises: [],
      selectedDate: new Date(workout.date + 'T12:00:00'),
      isEditing: true,
      isLoading: false,
    });
  },
  
  updateWorkoutNotes: (notes: string) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    set({ activeWorkout: { ...activeWorkout, notes } });
    supabase.from('workouts').update({ notes }).eq('id', activeWorkout.id).then(() => {});
  },

  moveExercise: async (exerciseId: string, direction: 'up' | 'down') => {
    const { exercises } = get();
    const sorted = [...exercises].sort((a, b) => a.order_index - b.order_index);
    const idx = sorted.findIndex(e => e.id === exerciseId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx];
    const neighbor = sorted[swapIdx];
    const currentOrder = current.order_index;
    const neighborOrder = neighbor.order_index;

    // Swap in DB
    await Promise.all([
      supabase.from('workout_exercises').update({ order_index: neighborOrder }).eq('id', current.id),
      supabase.from('workout_exercises').update({ order_index: currentOrder }).eq('id', neighbor.id),
    ]);

    // Swap locally and re-sort
    set({
      exercises: exercises
        .map(e => {
          if (e.id === current.id) return { ...e, order_index: neighborOrder };
          if (e.id === neighbor.id) return { ...e, order_index: currentOrder };
          return e;
        })
        .sort((a, b) => a.order_index - b.order_index)
    });
  },

  replaceExercise: async (exerciseId: string, newName: string) => {
    const { exercises } = get();
    const { error } = await supabase
      .from('workout_exercises')
      .update({ exercise_name: newName })
      .eq('id', exerciseId);
    if (error) { console.error('Error replacing exercise:', error); return; }
    set({
      exercises: exercises.map(e =>
        e.id === exerciseId ? { ...e, exercise_name: newName } : e
      )
    });
  },

  cancelWorkout: async () => {
    const { activeWorkout, isEditing } = get();
    if (!activeWorkout) return;
    
    if (isEditing) {
      await supabase.from('workouts').update({ is_completed: true }).eq('id', activeWorkout.id);
    } else {
      await supabase.from('workouts').delete().eq('id', activeWorkout.id);
    }
    
    const currentSelectedDate = get().selectedDate;
    set({ activeWorkout: null, exercises: [], isEditing: false });
    if (isEditing) {
      get().fetchWorkoutByDate(currentSelectedDate);
    }
  },
  
  fetchActiveWorkout: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const user = session.user;
    
    if (get().isEditing) return;

    set({ isLoading: true });
    
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data: workout } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (workout) {
      const isProgramSession = workout.workout_name.includes('—');
      if (workout.date < today && !isProgramSession) {
        const { count } = await supabase
          .from('exercise_sets')
          .select('id', { count: 'exact', head: true })
          .in('exercise_id', 
            (await supabase
              .from('workout_exercises')
              .select('id')
              .eq('workout_id', workout.id)
            ).data?.map(e => e.id) || []
          )
          .eq('is_completed', true);

        if (count && count > 0) {
          await supabase.from('workouts').update({ is_completed: true }).eq('id', workout.id);
        } else {
          await supabase.from('workouts').delete().eq('id', workout.id);
        }
        set({ activeWorkout: null, exercises: [], isLoading: false });
        return;
      }

      const { data: exercisesData } = await supabase
        .from('workout_exercises')
        .select('*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)')
        .eq('workout_id', workout.id)
        .order('order_index');
      
      set({ activeWorkout: workout, exercises: castExercises(exercisesData || []), isLoading: false });
    } else {
      set({ activeWorkout: null, exercises: [], isLoading: false });
    }
  },

  loadWorkoutIntoActive: async (workoutId: string) => {
    const { data: workout } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (!workout) return;

    const { data: exercisesData } = await supabase
      .from('workout_exercises')
      .select('*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)')
      .eq('workout_id', workoutId)
      .order('order_index');

    set({ activeWorkout: workout, exercises: castExercises(exercisesData || []), viewingWorkout: null, viewingExercises: [] });
  },
  
  fetchWorkoutHistory: async (days = 30) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const user = session.user;
    
    const fromDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('date', fromDate)
      .order('date', { ascending: false });
    
    set({ recentWorkouts: workouts || [] });
  },
  
  fetchPersonalRecords: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const user = session.user;
    
    const { data: records } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', user.id)
      .order('max_weight', { ascending: false });
    
    set({ personalRecords: records || [] });
  },
  
  fetchExerciseHistory: async (exerciseName: string): Promise<ExerciseHistory[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];
    const user = session.user;
    
    const normalizedName = exerciseName.toLowerCase();
    
    const { data: exercisesData } = await supabase
      .from('workout_exercises')
      .select(`
        id,
        workout:workouts!inner(id, date, user_id),
        sets:exercise_sets(weight, reps, is_completed)
      `)
      .ilike('exercise_name', normalizedName)
      .order('created_at', { ascending: true });
    
    if (!exercisesData) return [];
    
    const historyMap = new Map<string, ExerciseHistory>();
    
    for (const ex of exercisesData) {
      const workout = ex.workout as unknown as { id: string; date: string; user_id: string };
      if (workout.user_id !== user.id) continue;
      
      const completedSets = (ex.sets || []).filter((s: any) => s.is_completed && s.weight);
      if (completedSets.length === 0) continue;
      
      const maxWeight = Math.max(...completedSets.map((s: any) => s.weight));
      const totalVolume = completedSets.reduce((sum: number, s: any) => sum + (s.weight * s.reps), 0);
      
      const existing = historyMap.get(workout.date);
      if (!existing || maxWeight > existing.max_weight) {
        historyMap.set(workout.date, {
          date: workout.date,
          max_weight: maxWeight,
          total_volume: totalVolume,
          sets: completedSets.map((s: any) => ({ weight: s.weight, reps: s.reps })),
        });
      }
    }
    
    return Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  },
  
  fetchWeeklyVolume: async (weeks = 4): Promise<WeeklyVolume[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];
    const user = session.user;
    
    const fromDate = format(subDays(new Date(), weeks * 7), 'yyyy-MM-dd');
    
    const { data: workouts } = await supabase
      .from('workouts')
      .select('date, total_volume')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('date', fromDate);
    
    if (!workouts) return [];
    
    const weeklyMap = new Map<string, number>();
    
    for (const w of workouts) {
      const weekStart = format(startOfWeek(new Date(w.date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const current = weeklyMap.get(weekStart) || 0;
      weeklyMap.set(weekStart, current + (w.total_volume || 0));
    }
    
    return Array.from(weeklyMap.entries())
      .map(([week_start, total_volume]) => ({
        week_start,
        week_label: `Week of ${format(new Date(week_start), 'MMM d')}`,
        total_volume,
      }))
      .sort((a, b) => a.week_start.localeCompare(b.week_start));
  },
  
  fetchWorkoutDays: async (weeks = 12): Promise<WorkoutDay[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];
    const user = session.user;

    const fromDate = format(subDays(new Date(), weeks * 7), 'yyyy-MM-dd');
    const futureDate = format(addDays(new Date(), weeks * 7), 'yyyy-MM-dd');

    const { data: workouts } = await supabase
      .from('workouts')
      .select('date')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('date', fromDate);

    const { data: programWorkouts } = await supabase
      .from('user_calendar_workouts')
      .select('scheduled_date, is_completed, enrollment:user_program_enrollments!inner(status)')
      .eq('user_id', user.id)
      .eq('enrollment.status', 'active')
      .gte('scheduled_date', fromDate)
      .lte('scheduled_date', futureDate);

    const dayMap = new Map<string, number>();

    for (const w of workouts || []) {
      dayMap.set(w.date, (dayMap.get(w.date) || 0) + 1);
    }
    for (const pw of programWorkouts || []) {
      dayMap.set(pw.scheduled_date, (dayMap.get(pw.scheduled_date) || 0) + 1);
    }

    const days = Array.from(dayMap.entries()).map(([date, workout_count]) => ({
      date,
      workout_count,
    }));

    set({ workoutDays: days });
    return days;
  },
  
  getLastSessionSets: async (exerciseName: string): Promise<{ weight: number; reps: number }[]> => {
    console.log('[getLastSessionSets] exerciseName:', exerciseName);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { console.log('[getLastSessionSets] no session'); return []; }
    const user = session.user;
    
    const { activeWorkout } = get();
    const normalizedName = exerciseName.toLowerCase();
    console.log('[getLastSessionSets] normalizedName:', normalizedName, 'activeWorkout:', activeWorkout?.id);
    
    // Fetch recent exercises for this movement, excluding current workout
    const query = supabase
      .from('workout_exercises')
      .select(`
        id,
        workout_id,
        workout:workouts!inner(id, date, user_id, is_completed),
        sets:exercise_sets(weight, reps, set_number, is_completed, set_type)
      `)
      .ilike('exercise_name', normalizedName)
      .eq('workout.is_completed', true)
      .eq('workout.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    const { data: results, error } = await query;
    console.log('[getLastSessionSets] results:', results?.length, 'error:', error);
    
    if (!results || results.length === 0) return [];
    
    // Find first result that's not the current active workout
    for (const entry of results) {
      if (activeWorkout && entry.workout_id === activeWorkout.id) continue;
      
      const completedSets = (entry.sets || [])
        .filter((s: any) => s.is_completed && s.weight)
        .sort((a: any, b: any) => a.set_number - b.set_number)
        .map((s: any) => ({ weight: s.weight, reps: s.reps }));
      
      if (completedSets.length > 0) return completedSets;
    }
    
    return [];
  },
}));
