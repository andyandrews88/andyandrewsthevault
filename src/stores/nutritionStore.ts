import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BiometricsData,
  ActivityData,
  GoalData,
  DietaryPreferences,
  NutritionResults,
  MacroBreakdown,
  AdvancedMetrics,
  BMRComparison,
  MealBreakdown,
  ACTIVITY_MULTIPLIERS,
  GOAL_MODIFIERS,
  MACRO_SPLITS,
  PROTEIN_MULTIPLIERS,
  UnitSystem,
} from '@/types/nutrition';
import { useAuditStore } from './auditStore';

interface NutritionStore {
  // Form state
  currentStep: number;
  biometrics: Partial<BiometricsData>;
  activity: Partial<ActivityData>;
  goals: Partial<GoalData>;
  dietary: Partial<DietaryPreferences>;
  
  // Results
  results: NutritionResults | null;
  
  // Actions
  setStep: (step: number) => void;
  updateBiometrics: (data: Partial<BiometricsData>) => void;
  updateActivity: (data: Partial<ActivityData>) => void;
  updateGoals: (data: Partial<GoalData>) => void;
  updateDietary: (data: Partial<DietaryPreferences>) => void;
  calculateResults: () => void;
  prefillFromAudit: () => void;
  reset: () => void;
}

// ============= Calculation Utilities =============

function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

function inchesToCm(inches: number): number {
  return inches * 2.54;
}

function kgToLbs(kg: number): number {
  return kg / 0.453592;
}

function cmToInches(cm: number): number {
  return cm / 2.54;
}

// Convert input to internal units (always lbs/inches)
export function toInternalUnits(value: number, type: 'weight' | 'height', unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') return value;
  return type === 'weight' ? kgToLbs(value) : cmToInches(value);
}

// Convert internal units to display units
export function toDisplayUnits(value: number, type: 'weight' | 'height', unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') return value;
  return type === 'weight' ? lbsToKg(value) : inchesToCm(value);
}

// ============= BMR Formulas =============

function calculateMifflinStJeor(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return sex === 'male' ? base + 5 : base - 161;
}

function calculateHarrisBenedict(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  if (sex === 'male') {
    return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
  }
  return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
}

function calculateKatchMcArdle(leanBodyMassKg: number): number {
  return 370 + (21.6 * leanBodyMassKg);
}

function calculateCunningham(leanBodyMassKg: number): number {
  return 500 + (22 * leanBodyMassKg);
}

// ============= Main Calculation Logic =============

