import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Beef, Wheat, Droplets, Flame } from 'lucide-react';
import { FoodItem, FoodCategory } from '@/types/nutrition';
import { getCategoryLabel } from '@/data/foodDatabase';

interface FoodCardProps {
  food: FoodItem;
  onAdd?: (servings: number) => void;
  showAddButton?: boolean;
}

const CATEGORY_COLORS: Record<FoodCategory, string> = {
  lean_protein: 'bg-primary/10 text-primary',
  whole_protein: 'bg-primary/20 text-primary',
  dairy_vegetarian: 'bg-success/10 text-success',
  carbohydrate: 'bg-accent/10 text-accent',
  healthy_fat: 'bg-yellow-500/10 text-yellow-500',
  vegetable: 'bg-green-500/10 text-green-500',
  fruit: 'bg-pink-500/10 text-pink-500',
  supplement: 'bg-purple-500/10 text-purple-500',
};

export function FoodCard({ food, onAdd, showAddButton = true }: FoodCardProps) {
  return (
    <Card variant="interactive" className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            <Badge 
              variant="outline" 
              className={`text-xs mb-2 ${CATEGORY_COLORS[food.category]}`}
            >
              {getCategoryLabel(food.category)}
            </Badge>

            {/* Name */}
            <h4 className="font-medium text-sm truncate">{food.name}</h4>
            
            {/* Serving Size */}
            <p className="text-xs text-muted-foreground">{food.servingSize}</p>
          </div>

          {/* Quick Add Button */}
          {onAdd && showAddButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onAdd(1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Macro Stats */}
        <div className="grid grid-cols-4 gap-1 mt-3">
          <MacroStat icon={Flame} value={food.calories} label="cal" color="text-orange-500" />
          <MacroStat icon={Beef} value={food.protein} label="P" color="text-primary" />
          <MacroStat icon={Wheat} value={food.carbs} label="C" color="text-success" />
          <MacroStat icon={Droplets} value={food.fats} label="F" color="text-accent" />
        </div>

        {/* Notes */}
        {food.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{food.notes}</p>
        )}

        {/* Tags */}
        {food.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {food.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MacroStatProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
}

function MacroStat({ icon: Icon, value, label, color }: MacroStatProps) {
  return (
    <div className="text-center">
      <Icon className={`w-3 h-3 mx-auto mb-0.5 ${color}`} />
      <p className="text-xs font-mono font-medium">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
