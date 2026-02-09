// Weight conversion utilities

export type WeightUnit = 'lbs' | 'kg';

const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;

export const toKg = (lbs: number): number => {
  return Math.round(lbs * LBS_TO_KG * 10) / 10;
};

export const toLbs = (kg: number): number => {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
};

export const convertWeight = (weight: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return weight;
  return from === 'lbs' ? toKg(weight) : toLbs(weight);
};

export const formatWeight = (weight: number, unit: WeightUnit): string => {
  return `${weight.toLocaleString()} ${unit}`;
};

export const getStoredUnit = (): WeightUnit => {
  const stored = localStorage.getItem('workout-unit');
  return (stored === 'kg' || stored === 'lbs') ? stored : 'lbs';
};

export const setStoredUnit = (unit: WeightUnit): void => {
  localStorage.setItem('workout-unit', unit);
};
