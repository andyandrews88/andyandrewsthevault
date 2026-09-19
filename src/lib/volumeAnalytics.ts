import { supabase } from "@/integrations/supabase/client";

/**
 * Training volume analytics.
 *
 * One calculation used by both the athlete and the coach. Tonnage is derived
 * only from completed working sets that carry a real load and rep count, with
 * lb normalised to kg for aggregation. Non-load work (bodyweight, timed holds,
 * plyometrics, conditioning) is never folded into tonnage — it is reported
 * separately as reps/contacts/time/distance/calories.
 */

const LB_PER_KG = 2.20462;

export type PatternKey =
  | "push"
  | "pull"
  | "squat"
  | "hinge"
  | "single_leg"
  | "core"
  | "isolation"
  | "plyometric"
  | "unclassified";

export const PATTERN_LABEL: Record<PatternKey, string> = {
  push: "Push",
  pull: "Pull",
  squat: "Squat",
  hinge: "Hinge",
  single_leg: "Single leg",
  core: "Core",
  isolation: "Isolation",
  plyometric: "Plyometric",
  unclassified: "Unclassified",
};

/** Order used everywhere a pattern breakdown is rendered. */
export const PATTERN_ORDER: PatternKey[] = [
  "push",
  "pull",
  "squat",
  "hinge",
  "single_leg",
  "single_leg",
  "core",
  "isolation",
  "plyometric",
  "unclassified",
].filter((v, i, a) => a.indexOf(v) === i) as PatternKey[];

export interface PatternVolume {
  pattern: PatternKey;
  tonnageKg: number;
  sets: number;
  reps: number;
}

export interface NonLoadWork {
  /** completed bodyweight / unloaded resistance reps */
  bodyweightReps: number;
  bodyweightSets: number;
  /** plyometric ground contacts (reps on plyometric movements) */
  plyoContacts: number;
  /** seconds of timed strength work (holds, isometrics) */
  timedSeconds: number;
  /** conditioning */
  conditioningSeconds: number;
  conditioningDistanceM: number;
  conditioningCalories: number;
}

export interface SessionVolume {
  workoutId: string;
  date: string;
  workoutName: string;
  tonnageKg: number;
  loadedSets: number;
  totalReps: number;
  byPattern: PatternVolume[];
  nonLoad: NonLoadWork;
  /** movement names with logged loaded work but no library classification */
  unclassifiedMovements: string[];
}

interface RawSet {
  weight: number | null;
  reps: number | null;
  unit: "kg" | "lb" | null;
  is_completed: boolean | null;
  set_type: string | null;
  duration_seconds: number | null;
}

interface RawConditioningSet {
  duration_seconds: number | null;
  distance: number | null;
  distance_unit: string | null;
  calories: number | null;
  is_completed: boolean | null;
}

interface RawExercise {
  exercise_name: string;
  exercise_type: string | null;
  exercise_sets: RawSet[] | null;
  conditioning_sets: RawConditioningSet[] | null;
}

interface RawWorkout {
  id: string;
  date: string;
  workout_name: string;
  workout_exercises: RawExercise[] | null;
}

export interface LibraryMeta {
  pattern: PatternKey | null;
  isPlyometric: boolean;
  isTimed: boolean;
}

export type LibraryMap = Map<string, LibraryMeta>;

export function toKg(weight: number, unit: "kg" | "lb" | null): number {
  return unit === "lb" ? weight / LB_PER_KG : weight;
}

function distanceToM(value: number, unit: string | null): number {
  switch ((unit ?? "m").toLowerCase()) {
    case "km":
      return value * 1000;
    case "mi":
    case "miles":
      return value * 1609.34;
    case "yd":
      return value * 0.9144;
    default:
      return value;
  }
}

