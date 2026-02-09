import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { Recipe } from '@/types/nutrition';
import { getPrepTimeLabel } from '@/data/recipes';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailModal({ recipe, open, onOpenChange }: RecipeDetailModalProps) {
  if (!recipe) return null;

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

        <Separator />

        {/* Ingredients */}
        <div>
          <h4 className="font-semibold text-sm mb-2 uppercase tracking-wider text-muted-foreground">Ingredients</h4>
          <ul className="space-y-1.5">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  {ing.quantity !== 1 && `${ing.quantity}x `}
                  {ing.customServingSize || ing.foodId.replace(/-/g, ' ')}
                </span>
              </li>
            ))}
          </ul>
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
