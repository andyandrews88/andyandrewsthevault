import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, parseISO } from 'date-fns';

export interface Program {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  duration_weeks: number;
  days_per_week: number;
  difficulty: string;
  program_style: string | null;
  is_active: boolean;
  created_at: string;
  video_url?: string | null;
}

export interface ProgramWorkout {
  id: string;
  program_id: string;
  week_number: number;
  day_number: number;
  workout_name: string;
  exercises: ProgramExercise[];
  notes: string | null;
}

export interface ProgramExercise {
  name: string;
  sets: number;
  reps: string;
  percentage_of_1rm?: string;
  tempo?: string;
  notes?: string;
  rest_seconds?: number;
  video_url?: string;
}

export interface UserProgramEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  start_date: string;
  training_days: number[];
  status: string;
  addon_placement: string | null;
  created_at: string;
  program?: Program;
}

export interface UserCalendarWorkout {
  id: string;
  user_id: string;
  enrollment_id: string;
  program_workout_id: string;
  scheduled_date: string;
  is_completed: boolean;
  completed_at: string | null;
  program_workout?: ProgramWorkout;
  enrollment?: UserProgramEnrollment;
}

interface ProgramState {
  programs: Program[];
  enrollments: UserProgramEnrollment[];
  calendarWorkouts: UserCalendarWorkout[];
  todaysWorkouts: UserCalendarWorkout[];
  activeProgramId: string | null;
  isLoading: boolean;
  isEnrolling: boolean;
  isStartingSession: boolean;
  enrollmentsFetchedAt: number | null;
  todaysFetchedAt: number | null;

  fetchPrograms: () => Promise<void>;
  fetchEnrollments: () => Promise<void>;
  fetchTodaysWorkouts: () => Promise<void>;
  enrollInProgram: (
    programId: string,
    startDate: Date,
    trainingDays: number[],
    addonPlacement?: string
  ) => Promise<void>;
  unenrollFromProgram: (enrollmentId: string) => Promise<void>;
  markWorkoutComplete: (calendarWorkoutId: string) => Promise<void>;
  setActiveProgram: (programId: string | null) => void;
  startProgramWorkoutSession: (
    calendarWorkout: UserCalendarWorkout,
    date: Date
  ) => Promise<string | null>;
}