/** Loads the movement_pattern taxonomy from the exercise library. */
export async function loadLibraryMap(): Promise<LibraryMap> {
  const { data, error } = await supabase
    .from("exercise_library")
    .select("name, movement_pattern, is_plyometric, is_timed");
  const map: LibraryMap = new Map();
  if (error || !data) return map;
  for (const row of data) {
    map.set(row.name.toLowerCase().trim(), {
      pattern: (row.movement_pattern as PatternKey | null) ?? null,
      isPlyometric: !!row.is_plyometric,
      isTimed: !!row.is_timed,
    });
  }
  return map;
}

function emptyNonLoad(): NonLoadWork {
  return {
    bodyweightReps: 0,
    bodyweightSets: 0,
    plyoContacts: 0,
    timedSeconds: 0,
    conditioningSeconds: 0,
    conditioningDistanceM: 0,
    conditioningCalories: 0,
  };
}

function computeWorkout(w: RawWorkout, library: LibraryMap): SessionVolume {
  const patternTotals = new Map<PatternKey, PatternVolume>();
  const nonLoad = emptyNonLoad();
  const unclassified = new Set<string>();
  let tonnageKg = 0;
  let loadedSets = 0;
  let totalReps = 0;

  const bump = (pattern: PatternKey, kg: number, reps: number) => {
    const cur =
      patternTotals.get(pattern) ?? { pattern, tonnageKg: 0, sets: 0, reps: 0 };
    cur.tonnageKg += kg;
    cur.sets += 1;
    cur.reps += reps;
    patternTotals.set(pattern, cur);
  };

  for (const ex of w.workout_exercises ?? []) {
    const meta = library.get(ex.exercise_name.toLowerCase().trim());
    const pattern: PatternKey = meta?.pattern ?? "unclassified";

    for (const s of ex.exercise_sets ?? []) {
      if (!s.is_completed) continue;
      if (s.set_type && s.set_type !== "working") continue;

      const hasLoad = !!s.weight && s.weight > 0 && !!s.reps && s.reps > 0;
      if (hasLoad) {
        // Plyometric work is a contact count, not tonnage — never mixed in.
        if (meta?.isPlyometric || pattern === "plyometric") {
          nonLoad.plyoContacts += s.reps ?? 0;
          continue;
        }
        const kg = toKg(s.weight as number, s.unit) * (s.reps as number);
        tonnageKg += kg;
        loadedSets += 1;
        totalReps += s.reps as number;
        bump(pattern, kg, s.reps as number);
        if (!meta?.pattern) unclassified.add(ex.exercise_name);
        continue;
      }

      if (meta?.isPlyometric || pattern === "plyometric") {
        nonLoad.plyoContacts += s.reps ?? 0;
      } else if (s.reps && s.reps > 0) {
        nonLoad.bodyweightReps += s.reps;
        nonLoad.bodyweightSets += 1;
      }
      if (s.duration_seconds && s.duration_seconds > 0) {
        nonLoad.timedSeconds += s.duration_seconds;
      }
    }

    for (const c of ex.conditioning_sets ?? []) {
      if (!c.is_completed) continue;
      nonLoad.conditioningSeconds += c.duration_seconds ?? 0;
      if (c.distance && c.distance > 0) {
        nonLoad.conditioningDistanceM += distanceToM(c.distance, c.distance_unit);
      }
      nonLoad.conditioningCalories += c.calories ?? 0;
    }
  }

  const byPattern = PATTERN_ORDER.map((p) => patternTotals.get(p)).filter(
    (p): p is PatternVolume => !!p && p.tonnageKg > 0
  );

  return {
    workoutId: w.id,
    date: w.date,
    workoutName: w.workout_name,
    tonnageKg: Math.round(tonnageKg),
    loadedSets,
    totalReps,
    byPattern,
    nonLoad,
    unclassifiedMovements: Array.from(unclassified),
  };
}

export interface VolumeRange {
  sessions: SessionVolume[];
  tonnageKg: number;
  loadedSets: number;
  byPattern: PatternVolume[];
  nonLoad: NonLoadWork;
  unclassifiedMovements: string[];
}

