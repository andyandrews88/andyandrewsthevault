// ============= Unit Conversion System =============

export type MeasurementUnit = 'g' | 'oz' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'ml' | 'palm' | 'cupped_hand' | 'thumb' | 'fist';

export interface UnitOption {
  value: MeasurementUnit;
  label: string;
  shortLabel: string;
}

export const UNIT_OPTIONS: UnitOption[] = [
  { value: 'g', label: 'Grams', shortLabel: 'g' },
  { value: 'oz', label: 'Ounces', shortLabel: 'oz' },
  { value: 'cup', label: 'Cups', shortLabel: 'cup' },
  { value: 'tbsp', label: 'Tablespoons', shortLabel: 'tbsp' },
  { value: 'tsp', label: 'Teaspoons', shortLabel: 'tsp' },
  { value: 'piece', label: 'Pieces', shortLabel: 'pc' },
  { value: 'ml', label: 'Milliliters', shortLabel: 'ml' },
  { value: 'palm', label: 'Palm', shortLabel: '✋' },
  { value: 'cupped_hand', label: 'Cupped Hand', shortLabel: '🤲' },
  { value: 'thumb', label: 'Thumb', shortLabel: '👍' },
  { value: 'fist', label: 'Fist', shortLabel: '👊' },
];

// Hand portion units — these use a special calculation path (amount = servings of the food)
export const HAND_PORTION_UNITS: MeasurementUnit[] = ['palm', 'cupped_hand', 'thumb', 'fist'];

export function isHandPortionUnit(unit: MeasurementUnit): boolean {
  return HAND_PORTION_UNITS.includes(unit);
}

// Conversion factors to grams (base unit)
const GRAMS_CONVERSION: Record<MeasurementUnit, number> = {
  g: 1,
  oz: 28.3495,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  piece: 1,
  ml: 1,
  palm: 1,
  cupped_hand: 1,
  thumb: 1,
  fist: 1,
};

// Convert from any unit to grams
export function toGrams(value: number, unit: MeasurementUnit, servingGrams?: number): number {
  if (unit === 'piece' && servingGrams) {
    return value * servingGrams;
  }
  return value * GRAMS_CONVERSION[unit];
}

// Convert from grams to any unit
export function fromGrams(grams: number, unit: MeasurementUnit, servingGrams?: number): number {
  if (unit === 'piece' && servingGrams) {
    return grams / servingGrams;
  }
  return grams / GRAMS_CONVERSION[unit];
}

// Convert between any two units
export function convertUnit(
  value: number, 
  fromUnit: MeasurementUnit, 
  toUnit: MeasurementUnit,
  servingGrams?: number
): number {
  if (fromUnit === toUnit) return value;
  const grams = toGrams(value, fromUnit, servingGrams);
  return fromGrams(grams, toUnit, servingGrams);
}

// Calculate macros based on serving amount
export function calculateMacros(
  baseCalories: number,
  baseProtein: number,
  baseCarbs: number,
  baseFats: number,
  baseServingGrams: number,
  amount: number,
  unit: MeasurementUnit
): { calories: number; protein: number; carbs: number; fats: number } {
  // Hand portion units treat amount as number of servings directly
  if (isHandPortionUnit(unit)) {
    return {
      calories: Math.round(baseCalories * amount),
      protein: Math.round(baseProtein * amount * 10) / 10,
      carbs: Math.round(baseCarbs * amount * 10) / 10,
      fats: Math.round(baseFats * amount * 10) / 10,
    };
  }

  const grams = toGrams(amount, unit, baseServingGrams);
  const multiplier = grams / baseServingGrams;
  
  return {
    calories: Math.round(baseCalories * multiplier),
    protein: Math.round(baseProtein * multiplier * 10) / 10,
    carbs: Math.round(baseCarbs * multiplier * 10) / 10,
    fats: Math.round(baseFats * multiplier * 10) / 10,
  };
}

// Get available units for a food item based on its category
export function getAvailableUnits(category: string): MeasurementUnit[] {
  const baseUnits: MeasurementUnit[] = ['g', 'oz'];
  
  switch (category) {
    case 'lean_protein':
    case 'whole_protein':
      return [...baseUnits, 'piece'];
    case 'dairy_vegetarian':
      return [...baseUnits, 'cup', 'tbsp'];
    case 'carbohydrate':
      return [...baseUnits, 'cup', 'piece'];
    case 'healthy_fat':
      return [...baseUnits, 'tbsp', 'tsp'];
    case 'vegetable':
    case 'fruit':
      return [...baseUnits, 'cup', 'piece'];
    case 'supplement':
      return ['g', 'piece'];
    default:
      return baseUnits;
  }
}

// Format a measurement for display
export function formatMeasurement(amount: number, unit: MeasurementUnit): string {
  const unitLabel = UNIT_OPTIONS.find(u => u.value === unit)?.shortLabel || unit;
  
  // Round to 1 decimal place for cleaner display
  const roundedAmount = Math.round(amount * 10) / 10;
  
  return `${roundedAmount} ${unitLabel}`;
}

// Parse a serving size string to extract amount and unit
export function parseServingSize(servingSize: string): { amount: number; unit: MeasurementUnit } {
  const match = servingSize.match(/^([\d.]+)\s*(.+)$/);
  
  if (!match) {
    return { amount: 1, unit: 'piece' };
  }
  
  const amount = parseFloat(match[1]);
  const unitStr = match[2].toLowerCase().trim();
  
  const unitMap: Record<string, MeasurementUnit> = {
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'oz': 'oz',
    'ounce': 'oz',
    'ounces': 'oz',
    'cup': 'cup',
    'cups': 'cup',
    'tbsp': 'tbsp',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'tsp': 'tsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'ml': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'piece': 'piece',
    'pieces': 'piece',
    'large': 'piece',
    'medium': 'piece',
    'small': 'piece',
    'slice': 'piece',
    'slices': 'piece',
    'scoop': 'piece',
    'wings': 'piece',
  };
  
  const unit = unitMap[unitStr] || 'piece';
  
  return { amount, unit };
}
