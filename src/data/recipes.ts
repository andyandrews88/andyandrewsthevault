import { Recipe, MealType, PrepTime } from '@/types/nutrition';

export const recipes: Recipe[] = [
  // ============= BREAKFAST =============
  {
    id: 'power-breakfast-bowl',
    name: 'Power Breakfast Bowl',
    mealType: 'breakfast',
    prepTime: 'under_15',
    prepMinutes: 10,
    servings: 1,
    ingredients: [
      { foodId: 'whole-eggs', quantity: 1 }, // 3 eggs
      { foodId: 'oats', quantity: 1 },
      { foodId: 'banana', quantity: 1 },
      { foodId: 'peanut-butter', quantity: 0.5 },
    ],
    instructions: [
      'Cook oatmeal according to package directions.',
      'While oats cook, scramble eggs in a separate pan.',
      'Slice banana and add to oatmeal.',
      'Top with peanut butter and scrambled eggs on the side.',
    ],
    totalCalories: 660,
    totalProtein: 35,
    totalCarbs: 67,
    totalFats: 28,
    tags: ['high-protein', 'balanced', 'meal-prep'],
  },
  {
    id: 'greek-yogurt-parfait',
    name: 'Protein Parfait',
    mealType: 'breakfast',
    prepTime: 'under_15',
    prepMinutes: 5,
    servings: 1,
    ingredients: [
      { foodId: 'greek-yogurt-0', quantity: 1 },
      { foodId: 'blueberries', quantity: 0.5 },
      { foodId: 'almonds', quantity: 0.5 },
      { foodId: 'chia-seeds', quantity: 0.5 },
    ],
    instructions: [
      'Layer Greek yogurt in a bowl or jar.',
      'Add blueberries on top.',
      'Sprinkle with almonds and chia seeds.',
      'Optional: drizzle with honey.',
    ],
    totalCalories: 340,
    totalProtein: 32,
    totalCarbs: 28,
    totalFats: 14,
    tags: ['quick', 'high-protein', 'vegetarian', 'no-cook'],
  },
  {
    id: 'egg-white-veggie-scramble',
    name: 'Egg White Veggie Scramble',
    mealType: 'breakfast',
    prepTime: 'under_15',
    prepMinutes: 12,
    servings: 1,
    ingredients: [
      { foodId: 'egg-whites', quantity: 1.5 }, // 6 egg whites
      { foodId: 'spinach', quantity: 1 },
      { foodId: 'bell-peppers', quantity: 0.5 },
      { foodId: 'cheese-mozzarella', quantity: 1 },
    ],
    instructions: [
      'Sauté spinach and bell peppers in a non-stick pan.',
      'Pour in egg whites and scramble until cooked.',
      'Top with shredded mozzarella cheese.',
      'Season with salt and pepper to taste.',
    ],
    totalCalories: 220,
    totalProtein: 30,
    totalCarbs: 12,
    totalFats: 6,
    tags: ['low-calorie', 'high-protein', 'vegetarian', 'keto-friendly'],
  },
  
  // ============= LUNCH =============
  {
    id: 'chicken-rice-bowl',
    name: 'Classic Chicken & Rice Bowl',
    mealType: 'lunch',
    prepTime: '15_to_30',
    prepMinutes: 25,
    servings: 1,
    ingredients: [
      { foodId: 'chicken-breast', quantity: 1.5 }, // 6oz
      { foodId: 'white-rice', quantity: 1.5 },
      { foodId: 'broccoli', quantity: 1 },
      { foodId: 'olive-oil', quantity: 0.5 },
    ],
    instructions: [
      'Cook rice according to package directions.',
      'Season chicken breast with salt, pepper, and garlic.',
      'Grill or pan-sear chicken until internal temp reaches 165°F.',
      'Steam broccoli until tender-crisp.',
      'Slice chicken and serve over rice with broccoli.',
      'Drizzle with olive oil.',
    ],
    totalCalories: 550,
    totalProtein: 45,
    totalCarbs: 58,
    totalFats: 12,
    tags: ['meal-prep', 'balanced', 'gluten-free'],
  },
  {
    id: 'salmon-quinoa-bowl',
    name: 'Omega Power Bowl',
    mealType: 'lunch',
    prepTime: '15_to_30',
    prepMinutes: 25,
    servings: 1,
    ingredients: [
      { foodId: 'salmon', quantity: 1 },
      { foodId: 'quinoa', quantity: 1 },
      { foodId: 'avocado', quantity: 1 },
      { foodId: 'spinach', quantity: 1 },
    ],
    instructions: [
      'Cook quinoa according to package directions.',
      'Season salmon with lemon, dill, salt, and pepper.',
      'Bake salmon at 400°F for 12-15 minutes.',
      'Create a bed of fresh spinach.',
      'Top with quinoa, salmon, and sliced avocado.',
    ],
    totalCalories: 730,
    totalProtein: 47,
    totalCarbs: 51,
    totalFats: 38,
    tags: ['omega-3', 'nutrient-dense', 'gluten-free'],
  },
  {
    id: 'turkey-wrap',
    name: 'High-Protein Turkey Wrap',
    mealType: 'lunch',
    prepTime: 'under_15',
    prepMinutes: 8,
    servings: 1,
    ingredients: [
      { foodId: 'turkey-breast-deli', quantity: 1 },
      { foodId: 'bread-whole-wheat', quantity: 2 }, // or tortilla
      { foodId: 'cheese-cheddar', quantity: 1 },
      { foodId: 'spinach', quantity: 0.5 },
    ],
    instructions: [
      'Lay out whole wheat wrap or bread.',
      'Layer turkey, cheese, and spinach.',
      'Add mustard or desired condiments.',
      'Roll up tightly and slice in half.',
    ],
    totalCalories: 385,
    totalProtein: 38,
    totalCarbs: 27,
    totalFats: 14,
    tags: ['quick', 'portable', 'no-cook'],
  },
  
  // ============= DINNER =============
  {
    id: 'steak-sweet-potato',
    name: 'Steak & Sweet Potato',
    mealType: 'dinner',
    prepTime: 'over_30',
    prepMinutes: 35,
    servings: 1,
    ingredients: [
      { foodId: 'ribeye-steak', quantity: 1 },
      { foodId: 'sweet-potato', quantity: 1.5 },
      { foodId: 'asparagus', quantity: 1 },
      { foodId: 'olive-oil', quantity: 0.5 },
    ],
    instructions: [
      'Pierce sweet potatoes and microwave for 8-10 minutes.',
      'Season steak with salt and pepper.',
      'Heat cast iron pan to high heat.',
      'Sear steak 4-5 minutes per side for medium.',
      'Rest steak for 5 minutes before slicing.',
      'Sauté asparagus in olive oil.',
      'Serve steak with sweet potato and asparagus.',
    ],
    totalCalories: 620,
    totalProtein: 29,
    totalCarbs: 42,
    totalFats: 37,
    tags: ['high-satiety', 'gluten-free', 'premium'],
  },
  {
    id: 'ground-turkey-stir-fry',
    name: 'Turkey Vegetable Stir-Fry',
    mealType: 'dinner',
    prepTime: '15_to_30',
    prepMinutes: 20,
    servings: 1,
    ingredients: [
      { foodId: 'ground-turkey-93', quantity: 1 },
      { foodId: 'white-rice', quantity: 1 },
      { foodId: 'mixed-vegetables', quantity: 1 },
      { foodId: 'coconut-oil', quantity: 0.5 },
    ],
    instructions: [
      'Cook rice according to package directions.',
      'Heat coconut oil in a wok or large pan.',
      'Brown ground turkey, breaking into crumbles.',
      'Add frozen mixed vegetables and stir-fry until tender.',
      'Season with soy sauce, garlic, and ginger.',
      'Serve over rice.',
    ],
    totalCalories: 535,
    totalProtein: 32,
    totalCarbs: 62,
    totalFats: 17,
    tags: ['quick', 'meal-prep', 'balanced'],
  },
  {
    id: 'baked-salmon-rice',
    name: 'Lemon Herb Salmon',
    mealType: 'dinner',
    prepTime: '15_to_30',
    prepMinutes: 25,
    servings: 1,
    ingredients: [
      { foodId: 'salmon', quantity: 1.5 }, // 6oz
      { foodId: 'brown-rice', quantity: 1 },
      { foodId: 'green-beans', quantity: 1 },
      { foodId: 'olive-oil', quantity: 1 },
    ],
    instructions: [
      'Cook brown rice according to package directions.',
      'Season salmon with lemon juice, dill, salt, and pepper.',
      'Bake at 400°F for 15 minutes.',
      'Steam green beans until tender.',
      'Toss green beans with olive oil and garlic.',
      'Plate salmon with rice and green beans.',
    ],
    totalCalories: 715,
    totalProtein: 45,
    totalCarbs: 54,
    totalFats: 35,
    tags: ['omega-3', 'heart-healthy', 'gluten-free'],
  },
  
  // ============= SNACKS =============
  {
    id: 'cottage-cheese-fruit',
    name: 'Cottage Cheese & Fruit',
    mealType: 'snack',
    prepTime: 'under_15',
    prepMinutes: 3,
    servings: 1,
    ingredients: [
      { foodId: 'cottage-cheese-2', quantity: 1 },
      { foodId: 'strawberries', quantity: 0.5 },
    ],
    instructions: [
      'Scoop cottage cheese into a bowl.',
      'Top with sliced strawberries.',
      'Optional: add a drizzle of honey or cinnamon.',
    ],
    totalCalories: 205,
    totalProtein: 26,
    totalCarbs: 14,
    totalFats: 5,
    tags: ['quick', 'high-protein', 'vegetarian', 'pre-bed'],
  },
  {
    id: 'protein-shake-peanut-butter',
    name: 'PB Protein Shake',
    mealType: 'snack',
    prepTime: 'under_15',
    prepMinutes: 5,
    servings: 1,
    ingredients: [
      { foodId: 'whey-protein', quantity: 1 },
      { foodId: 'banana', quantity: 1 },
      { foodId: 'peanut-butter', quantity: 0.5 },
    ],
    instructions: [
      'Add whey protein, banana, and peanut butter to blender.',
      'Add 8-10 oz water or milk.',
      'Blend until smooth.',
      'Optional: add ice for thickness.',
    ],
    totalCalories: 320,
    totalProtein: 34,
    totalCarbs: 33,
    totalFats: 9,
    tags: ['quick', 'post-workout', 'convenient'],
  },
  {
    id: 'almonds-apple',
    name: 'Apple & Almonds',
    mealType: 'snack',
    prepTime: 'under_15',
    prepMinutes: 2,
    servings: 1,
    ingredients: [
      { foodId: 'apple', quantity: 1 },
      { foodId: 'almonds', quantity: 1 },
    ],
    instructions: [
      'Slice apple into wedges.',
      'Portion out almonds.',
      'Enjoy together for balanced snack.',
    ],
    totalCalories: 255,
    totalProtein: 6,
    totalCarbs: 31,
    totalFats: 14,
    tags: ['quick', 'portable', 'no-prep'],
  },
  
  // ============= PRE-WORKOUT =============
  {
    id: 'pre-workout-rice-protein',
    name: 'Quick Carb Load',
    mealType: 'pre_workout',
    prepTime: 'under_15',
    prepMinutes: 5,
    servings: 1,
    ingredients: [
      { foodId: 'rice-cakes', quantity: 2 }, // 4 cakes
      { foodId: 'whey-protein', quantity: 1 },
    ],
    instructions: [
      'Mix whey protein with water.',
      'Eat rice cakes alongside.',
      'Consume 60-90 minutes before training.',
    ],
    totalCalories: 260,
    totalProtein: 27,
    totalCarbs: 32,
    totalFats: 2,
    tags: ['quick', 'pre-workout', 'low-fat'],
  },
  {
    id: 'banana-oats-pre',
    name: 'Banana Oat Pre-Workout',
    mealType: 'pre_workout',
    prepTime: 'under_15',
    prepMinutes: 10,
    servings: 1,
    ingredients: [
      { foodId: 'oats', quantity: 1 },
      { foodId: 'banana', quantity: 1 },
      { foodId: 'whey-protein', quantity: 0.5 },
    ],
    instructions: [
      'Cook oatmeal according to package directions.',
      'Stir in half scoop of whey protein.',
      'Top with sliced banana.',
      'Eat 90 minutes before training.',
    ],
    totalCalories: 330,
    totalProtein: 20,
    totalCarbs: 54,
    totalFats: 5,
    tags: ['pre-workout', 'sustained-energy'],
  },
  
  // ============= POST-WORKOUT =============
  {
    id: 'post-workout-shake-classic',
    name: 'Classic Post-Workout Shake',
    mealType: 'post_workout',
    prepTime: 'under_15',
    prepMinutes: 3,
    servings: 1,
    ingredients: [
      { foodId: 'whey-protein', quantity: 1.5 },
      { foodId: 'banana', quantity: 1 },
    ],
    instructions: [
      'Add 1.5 scoops whey protein to shaker.',
      'Add banana (or blend together).',
      'Add 10-12 oz water and shake well.',
      'Consume within 30 minutes post-training.',
    ],
    totalCalories: 285,
    totalProtein: 39,
    totalCarbs: 29,
    totalFats: 2,
    tags: ['quick', 'post-workout', 'recovery'],
  },
  {
    id: 'chicken-rice-post',
    name: 'Chicken Rice Recovery Meal',
    mealType: 'post_workout',
    prepTime: '15_to_30',
    prepMinutes: 20,
    servings: 1,
    ingredients: [
      { foodId: 'chicken-breast', quantity: 1.5 }, // 6oz
      { foodId: 'white-rice', quantity: 2 },
      { foodId: 'broccoli', quantity: 0.5 },
    ],
    instructions: [
      'Prep chicken and rice ahead for post-workout.',
      'Reheat chicken and rice together.',
      'Steam or microwave broccoli.',
      'Season with salt and pepper.',
      'Eat within 1-2 hours post-training.',
    ],
    totalCalories: 600,
    totalProtein: 48,
    totalCarbs: 82,
    totalFats: 5,
    tags: ['post-workout', 'meal-prep', 'recovery'],
  },
];

// ============= Helper Functions =============

export function getRecipesByMealType(mealType: MealType): Recipe[] {
  return recipes.filter(recipe => recipe.mealType === mealType);
}

export function getRecipesByPrepTime(prepTime: PrepTime): Recipe[] {
  return recipes.filter(recipe => recipe.prepTime === prepTime);
}

export function getRecipesByTag(tag: string): Recipe[] {
  return recipes.filter(recipe => recipe.tags.includes(tag));
}

export function searchRecipes(query: string): Recipe[] {
  const lowerQuery = query.toLowerCase();
  return recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find(recipe => recipe.id === id);
}

export function getMealTypeLabel(mealType: MealType): string {
  const labels: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    pre_workout: 'Pre-Workout',
    post_workout: 'Post-Workout',
  };
  return labels[mealType];
}

export function getPrepTimeLabel(prepTime: PrepTime): string {
  const labels: Record<PrepTime, string> = {
    under_15: 'Under 15 min',
    '15_to_30': '15-30 min',
    over_30: '30+ min',
  };
  return labels[prepTime];
}

export function getHighProteinRecipes(minProtein: number = 30): Recipe[] {
  return recipes.filter(recipe => recipe.totalProtein >= minProtein);
}
