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

// ─── Equipment Modifiers ──────────────────────────────────────────────
// Applied on top of pattern coefficient: NTU = rawVolume / (patternCoeff * equipmentModifier)
// Barbell = 1.0 (baseline). Other implements scale down because they typically
// allow less absolute load or involve less systemic demand.
export type EquipmentType = 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'cable' | 'sandbag' | 'bodyweight' | 'other';

export const EQUIPMENT_MODIFIER_VALUES: Record<EquipmentType, number> = {
  barbell: 1.0,
  machine: 0.85,
  dumbbell: 0.80,
  sandbag: 0.75,
  kettlebell: 0.70,
  cable: 0.65,
  bodyweight: 0.70,
  other: 0.80,
};

// Map exercise names (lowercase) → equipment type
const EXERCISE_EQUIPMENT_MAP: Record<string, EquipmentType> = {};

function tagEquipment(exercises: string[], equipment: EquipmentType) {
  for (const e of exercises) {
    EXERCISE_EQUIPMENT_MAP[e.toLowerCase()] = equipment;
  }
}

// ── Barbell exercises ──
tagEquipment([
  'Bench Press (Barbell)', 'Incline Bench Press (Barbell)', 'Decline Bench Press',
  'Close-Grip Bench Press', 'Floor Press',
  'Overhead Press (Barbell)', 'Push Press', 'Behind-the-Neck Press', 'Z Press',
  'Bradford Press', 'Log Press',
  'Back Squat (High Bar)', 'Back Squat (Low Bar)', 'Front Squat',
  'Zercher Squat', 'Safety Bar Squat', 'Box Squat', 'Pause Squat', 'Anderson Squat',
  'Cyclist Squat', 'Heel-Elevated Squat', 'Overhead Squat',
  'Deadlift (Conventional)', 'Deadlift (Sumo)', 'Romanian Deadlift',
  'Stiff-Leg Deadlift', 'Deficit Deadlift', 'Rack Pull', 'Rack Deadlift',
  'Sumo Deadlift', 'Trap Bar Deadlift', 'Snatch Grip Deadlift',
  'Romanian Deadlift (Barbell)', 'Jefferson Deadlift',
  'Hip Thrust (Barbell)', 'Good Morning',
  'Barbell Row (Overhand)', 'Barbell Row (Underhand)', 'Pendlay Row',
  'T-Bar Row', 'Upright Row',
  'Barbell Curl', 'EZ Bar Curl', 'Preacher Curl (Barbell)', 'Preacher Curl (EZ Bar)',
  '21s (Barbell Curl)', 'Drag Curl', 'Reverse Curl',
  'Skull Crusher (Barbell)', 'Skull Crusher (EZ Bar)',
  'Overhead Tricep Extension (EZ Bar)', 'JM Press', 'French Press',
  'Shrug (Barbell)', 'Shrug (Trap Bar)',
  'Front Raise (Barbell)',
  'Clean', 'Clean & Jerk', 'Power Clean', 'Hang Clean',
  'Snatch', 'Power Snatch', 'Hang Snatch',
  'Clean Pull', 'Snatch Pull', 'Muscle Clean', 'Muscle Snatch',
  'Push Jerk', 'Split Jerk', 'Clean High Pull',
  'Thruster', 'Cluster',
], 'barbell');

// ── Dumbbell exercises ──
tagEquipment([
  'Bench Press (Dumbbell)', 'Incline Bench Press (Dumbbell)',
  'Chest Fly (Dumbbell)', 'Overhead Press (Dumbbell)',
  'Seated Dumbbell Press', 'Arnold Press',
  'Goblet Squat',
  'Romanian Deadlift (Dumbbell)',
  'Single-Leg Romanian Deadlift',
  'Hip Thrust (Dumbbell)',
  'Dumbbell Row (Single-Arm)', 'Dumbbell Row (Two-Arm)',
  'Dumbbell Curl (Standing)', 'Dumbbell Curl (Seated)', 'Dumbbell Curl (Incline)',
  'Hammer Curl', 'Cross-Body Hammer Curl', 'Zottman Curl',
  'Concentration Curl', 'Spider Curl', 'Preacher Curl (Dumbbell)',
  'Skull Crusher (Dumbbell)', 'Overhead Tricep Extension (Dumbbell)',
  'Tricep Kickback',
  'Lateral Raise (Dumbbell)', 'Front Raise (Dumbbell)',
  'Rear Delt Fly (Dumbbell)', 'Lu Raise', 'Bus Driver',
  'Shrug (Dumbbell)', 'Standing Calf Raise (Dumbbell)',
  'Woodchop (Dumbbell)',
  'Bulgarian Split Squat', 'Walking Lunge', 'Reverse Lunge',
  'Forward Lunge', 'Lateral Lunge', 'Step-Up', 'Box Step-Up',
], 'dumbbell');