function calculateNutrition(
  biometrics: BiometricsData,
  activity: ActivityData,
  goals: GoalData,
  dietary: DietaryPreferences
): NutritionResults {
  // Convert to metric for calculations
  const weightKg = lbsToKg(biometrics.weight);
  const heightCm = inchesToCm(biometrics.height);
  const weightLbs = biometrics.weight;
  
  // Calculate Lean Body Mass if body fat % provided
  const hasBodyFat = biometrics.bodyFatPercent !== undefined && biometrics.bodyFatPercent > 0;
  const lbmKg = hasBodyFat 
    ? weightKg * (1 - (biometrics.bodyFatPercent! / 100))
    : undefined;
  const lbmLbs = lbmKg ? kgToLbs(lbmKg) : undefined;
  
  // Calculate all BMR formulas for comparison
  const bmrMifflin = calculateMifflinStJeor(weightKg, heightCm, biometrics.age, biometrics.sex);
  const bmrHarris = calculateHarrisBenedict(weightKg, heightCm, biometrics.age, biometrics.sex);
  const bmrKatch = lbmKg ? calculateKatchMcArdle(lbmKg) : null;
  const bmrCunningham = lbmKg ? calculateCunningham(lbmKg) : null;
  
  // Determine recommended formula
  const recommendedBMR = hasBodyFat && bmrKatch ? bmrKatch : bmrMifflin;
  
  const bmrComparison: BMRComparison[] = [
    { formula: 'mifflin_st_jeor', label: 'Mifflin-St Jeor', value: Math.round(bmrMifflin), isRecommended: !hasBodyFat },
    { formula: 'harris_benedict', label: 'Harris-Benedict', value: Math.round(bmrHarris), isRecommended: false },
  ];
  
  if (bmrKatch) {
    bmrComparison.push({ formula: 'katch_mcardle', label: 'Katch-McArdle', value: Math.round(bmrKatch), isRecommended: hasBodyFat });
  }
  if (bmrCunningham) {
    bmrComparison.push({ formula: 'cunningham', label: 'Cunningham', value: Math.round(bmrCunningham), isRecommended: false });
  }
  
  // Calculate TDEE
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activity.activityLevel];
  const tdee = recommendedBMR * activityMultiplier;
  
  // Apply goal modifier
  const goalModifier = GOAL_MODIFIERS[goals.primaryGoal][goals.rateOfChange];
  const targetCalories = Math.round(tdee + goalModifier);
  
  // Get macro split
  const macroSplit = MACRO_SPLITS[dietary.dietType];
  
  // Calculate protein based on priority and goal
  const proteinRange = PROTEIN_MULTIPLIERS[dietary.proteinPriority][goals.primaryGoal];
  const proteinPerLb = (proteinRange.min + proteinRange.max) / 2;
  let proteinGrams = Math.round(weightLbs * proteinPerLb);
  
  // For keto, ensure protein doesn't exceed 30% of calories
  const proteinCalories = proteinGrams * 4;
  const maxProteinCalories = targetCalories * (macroSplit.protein / 100);
  if (dietary.dietType === 'keto' && proteinCalories > maxProteinCalories) {
    proteinGrams = Math.round(maxProteinCalories / 4);
  }
  
  // Calculate remaining calories for carbs and fats
  const remainingCalories = targetCalories - (proteinGrams * 4);
  
  // Distribute remaining calories based on diet type ratios (excluding protein portion)
  const carbFatRatio = macroSplit.carbs / (macroSplit.carbs + macroSplit.fats);
  const carbCalories = remainingCalories * carbFatRatio;
  const fatCalories = remainingCalories * (1 - carbFatRatio);
  
  const carbGrams = Math.round(carbCalories / 4);
  const fatGrams = Math.round(fatCalories / 9);
  
  // Calculate actual percentages
  const actualProteinCalories = proteinGrams * 4;
  const actualCarbCalories = carbGrams * 4;
  const actualFatCalories = fatGrams * 9;
  const totalCaloriesActual = actualProteinCalories + actualCarbCalories + actualFatCalories;
  
  const macros: MacroBreakdown = {
    protein: proteinGrams,
    carbs: carbGrams,
    fats: fatGrams,
    proteinCalories: actualProteinCalories,
    carbCalories: actualCarbCalories,
    fatCalories: actualFatCalories,
    proteinPercent: Math.round((actualProteinCalories / totalCaloriesActual) * 100),
    carbPercent: Math.round((actualCarbCalories / totalCaloriesActual) * 100),
    fatPercent: Math.round((actualFatCalories / totalCaloriesActual) * 100),
  };
  
  // Advanced metrics
  const fiberTarget = Math.round(targetCalories / 1000 * 14); // 14g per 1000 cal
  const waterIntakeOz = Math.round(weightLbs * 0.5); // 0.5 oz per lb bodyweight
  const weeklyWeightChange = goalModifier / 3500; // 3500 cal = 1 lb
  
  const metrics: AdvancedMetrics = {
    bmr: Math.round(recommendedBMR),
    tdee: Math.round(tdee),
    targetCalories,
    proteinPerLb,
    proteinPerLeanLb: lbmLbs ? proteinGrams / lbmLbs : undefined,
    leanBodyMass: lbmLbs,
    fiberTarget,
    waterIntakeOz,
    calorieDeficitOrSurplus: goalModifier,
    weeklyWeightChange: Math.round(weeklyWeightChange * 100) / 100,
  };
  
  // Generate meal breakdown
  const mealBreakdown = generateMealBreakdown(targetCalories, macros, dietary.mealFrequency);
  
  // Generate recommendations
  const recommendations = generateRecommendations(biometrics, activity, goals, dietary, metrics);
  
  return {
    macros,
    metrics,
    bmrComparison,
    mealBreakdown,
    recommendations,
  };
}

function generateMealBreakdown(
  targetCalories: number,
  macros: MacroBreakdown,
  mealFrequency: number
): MealBreakdown[] {
  const mealNames = [
    'Breakfast',
    'Lunch',
    'Pre-Workout',
    'Dinner',
    'Evening Snack',
    'Late Night',
  ];
  
  // Distribution percentages based on meal frequency
  const distributions: Record<number, number[]> = {
    2: [45, 55],
    3: [30, 40, 30],
    4: [25, 30, 20, 25],
    5: [20, 25, 15, 25, 15],
    6: [15, 20, 15, 25, 15, 10],
  };
  
  const dist = distributions[mealFrequency] || distributions[4];
  
  return dist.map((percent, index) => ({
    mealNumber: index + 1,
    name: mealNames[index] || `Meal ${index + 1}`,
    calories: Math.round(targetCalories * (percent / 100)),
    protein: Math.round(macros.protein * (percent / 100)),
    carbs: Math.round(macros.carbs * (percent / 100)),
    fats: Math.round(macros.fats * (percent / 100)),
  }));
}

