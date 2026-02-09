import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { 
  Workout, 
  WorkoutExercise, 
  ExerciseSet, 
  PersonalRecord,
  ExerciseHistory,
  WeeklyVolume,
  WorkoutDay
} from '@/types/workout';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface WorkoutState {
  // Current workout session
  activeWorkout: Workout | null;
  exercises: WorkoutExercise[];
  
  // History and records
  recentWorkouts: Workout[];
  personalRecords: PersonalRecord[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // New PR celebration
  newPR: { exerciseName: string; weight: number } | null;
  clearNewPR: () => void;
  
  // Workout session actions
  startWorkout: (name: string) => Promise<void>;
  addExercise: (name: string) => Promise<void>;
  removeExercise: (exerciseId: string) => Promise<void>;
  addSet: (exerciseId: string) => Promise<void>;
  removeSet: (setId: string) => Promise<void>;
  updateSet: (setId: string, data: Partial<ExerciseSet>) => void;
  completeSet: (setId: string, exerciseName: string, weight: number, reps: number) => Promise<boolean>;
  loadLastSession: (exerciseId: string, exerciseName: string) => Promise<void>;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => Promise<void>;
  
  // Fetching
  fetchActiveWorkout: () => Promise<void>;
  fetchWorkoutHistory: (days?: number) => Promise<void>;
  fetchPersonalRecords: () => Promise<void>;
  fetchExerciseHistory: (exerciseName: string) => Promise<ExerciseHistory[]>;
  fetchWeeklyVolume: (weeks?: number) => Promise<WeeklyVolume[]>;
  fetchWorkoutDays: (weeks?: number) => Promise<WorkoutDay[]>;
  getLastSessionSets: (exerciseName: string) => Promise<{ weight: number; reps: number }[]>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: null,
  exercises: [],
  recentWorkouts: [],
  personalRecords: [],
  isLoading: false,
  isSaving: false,
  newPR: null,
  
  clearNewPR: () => set({ newPR: null }),
  
  startWorkout: async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    set({ isSaving: true });
    
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        workout_name: name,
        date: format(new Date(), 'yyyy-MM-dd'),
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
    
    const { data: exercise, error } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: activeWorkout.id,
        exercise_name: name,
        order_index: exercises.length,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding exercise:', error);
      return;
    }
    
    // Add a default empty set
    const { data: firstSet } = await supabase
      .from('exercise_sets')
      .insert({
        exercise_id: exercise.id,
        set_number: 1,
      })
      .select()
      .single();
    
    set({ 
      exercises: [...exercises, { ...exercise, sets: firstSet ? [firstSet] : [] }] 
    });
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
  
  completeSet: async (setId: string, exerciseName: string, weight: number, reps: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !weight) return false;
    
    const { exercises, activeWorkout, personalRecords } = get();
    
    // Update the set as completed
    await supabase
      .from('exercise_sets')
      .update({ is_completed: true, weight, reps })
      .eq('id', setId);
    
    // Update local state
    set({
      exercises: exercises.map(e => ({
        ...e,
        sets: e.sets?.map(s => 
          s.id === setId ? { ...s, is_completed: true, weight, reps } : s
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
    
    // Find any incomplete workout from today
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: workout } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (workout) {
      // Fetch exercises with sets
      const { data: exercisesData } = await supabase
        .from('workout_exercises')
        .select('*, sets:exercise_sets(*)')
        .eq('workout_id', workout.id)
        .order('order_index');
      
      const exercises = (exercisesData || []).map(e => ({
        ...e,
        sets: e.sets?.sort((a: ExerciseSet, b: ExerciseSet) => a.set_number - b.set_number) || []
      }));
      
      set({ activeWorkout: workout, exercises, isLoading: false });
    } else {
      set({ activeWorkout: null, exercises: [], isLoading: false });
    }
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
    
    const { data: workouts } = await supabase
      .from('workouts')
      .select('date')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('date', fromDate);
    
    if (!workouts) return [];
    
    // Count workouts per day
    const dayMap = new Map<string, number>();
    for (const w of workouts) {
      const count = dayMap.get(w.date) || 0;
      dayMap.set(w.date, count + 1);
    }
    
    return Array.from(dayMap.entries()).map(([date, workout_count]) => ({
      date,
      workout_count,
    }));
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