// ── Kettlebell exercises ──
tagEquipment([
  'Kettlebell Swing', 'Kettlebell Swings (Cardio)',
  'Turkish Get-Up', 'Windmill (Kettlebell)', 'Bottoms-Up Press',
], 'kettlebell');

// ── Machine exercises ──
tagEquipment([
  'Hack Squat', 'Leg Press', 'Leg Press (Single-Leg)',
  'Leg Extension', 'Leg Curl (Lying)', 'Leg Curl (Seated)', 'Leg Curl (Standing)',
  'Machine Chest Press', 'Pec Deck', 'Machine Shoulder Press',
  'Lateral Raise (Machine)', 'Rear Delt Fly (Machine)',
  'Machine Bicep Curl',
  'Hip Abduction (Machine)', 'Hip Adduction (Machine)',
  'Standing Calf Raise (Machine)', 'Standing Calf Raise (Smith)',
  'Seated Calf Raise', 'Leg Press Calf Raise', 'Donkey Calf Raise',
  'Chest-Supported Row',
  'Smith Press',
], 'machine');

// ── Cable exercises ──
tagEquipment([
  'Chest Fly (Cable)', 'Cable Row (Seated)', 'Cable Row (Standing)',
  'Lat Pulldown (Wide)', 'Lat Pulldown (Close)', 'Lat Pulldown (Reverse Grip)',
  'Straight-Arm Pulldown',
  'Cable Curl', 'Cable Hammer Curl',
  'Tricep Pushdown (Rope)', 'Tricep Pushdown (Bar)', 'Tricep Pushdown (V-Bar)',
  'Overhead Tricep Extension (Cable)', 'Cable Tricep Kickback',
  'Lateral Raise (Cable)', 'Front Raise (Cable)',
  'Rear Delt Fly (Cable)', 'Face Pull', 'Face Pull (Shoulder Focus)',
  'Cable Upright Row', 'Cable Crunch',
  'Pallof Press', 'Woodchop (Cable)', 'Cable Pull-Through',
  'Cable Hip Abduction', 'Cable Kickback',
  'Landmine Press', 'Landmine Press (Shoulder)', 'Landmine Rotation',
], 'cable');

// ── Sandbag exercises ──
tagEquipment([
  'Sandbag Carry', 'Atlas Stone',
], 'sandbag');

// ── Bodyweight exercises ──
tagEquipment([
  'Push-Up', 'Diamond Push-Up', 'Wide Push-Up', 'Decline Push-Up',
  'Incline Push-Up', 'Deficit Push-Up', 'Ring Push-Up', 'Handstand Push-Up',
  'Pull-Up', 'Chin-Up', 'Neutral-Grip Pull-Up', 'Strict Pull-Up',
  'Kipping Pull-Up', 'Muscle-Up',
  'Dips (Chest Focus)', 'Parallel Bar Dip', 'Ring Dip', 'Bench Dip',
  'Inverted Row', 'Ring Row',
  'Pistol Squat', 'Sissy Squat', 'Wall Sit',
  'Nordic Curl', 'Glute-Ham Raise',
  'Back Extension', 'Hyperextension', 'Reverse Hyperextension',
  'Plank', 'Side Plank', 'Dead Bug', 'Bird Dog', 'Hollow Body Hold',
  'Crunch', 'Bicycle Crunch', 'V-Up', 'Sit-Up', 'Decline Sit-Up',
  'Russian Twist', 'Ab Rollout', 'Ab Wheel',
  'Hanging Leg Raise', 'Hanging Knee Raise', "Captain's Chair Leg Raise",
  'Toe Touch', 'Heel Touch', 'Mountain Climber', 'Flutter Kick',
  'Dragon Flag', 'Bear Crawl', 'Crab Walk',
  'Glute Bridge', 'Single-Leg Glute Bridge',
  'Donkey Kick', 'Fire Hydrant', 'Clamshell',
], 'bodyweight');

