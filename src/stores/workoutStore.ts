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

interface WorkoutState {
  // Current workout session
  activeWorkout: Workout | null;
  exercises: WorkoutExercise[];
  
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
  
  // Calendar actions
  setSelectedDate: (date: Date) => void;
  fetchWorkoutByDate: (date: Date) => Promise<void>;
  
  // Workout session actions
  startWorkout: (name: string, date?: Date) => Promise<void>;
  addExercise: (name: string) => Promise<void>;
  removeExercise: (exerciseId: string) => Promise<void>;
  addSet: (exerciseId: string) => Promise<void>;
  removeSet: (setId: string) => Promise<void>;
  updateSet: (setId: string, data: Partial<ExerciseSet>) => void;
  completeSet: (setId: string, exerciseName: string, weight: number, reps: number, rir?: number | null) => Promise<boolean>;
  loadLastSession: (exerciseId: string, exerciseName: string) => Promise<void>;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => Promise<void>;
  
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
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: null,
  exercises: [],
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
  
  clearNewPR: () => set({ newPR: null }),
  
  setPreferredUnit: (unit: WeightUnit) => {
    setStoredUnit(unit);
    set({ preferredUnit: unit });
  },
  
  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
    get().fetchWorkoutByDate(date);
  },
  
  fetchWorkoutByDate: async (date: Date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const { data: workout } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .eq('is_completed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (workout) {
      const { data: exercisesData } = await supabase
        .from('workout_exercises')
        .select('*, sets:exercise_sets(*)')
        .eq('workout_id', workout.id)
        .order('order_index');
      
      const exercises = (exercisesData || []).map(e => ({
        ...e,
        exercise_type: (e.exercise_type as 'strength' | 'conditioning') || 'strength',
        sets: e.sets?.sort((a: ExerciseSet, b: ExerciseSet) => a.set_number - b.set_number) || []
      })) as WorkoutExercise[];
      
      set({ viewingWorkout: workout, viewingExercises: exercises });
    } else {
      set({ viewingWorkout: null, viewingExercises: [] });
    }
  },
  
  startWorkout: async (name: string, date?: Date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
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
      // Add a default empty conditioning set
      const { data: firstSet } = await supabase
        .from('conditioning_sets')
        .insert({
          exercise_id: exercise.id,
          set_number: 1,
        })
        .select()
        .single();
      
      const newExercise: WorkoutExercise = { 
        ...exercise, 
        exercise_type: 'conditioning',
        conditioning_sets: firstSet ? [{...firstSet, distance_unit: (firstSet.distance_unit as 'miles' | 'km' | 'meters') || 'miles'}] : [],
        sets: []
      };
      set({ exercises: [...exercises, newExercise] });
    } else {
      // Add a default empty strength set
      const { data: firstSet } = await supabase
        .from('exercise_sets')
        .insert({
          exercise_id: exercise.id,
          set_number: 1,
        })
        .select()
        .single();
      
      const newExercise: WorkoutExercise = { 
        ...exercise, 
        exercise_type: 'strength',
        sets: firstSet ? [firstSet] : [],
        conditioning_sets: []
      };
      set({ exercises: [...exercises, newExercise] });
    }
  },
  
  removeExercise: async (exerciseId: string) => {
    const { exercises } = get();
    
    await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);
    
    set({ exercises: exercises.filter(e => e.id !== exerciseId) });
  },
  
  addSet: async (exerciseId: string) => {
    const { exercises } = get();
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    
    const newSetNumber = (exercise.sets?.length || 0) + 1;
    
    const { data: newSet, error } = await supabase
      .from('exercise_sets')
      .insert({
        exercise_id: exerciseId,
        set_number: newSetNumber,
      })
      .select()
      .single();
    
    if (error || !newSet) return;
    
    set({
      exercises: exercises.map(e => 
        e.id === exerciseId 
          ? { ...e, sets: [...(e.sets || []), newSet] }
          : e
      )
    });
  },
  
  removeSet: async (setId: string) => {
    const { exercises } = get();
    
    await supabase
      .from('exercise_sets')
      .delete()
      .eq('id', setId);
    
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
      .insert({
        exercise_id: exerciseId,
        set_number: newSetNumber,
      })
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
    
    await supabase
      .from('conditioning_sets')
      .delete()
      .eq('id', setId);
    
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
    
    // Save to DB
    supabase
      .from('conditioning_sets')
      .update(data)
      .eq('id', setId)
      .then(() => {});
  },
  
  completeConditioningSet: async (setId: string) => {
    const { exercises } = get();
    
    await supabase
      .from('conditioning_sets')
      .update({ is_completed: true })
      .eq('id', setId);
    
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
    
    // Debounced save to DB
    supabase
      .from('exercise_sets')
      .update(data)
      .eq('id', setId)
      .then(() => {});
  },
  
  completeSet: async (setId: string, exerciseName: string, weight: number, reps: number, rir?: number | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !weight) return false;
    
    const { exercises, activeWorkout, personalRecords } = get();
    
    // Update the set as completed
    const updateData: any = { is_completed: true, weight, reps };
    if (rir !== undefined) updateData.rir = rir;
    
    await supabase
      .from('exercise_sets')
      .update(updateData)
      .eq('id', setId);
    
    // Update local state
    set({
      exercises: exercises.map(e => ({
        ...e,
        sets: e.sets?.map(s => 
          s.id === setId ? { ...s, is_completed: true, weight, reps, rir: rir ?? s.rir } : s
        )
      }))
    });
    
    // Check for PR
    const normalizedName = exerciseName.toLowerCase();
    const currentPR = personalRecords.find(pr => pr.exercise_name === normalizedName);
    
    if (!currentPR || weight > currentPR.max_weight) {
      // New PR!
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
        }, {
          onConflict: 'user_id,exercise_name',
        })
        .select()
        .single();
      
      if (newPR) {
        set({ 
          personalRecords: currentPR 
            ? personalRecords.map(pr => pr.exercise_name === normalizedName ? newPR : pr)
            : [...personalRecords, newPR],
          newPR: { exerciseName, weight }
        });

        // Sync with goals
        import('@/stores/goalStore').then(({ useGoalStore }) => {
          useGoalStore.getState().syncGoalsAfterPR(exerciseName, weight);
        });

        return true;
      }
    }
    
    return false;
  },
  
  loadLastSession: async (exerciseId: string, exerciseName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const lastSets = await get().getLastSessionSets(exerciseName);
    if (lastSets.length === 0) return;
    
    const { exercises } = get();
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    
    // Delete existing sets
    await supabase
      .from('exercise_sets')
      .delete()
      .eq('exercise_id', exerciseId);
    
    // Create new sets based on last session
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
          e.id === exerciseId ? { ...e, sets: newSets } : e
        )
      });
    }
  },
  
  finishWorkout: async () => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    
    set({ isSaving: true });
    
    await supabase
      .from('workouts')
      .update({ is_completed: true })
      .eq('id', activeWorkout.id);
    
    set({ activeWorkout: null, exercises: [], isSaving: false });
  },

  editWorkout: async (workoutId: string) => {
    set({ isLoading: true });

    // Mark workout as not completed so it becomes editable
    await supabase
      .from('workouts')
      .update({ is_completed: false })
      .eq('id', workoutId);

    // Fetch the workout
    const { data: workout } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (!workout) {
      set({ isLoading: false });
      return;
    }

    // Fetch exercises with sets and conditioning sets
    const { data: exercisesData } = await supabase
      .from('workout_exercises')
      .select('*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)')
      .eq('workout_id', workoutId)
      .order('order_index');

    const exercises = (exercisesData || []).map(e => ({
      ...e,
      exercise_type: (e.exercise_type as 'strength' | 'conditioning') || 'strength',
      sets: e.sets?.sort((a: ExerciseSet, b: ExerciseSet) => a.set_number - b.set_number) || [],
      conditioning_sets: (e.conditioning_sets || []).map((cs: any) => ({
        ...cs,
        distance_unit: (cs.distance_unit as 'miles' | 'km' | 'meters') || 'miles'
      })).sort((a: ConditioningSet, b: ConditioningSet) => a.set_number - b.set_number),
    })) as WorkoutExercise[];

    set({
      activeWorkout: workout,
      exercises,
      viewingWorkout: null,
      viewingExercises: [],
      selectedDate: new Date(),
      isLoading: false,
    });
  },
  
  cancelWorkout: async () => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    
    await supabase
      .from('workouts')
      .delete()
      .eq('id', activeWorkout.id);
    
    set({ activeWorkout: null, exercises: [] });
  },
  
  fetchActiveWorkout: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    set({ isLoading: true });
    
    const today = format(new Date(), 'yyyy-MM-dd');

    // Find any incomplete workout
    const { data: workout } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (workout) {
      // Auto-abandon stale workouts from past dates, but ONLY for free-log sessions.
      // Program sessions (name contains "—") must never be auto-abandoned so retroactive
      // logging works correctly.
      const isProgramSession = workout.workout_name.includes('—');
      if (workout.date < today && !isProgramSession) {
        await supabase
          .from('workouts')
          .update({ is_completed: true })
          .eq('id', workout.id);
        set({ activeWorkout: null, exercises: [], isLoading: false });
        return;
      }

      // Fetch exercises with sets
      const { data: exercisesData } = await supabase
        .from('workout_exercises')
        .select('*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)')
        .eq('workout_id', workout.id)
        .order('order_index');
      
      const exercises = (exercisesData || []).map(e => ({
        ...e,
        exercise_type: (e.exercise_type as 'strength' | 'conditioning') || 'strength',
        sets: e.sets?.sort((a: ExerciseSet, b: ExerciseSet) => a.set_number - b.set_number) || [],
        conditioning_sets: (e.conditioning_sets || []).map((cs: any) => ({
          ...cs,
          distance_unit: (cs.distance_unit as 'miles' | 'km' | 'meters') || 'miles'
        })).sort((a: ConditioningSet, b: ConditioningSet) => a.set_number - b.set_number),
      })) as WorkoutExercise[];
      
      set({ activeWorkout: workout, exercises, isLoading: false });
    } else {
      set({ activeWorkout: null, exercises: [], isLoading: false });
    }
  },

  // Load a specific workout by ID into active state (used by program sessions)
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

    const exercises = (exercisesData || []).map(e => ({
      ...e,
      exercise_type: (e.exercise_type as 'strength' | 'conditioning') || 'strength',
      sets: e.sets?.sort((a: ExerciseSet, b: ExerciseSet) => a.set_number - b.set_number) || [],
      conditioning_sets: (e.conditioning_sets || []).map((cs: any) => ({
        ...cs,
        distance_unit: (cs.distance_unit as 'miles' | 'km' | 'meters') || 'miles'
      })).sort((a: ConditioningSet, b: ConditioningSet) => a.set_number - b.set_number),
    })) as WorkoutExercise[];

    set({ activeWorkout: workout, exercises, viewingWorkout: null, viewingExercises: [] });
  },
  
  fetchWorkoutHistory: async (days = 30) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: records } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', user.id)
      .order('max_weight', { ascending: false });
    
    set({ personalRecords: records || [] });
  },
  
  fetchExerciseHistory: async (exerciseName: string): Promise<ExerciseHistory[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const normalizedName = exerciseName.toLowerCase();
    
    // Get workouts that contain this exercise
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
    
    // Filter by user and aggregate by date
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const fromDate = format(subDays(new Date(), weeks * 7), 'yyyy-MM-dd');
    
    const { data: workouts } = await supabase
      .from('workouts')
      .select('date, total_volume')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('date', fromDate);
    
    if (!workouts) return [];
    
    // Aggregate by week
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const fromDate = format(subDays(new Date(), weeks * 7), 'yyyy-MM-dd');
    const futureDate = format(addDays(new Date(), weeks * 7), 'yyyy-MM-dd');

    // 1. Free-log completed workouts
    const { data: workouts } = await supabase
      .from('workouts')
      .select('date')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('date', fromDate);

    // 2. Program calendar workouts (past AND future scheduled) — active enrollments only
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const normalizedName = exerciseName.toLowerCase();
    
    // Find the most recent workout with this exercise
    const { data: lastExercise } = await supabase
      .from('workout_exercises')
      .select(`
        id,
        workout:workouts!inner(id, date, user_id, is_completed),
        sets:exercise_sets(weight, reps, set_number, is_completed)
      `)
      .ilike('exercise_name', normalizedName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!lastExercise) return [];
    
    const workout = lastExercise.workout as unknown as { user_id: string; is_completed: boolean };
    if (workout.user_id !== user.id || !workout.is_completed) return [];
    
    return (lastExercise.sets || [])
      .filter((s: any) => s.is_completed && s.weight)
      .sort((a: any, b: any) => a.set_number - b.set_number)
      .map((s: any) => ({ weight: s.weight, reps: s.reps }));
  },
}));
