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
// Algorithm: walk forward from startDate, placing each workout on the
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
