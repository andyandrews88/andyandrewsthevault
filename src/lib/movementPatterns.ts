import { EXERCISE_CATEGORIES } from '@/types/workout';

// ─── Movement Pattern Types ───────────────────────────────────────────
export type MovementPattern = 
  | 'hinge' | 'squat' | 'push' | 'pull' 
  | 'single_leg' | 'core' | 'carry' 
  | 'olympic' | 'isolation';

export const MOVEMENT_PATTERN_LABELS: Record<MovementPattern, string> = {
  hinge: 'Hinge',
  squat: 'Squat',
  push: 'Push',
  pull: 'Pull',
  single_leg: 'Single Leg',
  core: 'Core',
  carry: 'Carry',
  olympic: 'Olympic',
  isolation: 'Isolation',
};

export const MOVEMENT_PATTERN_SHORT: Record<MovementPattern, string> = {
  hinge: 'HNG',
  squat: 'SQT',
  push: 'PSH',
  pull: 'PLL',
  single_leg: 'SL',
  core: 'COR',
  carry: 'CRY',
  olympic: 'OLY',
  isolation: 'ISO',
};

// ─── Difficulty Coefficients ──────────────────────────────────────────
// Used to normalize volume across patterns so a radar chart is meaningful.
// Hinge = 1.0 (baseline, heaviest pattern). Lower coefficient = lower
// typical load, so dividing raw volume by it scales the number up to
// make patterns comparable.
export const DIFFICULTY_COEFFICIENTS: Record<MovementPattern, number> = {
  hinge: 1.0,
  squat: 0.95,
  olympic: 0.90,
  push: 0.65,
  pull: 0.60,
  single_leg: 0.55,
  carry: 0.50,
  isolation: 0.40,
  core: 0.35,
};

// ─── Pattern Colors (HSL values matching design system) ───────────────
export const PATTERN_COLORS: Record<MovementPattern, string> = {
  hinge: 'hsl(0, 72%, 51%)',       // red — heavy posterior
  squat: 'hsl(262, 60%, 55%)',     // purple
  push: 'hsl(192, 91%, 54%)',      // cyan (primary)
  pull: 'hsl(142, 71%, 45%)',      // green (success)
  single_leg: 'hsl(38, 92%, 50%)', // amber (warning)
  core: 'hsl(45, 93%, 58%)',       // gold (accent)
  carry: 'hsl(280, 60%, 55%)',     // violet
  olympic: 'hsl(330, 70%, 55%)',   // pink
  isolation: 'hsl(215, 14%, 50%)', // muted gray
};

// ─── Bodyweight Exercise Multipliers ──────────────────────────────────
// When weight is null/0 on a set, the load is derived from body weight.
// When weight IS present (e.g. weighted pull-ups +45 lbs), it represents
// ADDED weight, so total load = BW * multiplier + added weight.
export const BODYWEIGHT_EXERCISES: Record<string, { multiplier: number; pattern: MovementPattern }> = {
  'pull-up': { multiplier: 1.0, pattern: 'pull' },
  'chin-up': { multiplier: 1.0, pattern: 'pull' },
  'neutral-grip pull-up': { multiplier: 1.0, pattern: 'pull' },
  'strict pull-up': { multiplier: 1.0, pattern: 'pull' },
  'kipping pull-up': { multiplier: 0.85, pattern: 'pull' },
  'muscle-up': { multiplier: 1.0, pattern: 'pull' },
  'dips (chest focus)': { multiplier: 1.0, pattern: 'push' },
  'parallel bar dip': { multiplier: 1.0, pattern: 'push' },
  'ring dip': { multiplier: 1.0, pattern: 'push' },
  'bench dip': { multiplier: 0.70, pattern: 'push' },
  'push-up': { multiplier: 0.64, pattern: 'push' },
  'diamond push-up': { multiplier: 0.64, pattern: 'push' },
  'wide push-up': { multiplier: 0.64, pattern: 'push' },
  'decline push-up': { multiplier: 0.74, pattern: 'push' },
  'incline push-up': { multiplier: 0.50, pattern: 'push' },
  'deficit push-up': { multiplier: 0.70, pattern: 'push' },
  'ring push-up': { multiplier: 0.70, pattern: 'push' },
  'handstand push-up': { multiplier: 1.0, pattern: 'push' },
  'inverted row': { multiplier: 0.60, pattern: 'pull' },
  'ring row': { multiplier: 0.60, pattern: 'pull' },
  'pistol squat': { multiplier: 0.70, pattern: 'single_leg' },
  'nordic curl': { multiplier: 0.65, pattern: 'hinge' },
  'glute-ham raise': { multiplier: 0.65, pattern: 'hinge' },
  'back extension': { multiplier: 0.45, pattern: 'hinge' },
  'hyperextension': { multiplier: 0.45, pattern: 'hinge' },
  'reverse hyperextension': { multiplier: 0.45, pattern: 'hinge' },
};

