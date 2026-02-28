import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';
import { 
  Utensils, 
  Clock, 
  Beef, 
  Wheat, 
  Droplets,
  ChefHat,
  BookOpen,
  Flame,
  Plus,
  Coffee,
  Sun,
  Moon,
  Cookie,
} from 'lucide-react';
import { MealBreakdown, MacroBreakdown, Recipe } from '@/types/nutrition';
import { getRecipesByMealType } from '@/data/recipes';
import { RecipeDetailModal } from './RecipeDetailModal';
import type { MealSlotType } from '@/stores/mealBuilderStore';

interface MealPlanGeneratorProps {
  targetCalories: number;
  targetMacros: MacroBreakdown;
  mealBreakdown: MealBreakdown[];
  onLogRecipe?: (recipe: Recipe, slot: MealSlotType) => void;
}

const RECIPE_TABS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
  { value: 'smoothie', label: 'Smoothies' },
  { value: 'bowl', label: 'Bowls' },
] as const;

const SLOT_OPTIONS: { value: MealSlotType; label: string; icon: React.ElementType }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: Coffee },
  { value: 'lunch', label: 'Lunch', icon: Sun },
  { value: 'dinner', label: 'Dinner', icon: Moon },
  { value: 'snacks', label: 'Snacks', icon: Cookie },
];

function QuickLogButton({ recipe, onLogRecipe }: { recipe: Recipe; onLogRecipe: (recipe: Recipe, slot: MealSlotType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={setOpen}
      title="Log to meal"
      trigger={
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      }
      popoverAlign="end"
      popoverClassName="w-auto p-2"
    >
      <div className="grid grid-cols-2 gap-1">
        {SLOT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-xs"
            onClick={() => { onLogRecipe(recipe, value); setOpen(false); }}
          >
            <Icon className="w-3 h-3" />
            {label}
          </Button>
        ))}
      </div>
    </ResponsiveSheet>
  );
}

export function MealPlanGenerator({ targetCalories, targetMacros, mealBreakdown, onLogRecipe }: MealPlanGeneratorProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card variant="data">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Daily Target</p>
              <p className="text-2xl font-bold font-mono">{targetCalories.toLocaleString()} kcal</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="font-mono font-bold text-primary">{targetMacros.protein}g</p>
                <p className="text-muted-foreground">Protein</p>
              </div>
              <div className="text-center">
                <p className="font-mono font-bold text-success">{targetMacros.carbs}g</p>
                <p className="text-muted-foreground">Carbs</p>
              </div>
              <div className="text-center">
                <p className="font-mono font-bold text-accent">{targetMacros.fats}g</p>
                <p className="text-muted-foreground">Fats</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Meal Distribution
          </CardTitle>
          <CardDescription>
            Your daily targets split across {mealBreakdown.length} meals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mealBreakdown.map((meal) => (
              <div key={meal.mealNumber} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-mono text-sm font-bold text-primary">{meal.mealNumber}</span>
                  </div>
                  <div>
                    <p className="font-medium">{meal.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{meal.calories} kcal</p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <span className="text-primary">{meal.protein}g P</span>
                  <span className="text-success">{meal.carbs}g C</span>
                  <span className="text-accent">{meal.fats}g F</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recipe Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Recipe Ideas
          </CardTitle>
          <CardDescription>
            Tap any recipe for full details & instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="breakfast">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
              {RECIPE_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>

            {RECIPE_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="space-y-3 mt-4">
                {getRecipesByMealType(tab.value as any).map((recipe) => (
                  <Card key={recipe.id} variant="interactive" className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 cursor-pointer" onClick={() => handleRecipeClick(recipe)}>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{recipe.name}</h4>
                            <Badge variant="outline" className="text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              {recipe.prepMinutes} min
                            </Badge>
                          </div>
                          
                          <div className="flex gap-3 text-xs font-mono">
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-destructive" />
                              {recipe.totalCalories}
                            </span>
                            <span className="flex items-center gap-1">
                              <Beef className="w-3 h-3 text-primary" />
                              {recipe.totalProtein}g
                            </span>
                            <span className="flex items-center gap-1">
                              <Wheat className="w-3 h-3 text-success" />
                              {recipe.totalCarbs}g
                            </span>
                            <span className="flex items-center gap-1">
                              <Droplets className="w-3 h-3 text-accent" />
                              {recipe.totalFats}g
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {recipe.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Quick-log button */}
                        {onLogRecipe && (
                          <QuickLogButton recipe={recipe} onLogRecipe={onLogRecipe} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Sample Day */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Sample Day Template
          </CardTitle>
          <CardDescription>
            A complete day hitting {targetCalories} calories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 font-mono text-sm">
            
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-bold mb-2 text-primary">MEAL 1 - Breakfast</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 3 whole eggs (210 cal, 18g P)</li>
                <li>• 1 cup oatmeal (160 cal, 5g P)</li>
                <li>• 1 banana (105 cal)</li>
                <li>• 1 tbsp peanut butter (95 cal)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-bold mb-2 text-primary">MEAL 2 - Lunch</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 6 oz chicken breast (180 cal, 39g P)</li>
                <li>• 1.5 cups white rice (308 cal)</li>
                <li>• 1 cup broccoli (31 cal)</li>
                <li>• 1/2 avocado (160 cal)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-bold mb-2 text-primary">MEAL 3 - Dinner</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 6 oz salmon (300 cal, 38g P)</li>
                <li>• 1 large sweet potato (180 cal)</li>
                <li>• Mixed vegetables (100 cal)</li>
                <li>• 1 tbsp olive oil (120 cal)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-bold mb-2 text-primary">MEAL 4 - Evening</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 1 cup cottage cheese (180 cal, 25g P)</li>
                <li>• 1 oz almonds (160 cal)</li>
              </ul>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-muted-foreground">
                Daily Total: <span className="text-foreground font-bold">~2,500 cal</span> | 
                <span className="text-primary"> ~180g P</span> | 
                <span className="text-success"> ~250g C</span> | 
                <span className="text-accent"> ~85g F</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adjust portions to match your specific calorie targets
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onLogToDiary={onLogRecipe}
      />
    </div>
  );
}
