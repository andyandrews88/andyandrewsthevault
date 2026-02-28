import { WeightUnit } from "@/lib/weightConversion";

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
  exercise_type: 'strength' | 'conditioning';
  superset_group: string | null;
  created_at: string;
  sets?: ExerciseSet[];
  conditioning_sets?: ConditioningSet[];
}

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  rir: number | null;
  duration_seconds: number | null;
  set_type: 'warmup' | 'working';
  side: 'left' | 'right' | null;
  is_completed: boolean;
  created_at: string;
}

export interface ConditioningSet {
  id: string;
  exercise_id: string;
  set_number: number;
  duration_seconds: number | null;
  distance: number | null;
  distance_unit: 'miles' | 'km' | 'meters';
  calories: number | null;
  avg_heart_rate: number | null;
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

// Exercise Categories
export const EXERCISE_CATEGORIES = {
  chest: [
    "Bench Press (Barbell)",
    "Bench Press (Dumbbell)",
    "Incline Bench Press (Barbell)",
    "Incline Bench Press (Dumbbell)",
    "Decline Bench Press",
    "Close-Grip Bench Press",
    "Floor Press",
    "Push-Up",
    "Diamond Push-Up",
    "Wide Push-Up",
    "Decline Push-Up",
    "Incline Push-Up",
    "Chest Fly (Dumbbell)",
    "Chest Fly (Cable)",
    "Pec Deck",
    "Machine Chest Press",
    "Svend Press",
    "Landmine Press",
    "Dips (Chest Focus)",
    "Plate Press"
  ],
  back: [
    "Deadlift (Conventional)",
    "Deadlift (Sumo)",
    "Romanian Deadlift",
    "Stiff-Leg Deadlift",
    "Deficit Deadlift",
    "Rack Pull",
    "Pull-Up",
    "Chin-Up",
    "Neutral-Grip Pull-Up",
    "Lat Pulldown (Wide)",
    "Lat Pulldown (Close)",
    "Lat Pulldown (Reverse Grip)",
    "Barbell Row (Overhand)",
    "Barbell Row (Underhand)",
    "Pendlay Row",
    "Dumbbell Row (Single-Arm)",
    "Dumbbell Row (Two-Arm)",
    "Cable Row (Seated)",
    "Cable Row (Standing)",
    "T-Bar Row",
    "Meadows Row",
    "Chest-Supported Row",
    "Seal Row",
    "Inverted Row",
    "Face Pull",
    "Straight-Arm Pulldown",
    "Shrug (Barbell)",
    "Shrug (Dumbbell)",
    "Shrug (Trap Bar)",
    "Rack Deadlift",
    "Good Morning",
    "Back Extension",
    "Hyperextension",
    "Reverse Hyperextension"
  ],
  shoulders: [
    "Overhead Press (Barbell)",
    "Overhead Press (Dumbbell)",
    "Push Press",
    "Seated Dumbbell Press",
    "Arnold Press",
    "Behind-the-Neck Press",
    "Z Press",
    "Landmine Press (Shoulder)",
    "Machine Shoulder Press",
    "Lateral Raise (Dumbbell)",
    "Lateral Raise (Cable)",
    "Lateral Raise (Machine)",
    "Front Raise (Dumbbell)",
    "Front Raise (Barbell)",
    "Front Raise (Cable)",
    "Rear Delt Fly (Dumbbell)",
    "Rear Delt Fly (Cable)",
    "Rear Delt Fly (Machine)",
    "Upright Row",
    "Cable Upright Row",
    "Lu Raise",
    "Bus Driver",
    "Bradford Press",
    "Plate Front Raise",
    "Face Pull (Shoulder Focus)",
    "External Rotation",
    "Internal Rotation",
    "Y-T-W Raises"
  ],
  quadriceps: [
    "Back Squat (High Bar)",
    "Back Squat (Low Bar)",
    "Front Squat",
    "Goblet Squat",
    "Zercher Squat",
    "Hack Squat",
    "Safety Bar Squat",
    "Box Squat",
    "Pause Squat",
    "Anderson Squat",
    "Leg Press",
    "Leg Press (Single-Leg)",
    "Leg Extension",
    "Bulgarian Split Squat",
    "Walking Lunge",
    "Reverse Lunge",
    "Forward Lunge",
    "Lateral Lunge",
    "Step-Up",
    "Box Step-Up",
    "Pistol Squat",
    "Sissy Squat",
    "Wall Sit",
    "Cyclist Squat",
    "Heel-Elevated Squat"
  ],
  hamstrings_glutes: [
    "Romanian Deadlift (Barbell)",
    "Romanian Deadlift (Dumbbell)",
    "Single-Leg Romanian Deadlift",
    "Stiff-Leg Deadlift",
    "Leg Curl (Lying)",
    "Leg Curl (Seated)",
    "Leg Curl (Standing)",
    "Nordic Curl",
    "Glute-Ham Raise",
    "Hip Thrust (Barbell)",
    "Hip Thrust (Dumbbell)",
    "Hip Thrust (Single-Leg)",
    "Hip Thrust (Banded)",
    "Glute Bridge",
    "Single-Leg Glute Bridge",
    "Cable Pull-Through",
    "Kettlebell Swing",
    "Sumo Deadlift",
    "Trap Bar Deadlift",
    "Hip Abduction (Machine)",
    "Hip Adduction (Machine)",
    "Cable Hip Abduction",
    "Cable Kickback",
    "Donkey Kick",
    "Fire Hydrant",
    "Clamshell"
  ],
  calves: [
    "Standing Calf Raise (Machine)",
    "Standing Calf Raise (Smith)",
    "Standing Calf Raise (Dumbbell)",
    "Seated Calf Raise",
    "Leg Press Calf Raise",
    "Donkey Calf Raise",
    "Single-Leg Calf Raise",
    "Tibialis Raise"
  ],
  biceps: [
    "Barbell Curl",
    "EZ Bar Curl",
    "Dumbbell Curl (Standing)",
    "Dumbbell Curl (Seated)",
    "Dumbbell Curl (Incline)",
    "Hammer Curl",
    "Cable Curl",
    "Preacher Curl (Barbell)",
    "Preacher Curl (Dumbbell)",
    "Preacher Curl (EZ Bar)",
    "Spider Curl",
    "Concentration Curl",
    "Drag Curl",
    "21s (Barbell Curl)",
    "Cross-Body Hammer Curl",
    "Cable Hammer Curl",
    "Reverse Curl",
    "Zottman Curl",
    "Machine Bicep Curl"
  ],
  triceps: [
    "Close-Grip Bench Press",
    "Tricep Pushdown (Rope)",
    "Tricep Pushdown (Bar)",
    "Tricep Pushdown (V-Bar)",
    "Overhead Tricep Extension (Cable)",
    "Overhead Tricep Extension (Dumbbell)",
    "Overhead Tricep Extension (EZ Bar)",
    "Skull Crusher (Barbell)",
    "Skull Crusher (Dumbbell)",
    "Skull Crusher (EZ Bar)",
    "Tricep Kickback",
    "Diamond Push-Up",
    "Bench Dip",
    "Parallel Bar Dip",
    "JM Press",
    "Tate Press",
    "French Press",
    "Cable Tricep Kickback"
  ],
  core: [
    "Plank",
    "Side Plank",
    "Plank (Weighted)",
    "Dead Bug",
    "Bird Dog",
    "Hollow Body Hold",
    "Crunch",
    "Bicycle Crunch",
    "V-Up",
    "Sit-Up",
    "Decline Sit-Up",
    "Russian Twist",
    "Russian Twist (Weighted)",
    "Cable Crunch",
    "Ab Rollout",
    "Ab Wheel",
    "Hanging Leg Raise",
    "Hanging Knee Raise",
    "Captain's Chair Leg Raise",
    "Toe Touch",
    "Heel Touch",
    "Mountain Climber",
    "Flutter Kick",
    "Pallof Press",
    "Woodchop (Cable)",
    "Woodchop (Dumbbell)",
    "Landmine Rotation",
    "Suitcase Carry",
    "Farmer's Walk",
    "Overhead Carry",
    "Dragon Flag"
  ],
  olympic: [
    "Clean",
    "Clean & Jerk",
    "Power Clean",
    "Hang Clean",
    "Snatch",
    "Power Snatch",
    "Hang Snatch",
    "Clean Pull",
    "Snatch Pull",
    "Muscle Clean",
    "Muscle Snatch",
    "Push Jerk",
    "Split Jerk",
    "Thruster",
    "Cluster",
    "Clean High Pull",
    "Snatch Grip Deadlift",
    "Overhead Squat"
  ],
  conditioning: [
    "Running (Treadmill)",
    "Running (Outdoor)",
    "Sprint",
    "Incline Walk (Treadmill)",
    "Rowing Machine",
    "Assault Bike",
    "Stationary Bike",
    "Spin Class",
    "Elliptical",
    "Stair Climber",
    "StairMaster",
    "Jump Rope",
    "Box Jump",
    "Broad Jump",
    "Burpee",
    "Mountain Climbers (Cardio)",
    "Jumping Jack",
    "High Knees",
    "Butt Kicks",
    "Battle Ropes",
    "Sled Push",
    "Sled Pull",
    "Prowler Push",
    "Farmer's Walk (Cardio)",
    "Swimming",
    "Cycling (Outdoor)",
    "Hiking",
    "HIIT Circuit",
    "Tabata",
    "EMOM",
    "AMRAP",
    "Ski Erg",
    "VersaClimber",
    "Bear Crawl",
    "Crab Walk",
    "Shuttle Run",
    "Ruck March",
    "Kettlebell Swings (Cardio)",
    "Circuit Training",
    "Sprints (Hill)",
    "Sprints (Track)",
    "Tire Flips",
    "Rope Climb"
  ],
  functional: [
    "Face Pull",
    "Band Pull-Apart",
    "Banded Good Morning",
    "Banded Hip Circle",
    "Foam Rolling",
    "Stretching",
    "Mobility Work",
    "Yoga",
    "Turkish Get-Up",
    "Windmill (Kettlebell)",
    "Bottoms-Up Press",
    "Sots Press",
    "Jefferson Deadlift",
    "Deficit Push-Up",
    "Ring Push-Up",
    "Ring Row",
    "Ring Dip",
    "Muscle-Up",
    "Kipping Pull-Up",
    "Strict Pull-Up",
    "Wall Balls",
    "Medicine Ball Slam",
    "Medicine Ball Throw",
    "Sandbag Carry",
    "Atlas Stone",
    "Log Press"
  ]
} as const;

// Flatten all exercises for comprehensive list
export const ALL_EXERCISES = Object.values(EXERCISE_CATEGORIES).flat();

// Get all strength exercises (everything except conditioning)
export const STRENGTH_EXERCISES = [
  ...EXERCISE_CATEGORIES.chest,
  ...EXERCISE_CATEGORIES.back,
  ...EXERCISE_CATEGORIES.shoulders,
  ...EXERCISE_CATEGORIES.quadriceps,
  ...EXERCISE_CATEGORIES.hamstrings_glutes,
  ...EXERCISE_CATEGORIES.calves,
  ...EXERCISE_CATEGORIES.biceps,
  ...EXERCISE_CATEGORIES.triceps,
  ...EXERCISE_CATEGORIES.core,
  ...EXERCISE_CATEGORIES.olympic,
  ...EXERCISE_CATEGORIES.functional,
];

// Get conditioning exercises
export const CONDITIONING_EXERCISES = EXERCISE_CATEGORIES.conditioning;

// Category metadata for UI
export const CATEGORY_LABELS: Record<keyof typeof EXERCISE_CATEGORIES, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  quadriceps: 'Quadriceps',
  hamstrings_glutes: 'Hamstrings & Glutes',
  calves: 'Calves',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Core',
  olympic: 'Olympic',
  conditioning: 'Conditioning',
  functional: 'Functional'
};

// Check if an exercise is conditioning
export const isConditioningExercise = (exerciseName: string): boolean => {
  return CONDITIONING_EXERCISES.some(
    e => e.toLowerCase() === exerciseName.toLowerCase()
  );
};

// Legacy - kept for backward compatibility
export const COMMON_EXERCISES = ALL_EXERCISES;
