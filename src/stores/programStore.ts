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
}

// Build calendar dates for all program workouts
function buildCalendarDates(
  programWorkouts: { id: string }[],
  startDate: Date,
  trainingDays: number[] // 0=Sun...6=Sat
): { program_workout_id: string; scheduled_date: string }[] {
  const sortedDays = [...trainingDays].sort((a, b) => a - b);
  const result: { program_workout_id: string; scheduled_date: string }[] = [];

  let currentDate = new Date(startDate);

  for (let i = 0; i < programWorkouts.length; i++) {
    const targetDayOfWeek = sortedDays[i % sortedDays.length];

    // If this is not the first iteration of a week cycle, advance past current date
    if (i > 0 && i % sortedDays.length === 0) {
      // Move to next week's cycle start
      currentDate = addDays(currentDate, 1);
    }

    // Find next occurrence of targetDayOfWeek from currentDate
    let daysToAdd = (targetDayOfWeek - currentDate.getDay() + 7) % 7;
    if (i === 0 && daysToAdd === 0) daysToAdd = 0; // start today if same day
    else if (i > 0 && daysToAdd === 0 && i % sortedDays.length !== 0) daysToAdd = 7; // avoid same day repeat

    // For sequential days within same week, just advance to next training day
    if (i % sortedDays.length !== 0) {
      const prevDayOfWeek = sortedDays[(i - 1) % sortedDays.length];
      const nextDayOfWeek = sortedDays[i % sortedDays.length];
      let diff = (nextDayOfWeek - prevDayOfWeek + 7) % 7;
      if (diff === 0) diff = 7;
      currentDate = addDays(currentDate, diff);
    } else if (i === 0) {
      // Start on or after startDate on the first training day
      daysToAdd = (targetDayOfWeek - currentDate.getDay() + 7) % 7;
      currentDate = addDays(currentDate, daysToAdd);
    } else {
      // Beginning of a new week cycle - advance from last date to next week's first training day
      const prevDayOfWeek = sortedDays[sortedDays.length - 1];
      const nextDayOfWeek = sortedDays[0];
      let diff = (nextDayOfWeek - prevDayOfWeek + 7) % 7;
      if (diff === 0) diff = 7;
      currentDate = addDays(currentDate, diff);
    }

    result.push({
      program_workout_id: programWorkouts[i].id,
      scheduled_date: format(currentDate, 'yyyy-MM-dd'),
    });
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
    const { data, error } = await supabase
      .from('user_program_enrollments')
      .select('*, program:programs(*)')
      .eq('status', 'active');
    if (!error && data) {
      set({ enrollments: data as UserProgramEnrollment[] });
      // Auto-select first active program
      if (data.length > 0 && !get().activeProgramId) {
        set({ activeProgramId: data[0].program_id });
      }
    }
  },

  fetchTodaysWorkouts: async () => {
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
      set({ todaysWorkouts: data as unknown as UserCalendarWorkout[] });
    }
  },

  enrollInProgram: async (programId, startDate, trainingDays, addonPlacement) => {
    set({ isEnrolling: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Insert enrollment
      const { data: enrollment, error: enrollError } = await supabase
        .from('user_program_enrollments')
        .insert({
          user_id: user.id,
          program_id: programId,
          start_date: format(startDate, 'yyyy-MM-dd'),
          training_days: trainingDays,
          status: 'active',
          addon_placement: addonPlacement || null,
        })
        .select()
        .single();

      if (enrollError) throw enrollError;

      // 2. Fetch program workouts (all weeks, sorted)
      const { data: programWorkouts, error: pwError } = await supabase
        .from('program_workouts')
        .select('id, week_number, day_number')
        .eq('program_id', programId)
        .order('week_number')
        .order('day_number');

      if (pwError) throw pwError;
      if (!programWorkouts || programWorkouts.length === 0) return;

      // 3. Build calendar dates
      const calendarDates = buildCalendarDates(programWorkouts, startDate, trainingDays);

      // 4. Batch insert calendar workouts
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

      // 5. Refresh state
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
      await get().fetchEnrollments();
      await get().fetchTodaysWorkouts();
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
}));