// ─── Exercise → Movement Pattern Mapping ──────────────────────────────
// Every exercise from EXERCISE_CATEGORIES classified by movement function.
const EXERCISE_PATTERN_MAP: Record<string, MovementPattern> = {};

function addAll(exercises: readonly string[], pattern: MovementPattern) {
  for (const e of exercises) {
    EXERCISE_PATTERN_MAP[e.toLowerCase()] = pattern;
  }
}

// HINGE — hip-dominant posterior chain
addAll([
  'Deadlift (Conventional)', 'Deadlift (Sumo)', 'Romanian Deadlift',
  'Stiff-Leg Deadlift', 'Deficit Deadlift', 'Rack Pull', 'Rack Deadlift',
  'Good Morning', 'Romanian Deadlift (Barbell)', 'Romanian Deadlift (Dumbbell)',
  'Single-Leg Romanian Deadlift', 'Cable Pull-Through', 'Kettlebell Swing',
  'Sumo Deadlift', 'Trap Bar Deadlift', 'Back Extension', 'Hyperextension',
  'Reverse Hyperextension', 'Nordic Curl', 'Glute-Ham Raise',
  'Hip Thrust (Barbell)', 'Hip Thrust (Dumbbell)', 'Hip Thrust (Single-Leg)',
  'Hip Thrust (Banded)', 'Glute Bridge', 'Single-Leg Glute Bridge',
  'Banded Good Morning', 'Jefferson Deadlift', 'Snatch Grip Deadlift',
], 'hinge');

// SQUAT — knee-dominant bilateral
addAll([
  'Back Squat (High Bar)', 'Back Squat (Low Bar)', 'Front Squat',
  'Goblet Squat', 'Zercher Squat', 'Hack Squat', 'Safety Bar Squat',
  'Box Squat', 'Pause Squat', 'Anderson Squat', 'Leg Press',
  'Overhead Squat', 'Cyclist Squat', 'Heel-Elevated Squat',
  'Sissy Squat', 'Wall Sit', 'Thruster', 'Cluster',
], 'squat');

// PUSH — horizontal + vertical pressing
addAll([
  'Bench Press (Barbell)', 'Bench Press (Dumbbell)',
  'Incline Bench Press (Barbell)', 'Incline Bench Press (Dumbbell)',
  'Decline Bench Press', 'Close-Grip Bench Press', 'Floor Press',
  'Push-Up', 'Diamond Push-Up', 'Wide Push-Up', 'Decline Push-Up',
  'Incline Push-Up', 'Deficit Push-Up', 'Ring Push-Up',
  'Chest Fly (Dumbbell)', 'Chest Fly (Cable)', 'Pec Deck',
  'Machine Chest Press', 'Svend Press', 'Landmine Press',
  'Dips (Chest Focus)', 'Plate Press',
  'Overhead Press (Barbell)', 'Overhead Press (Dumbbell)',
  'Push Press', 'Seated Dumbbell Press', 'Arnold Press',
  'Behind-the-Neck Press', 'Z Press', 'Landmine Press (Shoulder)',
  'Machine Shoulder Press', 'Handstand Push-Up',
  'Bradford Press', 'Log Press', 'Bottoms-Up Press', 'Sots Press',
  'Parallel Bar Dip', 'Ring Dip', 'Bench Dip', 'JM Press',
  'Tate Press', 'French Press',
], 'push');

