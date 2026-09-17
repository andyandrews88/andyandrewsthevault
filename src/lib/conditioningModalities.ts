export type ConditioningField =
  | "duration"
  | "calories"
  | "distance"
  | "avg_watts"
  | "avg_speed"
  | "cadence_rpm"
  | "avg_heart_rate"
  | "max_heart_rate"
  | "hr_zone"
  | "rpe";

export interface ModalityDef {
  id: string;
  label: string;
  /** Fields shown by default for this modality. */
  fields: ConditioningField[];
  distanceUnit?: "miles" | "km" | "meters";
  speedUnit?: "mph" | "kph" | "min/km";
}

/** Everything a modality can record — used by "show all fields". */
export const ALL_CONDITIONING_FIELDS: ConditioningField[] = [
  "duration",
  "calories",
  "distance",
  "avg_watts",
  "avg_speed",
  "cadence_rpm",
  "avg_heart_rate",
  "max_heart_rate",
  "hr_zone",
  "rpe",
];

export const CONDITIONING_MODALITIES: ModalityDef[] = [
  {
    id: "assault_bike",
    label: "Assault Bike",
    fields: ["duration", "calories", "distance", "avg_watts", "avg_speed", "cadence_rpm", "rpe"],
    distanceUnit: "miles",
    speedUnit: "mph",
  },
  {
    id: "rower",
    label: "Rower",
    fields: ["duration", "distance", "calories", "avg_watts", "cadence_rpm", "rpe"],
    distanceUnit: "meters",
  },
  {
    id: "ski_erg",
    label: "Ski Erg",
    fields: ["duration", "distance", "calories", "avg_watts", "rpe"],
    distanceUnit: "meters",
  },
  {
    id: "bike_erg",
    label: "Bike Erg",
    fields: ["duration", "distance", "calories", "avg_watts", "cadence_rpm", "rpe"],
    distanceUnit: "km",
    speedUnit: "kph",
  },
  {
    id: "run",
    label: "Run",
    fields: ["duration", "distance", "avg_speed", "avg_heart_rate", "rpe"],
    distanceUnit: "km",
    speedUnit: "kph",
  },
  {
    id: "treadmill",
    label: "Treadmill",
    fields: ["duration", "distance", "avg_speed", "calories", "avg_heart_rate", "rpe"],
    distanceUnit: "km",
    speedUnit: "kph",
  },
  {
    id: "swim",
    label: "Swim",
    fields: ["duration", "distance", "rpe"],
    distanceUnit: "meters",
  },
  {
    id: "sled",
    label: "Sled / Carry",
    fields: ["duration", "distance", "rpe"],
    distanceUnit: "meters",
  },
  {
    id: "stair_climber",
    label: "Stair Climber",
    fields: ["duration", "calories", "avg_heart_rate", "rpe"],
  },
  {
    id: "circuit",
    label: "Circuit / Other",
    fields: ["duration", "calories", "avg_heart_rate", "rpe"],
  },
];

export function findModality(id: string | null | undefined): ModalityDef | undefined {
  if (!id) return undefined;
  return CONDITIONING_MODALITIES.find((m) => m.id === id);
}

/** Best-effort match of a free-text exercise name to a modality. */
export function guessModality(exerciseName: string): string | null {
  const n = exerciseName.toLowerCase();
  if (n.includes("assault")) return "assault_bike";
  if (n.includes("row")) return "rower";
  if (n.includes("ski")) return "ski_erg";
  if (n.includes("treadmill")) return "treadmill";
  if (n.includes("run") || n.includes("sprint")) return "run";
  if (n.includes("swim")) return "swim";
  if (n.includes("sled") || n.includes("prowler") || n.includes("carry")) return "sled";
  if (n.includes("stair")) return "stair_climber";
  if (n.includes("bike") || n.includes("cycl")) return "bike_erg";
  return null;
}

export const HR_ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5"];