// Build calendar dates for all program workouts
// Walk forward from startDate, placing each workout on the
// nearest upcoming training day. cursor advances by 1 after each placement
// so workouts never stack on the same day.
function buildCalendarDates(
  programWorkouts: { id: string }[],
  startDate: Date,
  trainingDays: number[] // 0=Sun...6=Sat
): { program_workout_id: string; scheduled_date: string }[] {
  const sortedDays = [...trainingDays].sort((a, b) => a - b);
  const result: { program_workout_id: string; scheduled_date: string }[] = [];

  let cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  for (const pw of programWorkouts) {
    // Walk forward from cursor until we land on a training day
    let date = new Date(cursor);
    while (!sortedDays.includes(date.getDay())) {
      date = addDays(date, 1);
    }
    result.push({
      program_workout_id: pw.id,
      scheduled_date: format(date, 'yyyy-MM-dd'),
    });
    // Advance cursor past this date so next workout must be on a later day
    cursor = addDays(date, 1);
  }

  return result;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  enrollments: [],
  calendarWorkouts: [],
  todaysWorkouts: [],
  activeProgramId: null,
  isLoading: false,
  isEnrolling: false,
  isStartingSession: false,
  enrollmentsFetchedAt: null,
  todaysFetchedAt: null,

  fetchPrograms: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('created_at');
    if (!error && data) {
      set({ programs: data as Program[] });
    }
    set({ isLoading: false });
  },

  fetchEnrollments: async () => {
    // Guard: skip if fetched within the last 30 seconds
    const { enrollmentsFetchedAt } = get();
    if (enrollmentsFetchedAt && Date.now() - enrollmentsFetchedAt < 30_000) return;

    const { data, error } = await supabase
      .from('user_program_enrollments')
      .select('*, program:programs(*)')
      .eq('status', 'active');
    if (!error && data) {
      set({ enrollments: data as UserProgramEnrollment[], enrollmentsFetchedAt: Date.now() });
      // Validate activeProgramId against the current active list
      const currentActive = get().activeProgramId;
      const activeIds = data.map(e => e.program_id);
      if (!currentActive || !activeIds.includes(currentActive)) {
        set({ activeProgramId: data.length > 0 ? data[0].program_id : null });
      }
    }
  },

  fetchTodaysWorkouts: async () => {
    // Guard: skip if fetched within the last 30 seconds
    const { todaysFetchedAt } = get();
    if (todaysFetchedAt && Date.now() - todaysFetchedAt < 30_000) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('user_calendar_workouts')
      .select(`
        *,
        program_workout:program_workouts(*),
        enrollment:user_program_enrollments(*, program:programs(*))
      `)
      .eq('scheduled_date', today);
    if (!error && data) {
      set({ todaysWorkouts: data as unknown as UserCalendarWorkout[], todaysFetchedAt: Date.now() });
    }
  },

  enrollInProgram: async (programId, startDate, trainingDays, addonPlacement) => {
    set({ isEnrolling: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. UPSERT enrollment — handles both new enrollment and re-enrollment after cancellation
      const { data: enrollment, error: enrollError } = await supabase
        .from('user_program_enrollments')
        .upsert(
          {
            user_id: user.id,
            program_id: programId,
            start_date: format(startDate, 'yyyy-MM-dd'),
            training_days: trainingDays,
            status: 'active',
            addon_placement: addonPlacement || null,
          },
          { onConflict: 'user_id,program_id' }
        )
        .select()
        .single();

      if (enrollError) throw enrollError;

      // 2. Delete old calendar workouts for this enrollment so we get a fresh schedule
      await supabase
        .from('user_calendar_workouts')
        .delete()
        .eq('enrollment_id', enrollment.id);

      // 3. Fetch program workouts (all weeks, sorted)
      const { data: programWorkouts, error: pwError } = await supabase
        .from('program_workouts')
        .select('id, week_number, day_number')
        .eq('program_id', programId)
        .order('week_number')
        .order('day_number');

      if (pwError) throw pwError;
      if (!programWorkouts || programWorkouts.length === 0) return;

      // 4. Build calendar dates
      const calendarDates = buildCalendarDates(programWorkouts, startDate, trainingDays);

      // 5. Batch insert fresh calendar workouts
      const insertRows = calendarDates.map(({ program_workout_id, scheduled_date }) => ({
        user_id: user.id,
        enrollment_id: enrollment.id,
        program_workout_id,
        scheduled_date,
        is_completed: false,
      }));

      const { error: calError } = await supabase
        .from('user_calendar_workouts')
        .insert(insertRows);

      if (calError) throw calError;

      // 6. Refresh state
      await get().fetchEnrollments();
      await get().fetchTodaysWorkouts();
      set({ activeProgramId: programId });
    } finally {
      set({ isEnrolling: false });
    }
  },

  unenrollFromProgram: async (enrollmentId) => {
    const { error } = await supabase
      .from('user_program_enrollments')
      .update({ status: 'cancelled' })
      .eq('id', enrollmentId);
    if (!error) {
      // Delete future incomplete calendar workouts so they no longer show on the calendar
      const today = format(new Date(), 'yyyy-MM-dd');
      await supabase
        .from('user_calendar_workouts')
        .delete()
        .eq('enrollment_id', enrollmentId)
        .eq('is_completed', false)
        .gte('scheduled_date', today);

      // Force a fresh fetch by clearing the cache timestamp
      set({ enrollmentsFetchedAt: null, todaysFetchedAt: null });
      await get().fetchEnrollments();
      await get().fetchTodaysWorkouts();

      // Reset activeProgramId to next available enrollment or null
      const remaining = get().enrollments;
      set({ activeProgramId: remaining.length > 0 ? remaining[0].program_id : null });
    }
  },

  markWorkoutComplete: async (calendarWorkoutId) => {
    const { error } = await supabase
      .from('user_calendar_workouts')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', calendarWorkoutId);
    if (!error) {
      set(state => ({
        todaysWorkouts: state.todaysWorkouts.map(w =>
          w.id === calendarWorkoutId ? { ...w, is_completed: true } : w
        ),
      }));
    }
  },

  setActiveProgram: (programId) => set({ activeProgramId: programId }),

  /**
   * Creates (or finds) a linked `workouts` row for this program session,
   * pre-populates exercises & sets from the template, then returns the workoutId
   * so WorkoutLogger's fetchActiveWorkout() can take over the UI.
   */
  startProgramWorkoutSession: async (calendarWorkout, date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    set({ isStartingSession: true });
    try {
      const programWorkout = calendarWorkout.program_workout;
      const programName = (calendarWorkout as any).enrollment?.program?.name || 'Program';
      if (!programWorkout) return null;

      const workoutName = `${programName} — ${programWorkout.workout_name}`;
      const dateStr = format(date, 'yyyy-MM-dd');

      // 1. Check if a linked workout already exists for this date+name (idempotent)
      const { data: existing } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .eq('workout_name', workoutName)
        .eq('is_completed', false)
        .maybeSingle();

      if (existing) {
        // Already started — just return the id so WorkoutLogger picks it up
        return existing.id;
      }

      // 2. Create the workouts row
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          workout_name: workoutName,
          date: dateStr,
          is_completed: false,
        })
        .select()
        .single();

      if (workoutError || !workout) {
        console.error('Error creating program workout:', workoutError);
        return null;
      }

      // 3. Pre-populate workout_exercises + exercise_sets from template
      const exercises: ProgramExercise[] = Array.isArray(programWorkout.exercises)
        ? programWorkout.exercises
        : [];

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];

        const { data: workoutExercise, error: exError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workout.id,
            exercise_name: ex.name,
            order_index: i,
            exercise_type: 'strength',
            // Encode percentage hint in notes so it's available in the logger
            notes: [ex.notes, ex.percentage_of_1rm ? `@ ${ex.percentage_of_1rm}% TM` : null]
              .filter(Boolean).join(' | ') || null,
          })
          .select()
          .single();

        if (exError || !workoutExercise) continue;

        // Pre-populate sets based on template sets count, with reps from template
        const targetSets = ex.sets || 1;
        // Parse reps: "5/3/1+" → use last variant, "3-5" → use first number, "5" → 5
        const parseReps = (repsStr: string): number => {
          const parts = repsStr.split(/[/,]/);
          const last = parts[parts.length - 1].replace(/\+/g, '').trim();
          const num = parseInt(last, 10);
          return isNaN(num) ? 5 : num;
        };
        const targetReps = parseReps(ex.reps);

        const setsToInsert = Array.from({ length: targetSets }, (_, idx) => ({
          exercise_id: workoutExercise.id,
          set_number: idx + 1,
          reps: targetReps,
          is_completed: false,
        }));

        await supabase.from('exercise_sets').insert(setsToInsert);
      }

      return workout.id;
    } finally {
      set({ isStartingSession: false });
    }
  },
}));