function generateRecommendations(
  biometrics: BiometricsData,
  activity: ActivityData,
  goals: GoalData,
  dietary: DietaryPreferences,
  metrics: AdvancedMetrics
): string[] {
  const recommendations: string[] = [];
  
  // Goal-specific recommendations
  if (goals.primaryGoal === 'fat_loss') {
    recommendations.push('Prioritize protein at every meal to preserve muscle mass during your cut.');
    recommendations.push('Focus on high-volume, low-calorie foods like vegetables to stay satiated.');
    if (goals.rateOfChange === 'aggressive') {
      recommendations.push('⚠️ Aggressive cuts can impact performance. Consider diet breaks every 4-6 weeks.');
    }
  }
  
  if (goals.primaryGoal === 'muscle_gain') {
    recommendations.push('Time carbohydrates around training for optimal performance and recovery.');
    recommendations.push('Ensure adequate sleep (7-9 hours) to maximize anabolic hormone production.');
  }
  
  if (goals.primaryGoal === 'recomposition') {
    recommendations.push('Body recomposition works best with higher protein intake and resistance training.');
    recommendations.push('Progress will be slower but sustainable. Track body measurements, not just weight.');
  }
  
  // Diet-specific recommendations
  if (dietary.dietType === 'keto') {
    recommendations.push('Monitor electrolytes (sodium, potassium, magnesium) during keto adaptation.');
    recommendations.push('Consider a targeted keto approach with carbs around training if performance suffers.');
  }
  
  // Activity recommendations
  if (activity.trainingDaysPerWeek >= 5 && activity.trainingStyle === 'crossfit') {
    recommendations.push('High-frequency CrossFit training may require higher carb intake on training days.');
  }
  
  // Hydration
  recommendations.push(`Target ${Math.round(metrics.waterIntakeOz / 8)} cups (${metrics.waterIntakeOz} oz) of water daily.`);
  
  // Fiber
  recommendations.push(`Aim for at least ${metrics.fiberTarget}g of fiber daily from whole food sources.`);
  
  return recommendations;
}

// ============= Store =============

export const useNutritionStore = create<NutritionStore>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      biometrics: { unitSystem: 'imperial' },
      activity: {},
      goals: {},
      dietary: { restrictions: [], mealFrequency: 4 },
      results: null,

      setStep: (step) => set({ currentStep: step }),

      updateBiometrics: (data) => set((state) => ({
        biometrics: { ...state.biometrics, ...data }
      })),

      updateActivity: (data) => set((state) => ({
        activity: { ...state.activity, ...data }
      })),

      updateGoals: (data) => set((state) => ({
        goals: { ...state.goals, ...data }
      })),

      updateDietary: (data) => set((state) => ({
        dietary: { ...state.dietary, ...data }
      })),

      calculateResults: () => {
        const { biometrics, activity, goals, dietary } = get();
        
        // Validate all required data is present
        if (
          !biometrics.weight || !biometrics.height || !biometrics.age || !biometrics.sex ||
          !activity.activityLevel || !activity.trainingDaysPerWeek || !activity.trainingStyle || !activity.jobActivity ||
          !goals.primaryGoal || !goals.rateOfChange ||
          !dietary.dietType || !dietary.proteinPriority || dietary.mealFrequency === undefined
        ) {
          console.error('Missing required nutrition data');
          return;
        }
        
        const results = calculateNutrition(
          biometrics as BiometricsData,
          activity as ActivityData,
          goals as GoalData,
          dietary as DietaryPreferences
        );
        
        set({ results });
      },

      prefillFromAudit: () => {
        const auditStore = useAuditStore.getState();
        if (auditStore.data.weight && auditStore.data.height && auditStore.data.age) {
          set((state) => ({
            biometrics: {
              ...state.biometrics,
              weight: auditStore.data.weight,
              height: auditStore.data.height,
              age: auditStore.data.age,
            }
          }));
        }
      },

      reset: () => set({
        currentStep: 0,
        biometrics: { unitSystem: 'imperial' },
        activity: {},
        goals: {},
        dietary: { restrictions: [], mealFrequency: 4 },
        results: null,
      }),
    }),
    {
      name: 'nutrition-store',
      partialize: (state) => ({
        biometrics: state.biometrics,
        activity: state.activity,
        goals: state.goals,
        dietary: state.dietary,
        results: state.results,
      }),
    }
  )
);