// PULL — horizontal + vertical pulling
addAll([
  'Pull-Up', 'Chin-Up', 'Neutral-Grip Pull-Up',
  'Lat Pulldown (Wide)', 'Lat Pulldown (Close)', 'Lat Pulldown (Reverse Grip)',
  'Barbell Row (Overhand)', 'Barbell Row (Underhand)', 'Pendlay Row',
  'Dumbbell Row (Single-Arm)', 'Dumbbell Row (Two-Arm)',
  'Cable Row (Seated)', 'Cable Row (Standing)',
  'T-Bar Row', 'Meadows Row', 'Chest-Supported Row', 'Seal Row',
  'Inverted Row', 'Ring Row', 'Face Pull',
  'Straight-Arm Pulldown', 'Muscle-Up', 'Kipping Pull-Up',
  'Strict Pull-Up', 'Upright Row', 'Cable Upright Row',
  'Face Pull (Shoulder Focus)', 'Band Pull-Apart',
], 'pull');

// SINGLE LEG — unilateral lower body
addAll([
  'Bulgarian Split Squat', 'Walking Lunge', 'Reverse Lunge',
  'Forward Lunge', 'Lateral Lunge', 'Step-Up', 'Box Step-Up',
  'Pistol Squat', 'Leg Press (Single-Leg)',
  'Single-Leg Romanian Deadlift',
], 'single_leg');

// CORE — anti-extension, anti-rotation, flexion
addAll([
  'Plank', 'Side Plank', 'Plank (Weighted)', 'Dead Bug', 'Bird Dog',
  'Hollow Body Hold', 'Crunch', 'Bicycle Crunch', 'V-Up', 'Sit-Up',
  'Decline Sit-Up', 'Russian Twist', 'Russian Twist (Weighted)',
  'Cable Crunch', 'Ab Rollout', 'Ab Wheel',
  'Hanging Leg Raise', 'Hanging Knee Raise', "Captain's Chair Leg Raise",
  'Toe Touch', 'Heel Touch', 'Mountain Climber', 'Flutter Kick',
  'Pallof Press', 'Woodchop (Cable)', 'Woodchop (Dumbbell)',
  'Landmine Rotation', 'Dragon Flag',
  'Wall Balls', 'Medicine Ball Slam', 'Medicine Ball Throw',
], 'core');

// CARRY — loaded locomotion
addAll([
  "Farmer's Walk", 'Suitcase Carry', 'Overhead Carry',
  'Sandbag Carry', "Farmer's Walk (Cardio)",
], 'carry');

// OLYMPIC — explosive full-body
addAll([
  'Clean', 'Clean & Jerk', 'Power Clean', 'Hang Clean',
  'Snatch', 'Power Snatch', 'Hang Snatch',
  'Clean Pull', 'Snatch Pull', 'Muscle Clean', 'Muscle Snatch',
  'Push Jerk', 'Split Jerk', 'Clean High Pull',
], 'olympic');

// ISOLATION — single-joint accessory work
addAll([
  'Leg Extension', 'Leg Curl (Lying)', 'Leg Curl (Seated)',
  'Leg Curl (Standing)',
  'Lateral Raise (Dumbbell)', 'Lateral Raise (Cable)', 'Lateral Raise (Machine)',
  'Front Raise (Dumbbell)', 'Front Raise (Barbell)', 'Front Raise (Cable)',
  'Rear Delt Fly (Dumbbell)', 'Rear Delt Fly (Cable)', 'Rear Delt Fly (Machine)',
  'Lu Raise', 'Bus Driver', 'Plate Front Raise', 'Y-T-W Raises',
  'External Rotation', 'Internal Rotation',
  'Barbell Curl', 'EZ Bar Curl',
  'Dumbbell Curl (Standing)', 'Dumbbell Curl (Seated)', 'Dumbbell Curl (Incline)',
  'Hammer Curl', 'Cable Curl',
  'Preacher Curl (Barbell)', 'Preacher Curl (Dumbbell)', 'Preacher Curl (EZ Bar)',
  'Spider Curl', 'Concentration Curl', 'Drag Curl',
  '21s (Barbell Curl)', 'Cross-Body Hammer Curl', 'Cable Hammer Curl',
  'Reverse Curl', 'Zottman Curl', 'Machine Bicep Curl',
  'Tricep Pushdown (Rope)', 'Tricep Pushdown (Bar)', 'Tricep Pushdown (V-Bar)',
  'Overhead Tricep Extension (Cable)', 'Overhead Tricep Extension (Dumbbell)',
  'Overhead Tricep Extension (EZ Bar)',
  'Skull Crusher (Barbell)', 'Skull Crusher (Dumbbell)', 'Skull Crusher (EZ Bar)',
  'Tricep Kickback', 'Cable Tricep Kickback',
  'Shrug (Barbell)', 'Shrug (Dumbbell)', 'Shrug (Trap Bar)',
  'Standing Calf Raise (Machine)', 'Standing Calf Raise (Smith)',
  'Standing Calf Raise (Dumbbell)', 'Seated Calf Raise',
  'Leg Press Calf Raise', 'Donkey Calf Raise', 'Single-Leg Calf Raise',
  'Tibialis Raise',
  'Hip Abduction (Machine)', 'Hip Adduction (Machine)',
  'Cable Hip Abduction', 'Cable Kickback', 'Donkey Kick',
  'Fire Hydrant', 'Clamshell', 'Banded Hip Circle',
], 'isolation');

