export interface Workout {
  id: string;
  user_id: string;
  date: string;
  workout_name: string;
  total_volume: number;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  order_index: number;
  notes: string | null;
  created_at: string;
  sets?: ExerciseSet[];
}

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  is_completed: boolean;
  created_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  max_weight: number;
  max_reps: number | null;
  workout_id: string | null;
  set_id: string | null;
  achieved_at: string;
  created_at: string;
}

export interface ExerciseHistory {
  date: string;
  max_weight: number;
  total_volume: number;
  sets: {
    weight: number;
    reps: number;
  }[];
}

export interface WeeklyVolume {
  week_start: string;
  week_label: string;
  total_volume: number;
}

export interface WorkoutDay {
  date: string;
  workout_count: number;
}

// Common exercises for autocomplete
export const COMMON_EXERCISES = [
  "Back Squat",
  "Front Squat",
  "Deadlift",
  "Romanian Deadlift",
  "Bench Press",
  "Incline Bench Press",
  "Overhead Press",
  "Push Press",
  "Barbell Row",
  "Pull-up",
  "Chin-up",
  "Lat Pulldown",
  "Dumbbell Row",
  "Lunges",
  "Leg Press",
  "Leg Curl",
  "Leg Extension",
  "Hip Thrust",
  "Cable Fly",
  "Tricep Pushdown",
  "Bicep Curl",
  "Hammer Curl",
  "Face Pull",
  "Lateral Raise",
  "Shrug",
  "Calf Raise",
  "Plank",
  "Russian Twist",
];
