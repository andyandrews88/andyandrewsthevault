// Precision Nutrition Hand Portion System
// 1 Palm = ~25g Protein | 1 Cupped Hand = ~25g Carbs | 1 Thumb = ~10g Fat

export interface HandPortions {
  palms: number;      // Protein portions (✋)
  cuppedHands: number; // Carb portions (🤲)
  thumbs: number;     // Fat portions (👍)
}

export const PORTION_LABELS = {
  palms: { emoji: '✋', label: 'Palms', macro: 'Protein', gramsPerPortion: 25 },
  cuppedHands: { emoji: '🤲', label: 'Cupped Hands', macro: 'Carbs', gramsPerPortion: 25 },
  thumbs: { emoji: '👍', label: 'Thumbs', macro: 'Fats', gramsPerPortion: 10 },
} as const;

/** Convert gram-based macros into PN hand portions */
export function macrosToPortions(protein: number, carbs: number, fats: number): HandPortions {
  return {
    palms: Math.round((protein / 25) * 10) / 10,
    cuppedHands: Math.round((carbs / 25) * 10) / 10,
    thumbs: Math.round((fats / 10) * 10) / 10,
  };
}

/** Convert macro targets into target hand portions */
export function portionsFromTargets(targetProtein: number, targetCarbs: number, targetFats: number): HandPortions {
  return {
    palms: Math.round(targetProtein / 25),
    cuppedHands: Math.round(targetCarbs / 25),
    thumbs: Math.round(targetFats / 10),
  };
}

/** Format portion progress as "consumed/target" */
export function formatPortionProgress(consumed: number, target: number): string {
  return `${consumed}/${target}`;
}

/** Get a compact inline label for a food item's portions (e.g., "✋1 👍0.5") */
export function inlinePortionLabel(protein: number, carbs: number, fats: number): string {
  const portions = macrosToPortions(protein, carbs, fats);
  const parts: string[] = [];
  if (portions.palms >= 0.5) parts.push(`✋${portions.palms}`);
  if (portions.cuppedHands >= 0.5) parts.push(`🤲${portions.cuppedHands}`);
  if (portions.thumbs >= 0.5) parts.push(`👍${portions.thumbs}`);
  return parts.join(' ');
}
