// ============= Nutrition Calculator Type Definitions =============

export type Sex = 'male' | 'female';
export type UnitSystem = 'imperial' | 'metric';

export type ActivityLevel = 
  | 'sedentary' 
  | 'lightly_active' 
  | 'moderately_active' 
  | 'very_active' 
  | 'extremely_active';

export type TrainingStyle = 'strength' | 'cardio' | 'hybrid' | 'crossfit';
export type JobActivity = 'seated' | 'standing' | 'physical_labor';

export type Goal = 
  | 'fat_loss' 
  | 'maintenance' 
  | 'muscle_gain' 
  | 'recomposition' 
  | 'performance';

export type RateOfChange = 'aggressive' | 'moderate' | 'conservative';

export type DietType = 
  | 'standard' 
  | 'keto' 
  | 'low_carb' 
  | 'high_carb' 
  | 'zone' 
  | 'custom';

export type ProteinPriority = 'minimum' | 'moderate' | 'high' | 'maximum';

export type FoodRestriction = 
  | 'none'
  | 'vegetarian' 
  | 'vegan' 
  | 'dairy_free' 
  | 'gluten_free';

export type BMRFormula = 
  | 'mifflin_st_jeor' 
  | 'harris_benedict' 
  | 'katch_mcardle' 
  | 'cunningham';

// ============= Input Data Types =============

export interface BiometricsData {
  weight: number; // Always stored in lbs internally
  height: number; // Always stored in inches internally
  age: number;
  sex: Sex;
  bodyFatPercent?: number; // Optional, enables Katch-McArdle
  unitSystem: UnitSystem;
}

export interface ActivityData {
  activityLevel: ActivityLevel;
  trainingDaysPerWeek: number;
  trainingStyle: TrainingStyle;
  jobActivity: JobActivity;
}

export interface GoalData {
  primaryGoal: Goal;
  rateOfChange: RateOfChange;
  timelineWeeks?: number;
}

export interface DietaryPreferences {
  dietType: DietType;
  proteinPriority: ProteinPriority;
  restrictions: FoodRestriction[];
  mealFrequency: number; // 2-6 meals per day
}

export interface NutritionInputData {
  biometrics: BiometricsData;
  activity: ActivityData;
  goals: GoalData;
  dietary: DietaryPreferences;
}

// ============= Calculation Results =============

export interface MacroBreakdown {
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  proteinCalories: number;
  carbCalories: number;
  fatCalories: number;
  proteinPercent: number;
  carbPercent: number;
  fatPercent: number;
}

export interface BMRComparison {
  formula: BMRFormula;
  label: string;
  value: number;
  isRecommended: boolean;
}

export interface AdvancedMetrics {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinPerLb: number;
  proteinPerLeanLb?: number;
  leanBodyMass?: number;
  fiberTarget: number;
  waterIntakeOz: number;
  calorieDeficitOrSurplus: number;
  weeklyWeightChange: number; // lbs per week
}

export interface MealBreakdown {
  mealNumber: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface NutritionResults {
  macros: MacroBreakdown;
  metrics: AdvancedMetrics;
  bmrComparison: BMRComparison[];
  mealBreakdown: MealBreakdown[];
  recommendations: string[];
}

// ============= Food Database Types =============

export type FoodCategory = 
  | 'lean_protein'
  | 'whole_protein'
  | 'dairy_vegetarian'
  | 'carbohydrate'
  | 'healthy_fat'
  | 'vegetable'
  | 'fruit'
  | 'supplement';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  notes?: string;
  tags: string[]; // e.g., ['keto-friendly', 'quick-cooking', 'budget']
}

// ============= Recipe Types =============

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
export type PrepTime = 'under_15' | '15_to_30' | 'over_30';

export interface RecipeIngredient {
  foodId: string;
  quantity: number; // number of servings
  customServingSize?: string;
}

export interface Recipe {
  id: string;
  name: string;
  mealType: MealType;
  prepTime: PrepTime;
  prepMinutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  tags: string[]; // e.g., ['keto', 'vegetarian', 'high-protein']
  imageUrl?: string;
}

// ============= Meal Plan Types =============

export interface PlannedMeal {
  mealNumber: number;
  name: string;
  foods: {
    foodItem: FoodItem;
    servings: number;
    calculatedMacros: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface DailyMealPlan {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  meals: PlannedMeal[];
  actualCalories: number;
  actualProtein: number;
  actualCarbs: number;
  actualFats: number;
  variance: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

// ============= Activity Multipliers =============

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

// ============= Goal Modifiers (calorie adjustment) =============

export const GOAL_MODIFIERS: Record<Goal, Record<RateOfChange, number>> = {
  fat_loss: {
    aggressive: -750,
    moderate: -500,
    conservative: -250,
  },
  maintenance: {
    aggressive: 0,
    moderate: 0,
    conservative: 0,
  },
  muscle_gain: {
    aggressive: 750,
    moderate: 500,
    conservative: 250,
  },
  recomposition: {
    aggressive: 0,
    moderate: 0,
    conservative: 0,
  },
  performance: {
    aggressive: 500,
    moderate: 300,
    conservative: 150,
  },
};

// ============= Macro Splits by Diet Type =============

export const MACRO_SPLITS: Record<DietType, { protein: number; carbs: number; fats: number }> = {
  standard: { protein: 30, carbs: 40, fats: 30 },
  high_carb: { protein: 25, carbs: 50, fats: 25 },
  low_carb: { protein: 35, carbs: 25, fats: 40 },
  keto: { protein: 30, carbs: 5, fats: 65 },
  zone: { protein: 30, carbs: 40, fats: 30 },
  custom: { protein: 30, carbs: 40, fats: 30 }, // Default, will be overridden
};

// ============= Protein Multipliers (g per lb bodyweight) =============

export const PROTEIN_MULTIPLIERS: Record<ProteinPriority, Record<Goal, { min: number; max: number }>> = {
  minimum: {
    fat_loss: { min: 0.8, max: 1.0 },
    maintenance: { min: 0.7, max: 0.8 },
    muscle_gain: { min: 0.8, max: 1.0 },
    recomposition: { min: 0.9, max: 1.0 },
    performance: { min: 0.8, max: 1.0 },
  },
  moderate: {
    fat_loss: { min: 1.0, max: 1.2 },
    maintenance: { min: 0.8, max: 1.0 },
    muscle_gain: { min: 1.0, max: 1.2 },
    recomposition: { min: 1.0, max: 1.2 },
    performance: { min: 1.0, max: 1.2 },
  },
  high: {
    fat_loss: { min: 1.2, max: 1.4 },
    maintenance: { min: 1.0, max: 1.2 },
    muscle_gain: { min: 1.2, max: 1.4 },
    recomposition: { min: 1.2, max: 1.4 },
    performance: { min: 1.2, max: 1.4 },
  },
  maximum: {
    fat_loss: { min: 1.4, max: 1.6 },
    maintenance: { min: 1.2, max: 1.4 },
    muscle_gain: { min: 1.4, max: 1.6 },
    recomposition: { min: 1.4, max: 1.6 },
    performance: { min: 1.4, max: 1.6 },
  },
};
