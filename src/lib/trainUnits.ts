import type { SetUnit } from "@/types/workout";
import { getStoredUnit, type WeightUnit } from "@/lib/weightConversion";

const LB_PER_KG = 2.20462;

/** App preference ('lbs' | 'kg') -> database enum ('lb' | 'kg'). */
export function prefToSetUnit(pref: WeightUnit): SetUnit {
  return pref === "kg" ? "kg" : "lb";
}

export function defaultSetUnit(): SetUnit {
  return prefToSetUnit(getStoredUnit());
}

export function convertSetWeight(value: number, from: SetUnit, to: SetUnit): number {
  if (from === to) return value;
  const converted = from === "lb" ? value / LB_PER_KG : value * LB_PER_KG;
  return Math.round(converted * 10) / 10;
}

export function formatSetWeight(weight: number | null | undefined, unit: SetUnit): string {
  if (weight === null || weight === undefined) return "—";
  return `${Math.round(weight * 10) / 10}${unit}`;
}

/** Epley estimate; only meaningful for 1-12 reps. */
export function estimate1RM(weight: number | null, reps: number | null): number | null {
  if (!weight || !reps || weight <= 0 || reps <= 0 || reps > 12) return null;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function parseNum(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function durationToParts(seconds: number | null | undefined) {
  const total = seconds ?? 0;
  return {
    minutes: total ? String(Math.floor(total / 60)) : "",
    seconds: total ? String(total % 60).padStart(2, "0") : "",
  };
}

export function partsToDuration(minutes: string, seconds: string): number | null {
  const m = parseNum(minutes);
  const s = parseNum(seconds);
  if (m === null && s === null) return null;
  return (m ?? 0) * 60 + (s ?? 0);
}