/**
 * Look up the equipment type for a given exercise name.
 */
export function getEquipmentType(exerciseName: string): EquipmentType {
  return EXERCISE_EQUIPMENT_MAP[exerciseName.toLowerCase().trim()] || 'other';
}

/**
 * Get the equipment modifier multiplier for an exercise.
 */
export function getEquipmentModifier(exerciseName: string): number {
  const eq = getEquipmentType(exerciseName);
  return EQUIPMENT_MODIFIER_VALUES[eq];
}

// ─── Pattern Colors (HSL values matching design system) ───────────────
export const PATTERN_COLORS: Record<MovementPattern, string> = {
  hinge: 'hsl(0, 72%, 51%)',
  squat: 'hsl(262, 60%, 55%)',
  push: 'hsl(192, 91%, 54%)',
  pull: 'hsl(142, 71%, 45%)',
  single_leg: 'hsl(38, 92%, 50%)',
  core: 'hsl(45, 93%, 58%)',
  carry: 'hsl(280, 60%, 55%)',
  olympic: 'hsl(330, 70%, 55%)',
  isolation: 'hsl(215, 14%, 50%)',
};

// ─── Bodyweight Exercise Multipliers ──────────────────────────────────
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
const EXERCISE_PATTERN_MAP: Record<string, MovementPattern> = {};

function addAll(exercises: readonly string[], pattern: MovementPattern) {
  for (const e of exercises) {
    EXERCISE_PATTERN_MAP[e.toLowerCase()] = pattern;
  }
}

// HINGE
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

// SQUAT
addAll([
  'Back Squat (High Bar)', 'Back Squat (Low Bar)', 'Front Squat',
  'Goblet Squat', 'Zercher Squat', 'Hack Squat', 'Safety Bar Squat',
  'Box Squat', 'Pause Squat', 'Anderson Squat', 'Leg Press',
  'Overhead Squat', 'Cyclist Squat', 'Heel-Elevated Squat',
  'Sissy Squat', 'Wall Sit', 'Thruster', 'Cluster',
], 'squat');

// PUSH
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

// PULL
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

// SINGLE LEG
addAll([
  'Bulgarian Split Squat', 'Walking Lunge', 'Reverse Lunge',
  'Forward Lunge', 'Lateral Lunge', 'Step-Up', 'Box Step-Up',
  'Pistol Squat', 'Leg Press (Single-Leg)',
  'Single-Leg Romanian Deadlift',
], 'single_leg');

// CORE
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

// CARRY
addAll([
  "Farmer's Walk", 'Suitcase Carry', 'Overhead Carry',
  'Sandbag Carry', "Farmer's Walk (Cardio)",
], 'carry');

// OLYMPIC
addAll([
  'Clean', 'Clean & Jerk', 'Power Clean', 'Hang Clean',
  'Snatch', 'Power Snatch', 'Hang Snatch',
  'Clean Pull', 'Snatch Pull', 'Muscle Clean', 'Muscle Snatch',
  'Push Jerk', 'Split Jerk', 'Clean High Pull',
], 'olympic');

// ISOLATION
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
  if (EXERCISE_PATTERN_MAP[key]) return EXERCISE_PATTERN_MAP[key];
  
  if (/deadlift|rdl|good\s?morning|swing|hip\s?thrust|glute\s?bridge|pull.?through/i.test(key)) return 'hinge';
  if (/squat|leg\s?press(?!\s*calf)/i.test(key)) return 'squat';
  if (/press|push|dip|fly|pec|chest/i.test(key)) return 'push';
  if (/pull|row|lat|chin|pulldown/i.test(key)) return 'pull';
  if (/lunge|split\s?squat|step.?up|single.?leg|pistol/i.test(key)) return 'single_leg';
  if (/plank|crunch|sit.?up|ab\s|core|pallof|rollout|leg\s?raise|woodchop/i.test(key)) return 'core';
  if (/carry|walk|farmer/i.test(key)) return 'carry';
  if (/clean|snatch|jerk|thruster/i.test(key)) return 'olympic';
  if (/curl|raise|extension|kickback|fly|shrug|calf/i.test(key)) return 'isolation';
  
  return 'isolation';
}

// ─── Time-Based Exercises ─────────────────────────────────────────────
// Exercises where duration (seconds) replaces reps as the primary metric.
// 30 seconds ≈ 1 "rep equivalent" based on isometric metabolic-stress research.
const TIME_NORMALIZATION_FACTOR = 30;

