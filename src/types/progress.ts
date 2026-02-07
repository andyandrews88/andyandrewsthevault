// Measurement source types
export type MeasurementSource = 
  | 'scale'
  | 'calipers'
  | 'bioimpedance'
  | 'dexa'
  | 'inbody'
  | 'bodpod'
  | 'navy_method'
  | 'visual_estimate'
  | 'other';

// Wearable device types
export type WearableDevice = 
  | 'whoop'
  | 'garmin'
  | 'fitbit'
  | 'apple_health';

// Wearable metric types
export type WearableMetric =
  | 'recovery_score'
  | 'strain_score'
  | 'hrv'
  | 'resting_heart_rate'
  | 'sleep_score'
  | 'sleep_duration'
  | 'respiratory_rate'
  | 'steps'
  | 'active_minutes'
  | 'heart_rate_avg'
  | 'vo2_max'
  | 'training_load'
  | 'body_battery'
  | 'stress_level'
  | 'cardio_fitness'
  | 'stand_hours'
  | 'calories_burned';

// Body entry interface
export interface BodyEntry {
  id: string;
  user_id: string;
  entry_date: string;
  
  // Basic metrics
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  
  // Body fat
  body_fat_percent: number | null;
  measurement_source: MeasurementSource | null;
  
  // Circumference measurements (in cm)
  neck_cm: number | null;
  shoulders_cm: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  left_bicep_cm: number | null;
  right_bicep_cm: number | null;
  left_forearm_cm: number | null;
  right_forearm_cm: number | null;
  left_thigh_cm: number | null;
  right_thigh_cm: number | null;
  left_calf_cm: number | null;
  right_calf_cm: number | null;
  
  // Advanced scan data
  lean_mass_kg: number | null;
  fat_mass_kg: number | null;
  bone_density: number | null;
  visceral_fat_rating: number | null;
  
  // Regional body fat
  trunk_fat_percent: number | null;
  left_arm_fat_percent: number | null;
  right_arm_fat_percent: number | null;
  left_leg_fat_percent: number | null;
  right_leg_fat_percent: number | null;
  
  // Photo and notes
  photo_path: string | null;
  notes: string | null;
  
  // Unit preference
  uses_imperial: boolean;
  
  created_at: string;
  updated_at: string;
}

// Form input for new entries
export interface BodyEntryFormData {
  entry_date: Date;
  weight: number | null;
  height: number | null;
  body_fat_percent: number | null;
  measurement_source: MeasurementSource | null;
  
  // Circumferences
  neck: number | null;
  shoulders: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  left_bicep: number | null;
  right_bicep: number | null;
  left_forearm: number | null;
  right_forearm: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  left_calf: number | null;
  right_calf: number | null;
  
  // Advanced scan
  lean_mass: number | null;
  fat_mass: number | null;
  bone_density: number | null;
  visceral_fat_rating: number | null;
  
  // Regional
  trunk_fat_percent: number | null;
  left_arm_fat_percent: number | null;
  right_arm_fat_percent: number | null;
  left_leg_fat_percent: number | null;
  right_leg_fat_percent: number | null;
  
  notes: string;
  uses_imperial: boolean;
}