// ─── Classification Function ─────────────────────────────────────────
export function classifyExercise(name: string): MovementPattern {
  const key = name.toLowerCase().trim();
  
  // Direct map lookup
  if (EXERCISE_PATTERN_MAP[key]) return EXERCISE_PATTERN_MAP[key];
  
  // Fuzzy matching via keywords
  if (/deadlift|rdl|good\s?morning|swing|hip\s?thrust|glute\s?bridge|pull.?through/i.test(key)) return 'hinge';
  if (/squat|leg\s?press(?!\s*calf)/i.test(key)) return 'squat';
  if (/press|push|dip|fly|pec|chest/i.test(key)) return 'push';
  if (/pull|row|lat|chin|pulldown/i.test(key)) return 'pull';
  if (/lunge|split\s?squat|step.?up|single.?leg|pistol/i.test(key)) return 'single_leg';
  if (/plank|crunch|sit.?up|ab\s|core|pallof|rollout|leg\s?raise|woodchop/i.test(key)) return 'core';
  if (/carry|walk|farmer/i.test(key)) return 'carry';
  if (/clean|snatch|jerk|thruster/i.test(key)) return 'olympic';
  if (/curl|raise|extension|kickback|fly|shrug|calf/i.test(key)) return 'isolation';
  
  // Default
  return 'isolation';
}

// ─── Volume Calculation ───────────────────────────────────────────────
const DEFAULT_BODYWEIGHT_KG = 77; // ~170 lbs fallback

export function isBodyweightExercise(name: string): boolean {
  return name.toLowerCase().trim() in BODYWEIGHT_EXERCISES;
}

/**
 * Calculate volume for a single set.
 * @param exerciseName Name of the exercise
 * @param weight Weight on the bar/machine (null for BW exercises)
 * @param reps Number of reps
 * @param bodyWeightKg User's body weight in kg (from user_body_entries)
 * @returns Raw volume in the user's unit system
 */
export function calculateSetVolume(
  exerciseName: string,
  weight: number | null,
  reps: number | null,
  bodyWeightKg: number | null,
): number {
  if (!reps || reps <= 0) return 0;
  
  const key = exerciseName.toLowerCase().trim();
  const bwEntry = BODYWEIGHT_EXERCISES[key];
  const bw = bodyWeightKg ?? DEFAULT_BODYWEIGHT_KG;
  
  if (bwEntry) {
    // Bodyweight exercise
    if (weight && weight > 0) {
      // Weighted variant: (BW * multiplier + added weight) * reps
      return (bw * bwEntry.multiplier + weight) * reps;
    }
    // Pure bodyweight: BW * multiplier * reps
    return bw * bwEntry.multiplier * reps;
  }
  
  // Standard loaded exercise
  if (!weight || weight <= 0) return 0;
  return weight * reps;
}

/**
 * Convert raw volume to Normalized Training Units (NTUs).
 * NTU = rawVolume / difficultyCoefficient
 */
export function normalizeVolume(rawVolume: number, pattern: MovementPattern): number {
  const coeff = DIFFICULTY_COEFFICIENTS[pattern];
  return coeff > 0 ? rawVolume / coeff : rawVolume;
}

// ─── Aggregation Types ────────────────────────────────────────────────
export interface PatternVolumeData {
  pattern: MovementPattern;
  rawVolume: number;
  normalizedVolume: number;
  sets: number;
  exercises: Set<string>;
}

export interface WeeklyPatternVolume {
  weekStart: string;
  weekLabel: string;
  patterns: Record<MovementPattern, number>; // raw volume per pattern
}

export const ALL_PATTERNS: MovementPattern[] = [
  'hinge', 'squat', 'push', 'pull', 'single_leg', 'core', 'carry', 'olympic', 'isolation'
];