export function aggregate(sessions: SessionVolume[]): VolumeRange {
  const totals = new Map<PatternKey, PatternVolume>();
  const nonLoad = emptyNonLoad();
  const unclassified = new Set<string>();
  let tonnageKg = 0;
  let loadedSets = 0;

  for (const s of sessions) {
    tonnageKg += s.tonnageKg;
    loadedSets += s.loadedSets;
    s.unclassifiedMovements.forEach((m) => unclassified.add(m));
    for (const p of s.byPattern) {
      const cur = totals.get(p.pattern) ?? { pattern: p.pattern, tonnageKg: 0, sets: 0, reps: 0 };
      cur.tonnageKg += p.tonnageKg;
      cur.sets += p.sets;
      cur.reps += p.reps;
      totals.set(p.pattern, cur);
    }
    nonLoad.bodyweightReps += s.nonLoad.bodyweightReps;
    nonLoad.bodyweightSets += s.nonLoad.bodyweightSets;
    nonLoad.plyoContacts += s.nonLoad.plyoContacts;
    nonLoad.timedSeconds += s.nonLoad.timedSeconds;
    nonLoad.conditioningSeconds += s.nonLoad.conditioningSeconds;
    nonLoad.conditioningDistanceM += s.nonLoad.conditioningDistanceM;
    nonLoad.conditioningCalories += s.nonLoad.conditioningCalories;
  }

  return {
    sessions,
    tonnageKg: Math.round(tonnageKg),
    loadedSets,
    byPattern: PATTERN_ORDER.map((p) => totals.get(p)).filter(
      (p): p is PatternVolume => !!p && p.tonnageKg > 0
    ),
    nonLoad,
    unclassifiedMovements: Array.from(unclassified),
  };
}

const SELECT =
  "id, date, workout_name, workout_exercises(exercise_name, exercise_type, exercise_sets(weight, reps, unit, is_completed, set_type, duration_seconds), conditioning_sets(duration_seconds, distance, distance_unit, calories, is_completed))";

/** Volume for one session (athlete or authorised coach, enforced by RLS). */
export async function fetchSessionVolume(
  workoutId: string,
  library: LibraryMap
): Promise<SessionVolume | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select(SELECT)
    .eq("id", workoutId)
    .maybeSingle();
  if (error || !data) return null;
  return computeWorkout(data as unknown as RawWorkout, library);
}

/** Volume for every session in a date range, newest first. */
export async function fetchVolumeRange(
  userId: string,
  fromDate: string,
  toDate: string,
  library: LibraryMap
): Promise<SessionVolume[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select(SELECT)
    .eq("user_id", userId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as RawWorkout[]).map((w) => computeWorkout(w, library));
}

/** Monday-based ISO week key. */
export function weekStartOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export interface WeekBucket {
  weekStart: string;
  tonnageKg: number;
  byPattern: PatternVolume[];
}

export function bucketByWeek(sessions: SessionVolume[], weeks: number): WeekBucket[] {
  const map = new Map<string, SessionVolume[]>();
  for (const s of sessions) {
    const k = weekStartOf(s.date);
    map.set(k, [...(map.get(k) ?? []), s]);
  }
  const start = new Date();
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const out: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i * 7);
    const key = d.toISOString().slice(0, 10);
    const agg = aggregate(map.get(key) ?? []);
    out.push({ weekStart: key, tonnageKg: agg.tonnageKg, byPattern: agg.byPattern });
  }
  return out;
}

export function formatTonnage(kg: number, unit: "kg" | "lbs"): string {
  const v = unit === "kg" ? kg : kg * LB_PER_KG;
  const label = unit === "kg" ? "kg" : "lb";
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k ${label}`;
  return `${Math.round(v).toLocaleString()} ${label}`;
}