// Wearable connection interface
export interface WearableConnection {
  id: string;
  user_id: string;
  device_type: WearableDevice;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

// Wearable data point interface
export interface WearableDataPoint {
  id: string;
  user_id: string;
  device_type: WearableDevice;
  metric_type: WearableMetric;
  value: number;
  recorded_at: string;
  synced_at: string;
}

// Chart data format
export interface WeightChartData {
  date: string;
  weight: number;
  bmi?: number;
}

export interface BodyFatChartData {
  date: string;
  bodyFat: number;
  source: MeasurementSource;
}

export interface WearableChartData {
  date: string;
  value: number;
  metric: WearableMetric;
  device: WearableDevice;
}

// Unit conversion helpers
export const KG_TO_LBS = 2.20462;
export const CM_TO_INCHES = 0.393701;
export const LBS_TO_KG = 0.453592;
export const INCHES_TO_CM = 2.54;

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_TO_KG * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round(cm * CM_TO_INCHES * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * INCHES_TO_CM * 10) / 10;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// Navy method body fat calculation
export function calculateNavyBodyFat(
  waistCm: number,
  neckCm: number,
  heightCm: number,
  hipsCm?: number,
  isMale: boolean = true
): number {
  if (isMale) {
    // Male formula
    const bf = 86.010 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
    return Math.round(bf * 10) / 10;
  } else {
    // Female formula (requires hips)
    if (!hipsCm) return 0;
    const bf = 163.205 * Math.log10(waistCm + hipsCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
    return Math.round(bf * 10) / 10;
  }
}

// Measurement source display names
export const MEASUREMENT_SOURCE_LABELS: Record<MeasurementSource, string> = {
  scale: 'Smart Scale',
  calipers: 'Skin Calipers',
  bioimpedance: 'Bioimpedance',
  dexa: 'DEXA Scan',
  inbody: 'InBody',
  bodpod: 'Bod Pod',
  navy_method: 'Navy Method',
  visual_estimate: 'Visual Estimate',
  other: 'Other'
};

// Wearable device info
export const WEARABLE_DEVICE_INFO: Record<WearableDevice, {
  name: string;
  color: string;
  metrics: WearableMetric[];
}> = {
  whoop: {
    name: 'Whoop',
    color: 'hsl(var(--chart-1))',
    metrics: ['recovery_score', 'strain_score', 'hrv', 'resting_heart_rate', 'sleep_score', 'respiratory_rate']
  },
  garmin: {
    name: 'Garmin',
    color: 'hsl(var(--chart-2))',
    metrics: ['steps', 'heart_rate_avg', 'vo2_max', 'training_load', 'sleep_score', 'body_battery', 'stress_level']
  },
  fitbit: {
    name: 'Fitbit',
    color: 'hsl(var(--chart-3))',
    metrics: ['steps', 'active_minutes', 'heart_rate_avg', 'sleep_score', 'cardio_fitness']
  },
  apple_health: {
    name: 'Apple Health',
    color: 'hsl(var(--chart-4))',
    metrics: ['steps', 'heart_rate_avg', 'stand_hours', 'calories_burned']
  }
};

// Metric display names and units
export const WEARABLE_METRIC_INFO: Record<WearableMetric, {
  name: string;
  unit: string;
  format: (value: number) => string;
}> = {
  recovery_score: { name: 'Recovery', unit: '%', format: (v) => `${Math.round(v)}%` },
  strain_score: { name: 'Strain', unit: '', format: (v) => v.toFixed(1) },
  hrv: { name: 'HRV', unit: 'ms', format: (v) => `${Math.round(v)} ms` },
  resting_heart_rate: { name: 'Resting HR', unit: 'bpm', format: (v) => `${Math.round(v)} bpm` },
  sleep_score: { name: 'Sleep Score', unit: '%', format: (v) => `${Math.round(v)}%` },
  sleep_duration: { name: 'Sleep', unit: 'hrs', format: (v) => `${(v / 60).toFixed(1)} hrs` },
  respiratory_rate: { name: 'Resp Rate', unit: 'rpm', format: (v) => `${v.toFixed(1)} rpm` },
  steps: { name: 'Steps', unit: '', format: (v) => v.toLocaleString() },
  active_minutes: { name: 'Active Min', unit: 'min', format: (v) => `${Math.round(v)} min` },
  heart_rate_avg: { name: 'Avg HR', unit: 'bpm', format: (v) => `${Math.round(v)} bpm` },
  vo2_max: { name: 'VO2 Max', unit: 'ml/kg/min', format: (v) => v.toFixed(1) },
  training_load: { name: 'Training Load', unit: '', format: (v) => Math.round(v).toString() },
  body_battery: { name: 'Body Battery', unit: '', format: (v) => `${Math.round(v)}` },
  stress_level: { name: 'Stress', unit: '', format: (v) => `${Math.round(v)}` },
  cardio_fitness: { name: 'Cardio Fitness', unit: '', format: (v) => Math.round(v).toString() },
  stand_hours: { name: 'Stand Hours', unit: 'hrs', format: (v) => `${Math.round(v)} hrs` },
  calories_burned: { name: 'Calories', unit: 'kcal', format: (v) => `${Math.round(v)} kcal` }
};