export const TIME_BASED_EXERCISES = new Set([
  'plank', 'side plank', 'plank (weighted)',
  'hollow body hold', 'dead bug', 'bird dog',
  'wall sit',
  "farmer's walk", 'suitcase carry', 'overhead carry',
  'sandbag carry', "farmer's walk (cardio)",
]);

/**
 * Check if an exercise should use time-based input.
 * Checks DB flag first, then falls back to hardcoded set.
 */
export function isTimedExercise(name: string, dbIsTimed?: boolean | null): boolean {
  if (dbIsTimed != null) return dbIsTimed;
  return TIME_BASED_EXERCISES.has(name.toLowerCase().trim());
}

// ─── Volume Calculation ───────────────────────────────────────────────
const DEFAULT_BODYWEIGHT_KG = 77;

export function isBodyweightExercise(name: string): boolean {
  return name.toLowerCase().trim() in BODYWEIGHT_EXERCISES;
}

/**
 * Calculate volume for a timed (isometric/carry) set.
 * Formula: effectiveWeight × (seconds / 30)
 */
export function calculateTimedSetVolume(
  exerciseName: string,
  weight: number | null,
  durationSeconds: number,
  bodyWeightKg: number | null,
): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  const repEquivalent = durationSeconds / TIME_NORMALIZATION_FACTOR;
  const key = exerciseName.toLowerCase().trim();
  const bwEntry = BODYWEIGHT_EXERCISES[key];
  const bw = bodyWeightKg ?? DEFAULT_BODYWEIGHT_KG;

  if (bwEntry) {
    const effectiveWeight = weight && weight > 0
      ? bw * bwEntry.multiplier + weight
      : bw * bwEntry.multiplier;
    return effectiveWeight * repEquivalent;
  }

  if (!weight || weight <= 0) return 0;
  return weight * repEquivalent;
}

export function calculateSetVolume(
  exerciseName: string,
  weight: number | null,
  reps: number | null,
  bodyWeightKg: number | null,
  durationSeconds?: number | null,
): number {
  // If duration is provided and exercise is timed, use timed calc
  if (durationSeconds && durationSeconds > 0 && isTimedExercise(exerciseName)) {
    return calculateTimedSetVolume(exerciseName, weight, durationSeconds, bodyWeightKg);
  }

  if (!reps || reps <= 0) return 0;
  
  const key = exerciseName.toLowerCase().trim();
  const bwEntry = BODYWEIGHT_EXERCISES[key];
  const bw = bodyWeightKg ?? DEFAULT_BODYWEIGHT_KG;
  
  if (bwEntry) {
    if (weight && weight > 0) {
      return (bw * bwEntry.multiplier + weight) * reps;
    }
    return bw * bwEntry.multiplier * reps;
  }
  
  if (!weight || weight <= 0) return 0;
  return weight * reps;
}

/**
 * Convert raw volume to Normalized Training Units (NTUs).
 * NTU = rawVolume / (patternCoeff * equipmentModifier)
 */
export function normalizeVolume(rawVolume: number, pattern: MovementPattern, exerciseName?: string, dbEquipment?: string | null): number {
  const patternCoeff = DIFFICULTY_COEFFICIENTS[pattern];
  let equipMod: number;
  if (dbEquipment && dbEquipment in EQUIPMENT_MODIFIER_VALUES) {
    equipMod = EQUIPMENT_MODIFIER_VALUES[dbEquipment as EquipmentType];
  } else {
    equipMod = exerciseName ? getEquipmentModifier(exerciseName) : 1.0;
  }
  const combined = patternCoeff * equipMod;
  return combined > 0 ? rawVolume / combined : rawVolume;
}

/**
 * Classify exercise using DB-stored pattern if available, falling back to hardcoded.
 */
export function classifyExerciseWithDb(name: string, dbPattern?: string | null): MovementPattern {
  if (dbPattern && ALL_PATTERNS.includes(dbPattern as MovementPattern)) {
    return dbPattern as MovementPattern;
  }
  return classifyExercise(name);
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
  patterns: Record<MovementPattern, number>;
}

export const ALL_PATTERNS: MovementPattern[] = [
  'hinge', 'squat', 'push', 'pull', 'single_leg', 'core', 'carry', 'olympic', 'isolation'
];
