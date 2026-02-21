import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, Flame, Beef, Wheat, Droplets, UtensilsCrossed, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { Recipe } from '@/types/nutrition';
import { getPrepTimeLabel } from '@/data/recipes';
import { getFoodById } from '@/data/foodDatabase';
import type { MealSlotType } from '@/stores/mealBuilderStore';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogToDiary?: (recipe: Recipe, slot: MealSlotType) => void;
}

const SLOT_OPTIONS: { value: MealSlotType; label: string; icon: React.ElementType }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: Coffee },
  { value: 'lunch', label: 'Lunch', icon: Sun },
  { value: 'dinner', label: 'Dinner', icon: Moon },
  { value: 'snacks', label: 'Snacks', icon: Cookie },
];

export function RecipeDetailModal({ recipe, open, onOpenChange, onLogToDiary }: RecipeDetailModalProps) {
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  if (!recipe) return null;

  const handleLogToSlot = (slot: MealSlotType) => {
    onLogToDiary?.(recipe, slot);
    setShowSlotPicker(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{recipe.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {recipe.prepMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Macro Summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Flame className="w-4 h-4 mx-auto mb-1 text-destructive" />
            <p className="font-mono font-bold text-sm">{recipe.totalCalories}</p>
            <p className="text-[10px] text-muted-foreground">kcal</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Beef className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="font-mono font-bold text-sm">{recipe.totalProtein}g</p>
            <p className="text-[10px] text-muted-foreground">Protein</p>
          </div>
          <div className="p-2 rounded-lg bg-success/10">
            <Wheat className="w-4 h-4 mx-auto mb-1 text-success" />
            <p className="font-mono font-bold text-sm">{recipe.totalCarbs}g</p>
            <p className="text-[10px] text-muted-foreground">Carbs</p>
          </div>
          <div className="p-2 rounded-lg bg-accent/10">
            <Droplets className="w-4 h-4 mx-auto mb-1 text-accent" />
            <p className="font-mono font-bold text-sm">{recipe.totalFats}g</p>
            <p className="text-[10px] text-muted-foreground">Fats</p>
          </div>
        </div>

        {/* Log to Diary */}
        {onLogToDiary && (
          <>
            {!showSlotPicker ? (
              <Button className="w-full gap-2" onClick={() => setShowSlotPicker(true)}>
                <UtensilsCrossed className="w-4 h-4" />
                Log to Diary
              </Button>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {SLOT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1"
                    onClick={() => handleLogToSlot(value)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{label}</span>
                  </Button>
                ))}
              </div>
            )}
          </>
        )}

        <Separator />

        {/* Ingredients */}
        <div>
          <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Ingredients</h4>
          <div className="space-y-2">
            {recipe.ingredients.map((ing, idx) => {
              const food = getFoodById(ing.foodId);
              if (!food) {
                return (
                  <div key={idx} className="bg-muted/30 rounded-lg p-3 text-sm">
                    {ing.customServingSize || ing.foodId.replace(/-/g, ' ')}
                    {ing.quantity !== 1 && ` (×${ing.quantity})`}
                  </div>
                );
              }
              const totalGrams = Math.round(food.servingGrams * ing.quantity);
              const totalOz = Math.round((totalGrams / 28.35) * 10) / 10;
              const cal = Math.round(food.calories * ing.quantity);
              const pro = Math.round(food.protein * ing.quantity * 10) / 10;
              const carb = Math.round(food.carbs * ing.quantity * 10) / 10;
              const fat = Math.round(food.fats * ing.quantity * 10) / 10;

              const servingLabel = ing.quantity === 1
                ? food.servingSize
                : `${ing.quantity} × ${food.servingSize}`;

              return (
                <div key={idx} className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm">{food.name}</span>
                    <span className="text-xs font-mono font-semibold text-destructive shrink-0">{cal} kcal</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {totalGrams}g ({totalOz} oz)
                      <span className="ml-1.5 opacity-60">· {servingLabel}</span>
                    </span>
                  </div>
                  <div className="flex gap-3 text-[11px] text-muted-foreground">
                    <span className="text-primary font-medium">{pro}g P</span>
                    <span>·</span>
                    <span className="text-success font-medium">{carb}g C</span>
                    <span>·</span>
                    <span className="text-accent font-medium">{fat}g F</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Instructions */}
        <div>
          <h4 className="font-semibold text-sm mb-2 uppercase tracking-wider text-muted-foreground">Instructions</h4>
          <ol className="space-y-2">
            {recipe.instructions.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <span className="font-mono font-bold text-primary shrink-0">{idx + 1}.</span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
