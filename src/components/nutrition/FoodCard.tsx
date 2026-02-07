import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Beef, Wheat, Droplets, Flame } from 'lucide-react';
import { FoodItem, FoodCategory } from '@/types/nutrition';
import { getCategoryLabel } from '@/data/foodDatabase';
import { 
  MeasurementUnit, 
  UNIT_OPTIONS, 
  getAvailableUnits, 
  calculateMacros,
  parseServingSize,
} from '@/lib/unitConversions';

interface FoodCardProps {
  food: FoodItem;
  onAdd?: (servings: number, unit?: MeasurementUnit) => void;
  showAddButton?: boolean;
  interactive?: boolean;
}

const CATEGORY_COLORS: Record<FoodCategory, string> = {
  lean_protein: 'bg-primary/10 text-primary',
  whole_protein: 'bg-primary/20 text-primary',
  dairy_vegetarian: 'bg-success/10 text-success',
  carbohydrate: 'bg-accent/10 text-accent',
  healthy_fat: 'bg-yellow-500/10 text-yellow-600',
  vegetable: 'bg-green-500/10 text-green-600',
  fruit: 'bg-pink-500/10 text-pink-600',
  supplement: 'bg-purple-500/10 text-purple-600',
};

export function FoodCard({ food, onAdd, showAddButton = true, interactive = false }: FoodCardProps) {
  const defaultParsed = parseServingSize(food.servingSize);
  const [amount, setAmount] = useState(defaultParsed.amount);
  const [unit, setUnit] = useState<MeasurementUnit>(defaultParsed.unit);
  
  const availableUnits = getAvailableUnits(food.category);
  
  // Calculate current macros based on amount and unit
  const currentMacros = interactive
    ? calculateMacros(
        food.calories,
        food.protein,
        food.carbs,
        food.fats,
        food.servingGrams,
        amount,
        unit
      )
    : {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
      };

  const handleAdd = () => {
    if (onAdd) {
      onAdd(amount, unit);
    }
  };

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
            
            {/* Serving Size or Unit Selector */}
            {interactive ? (
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 1)}
                  className="w-14 h-7 text-xs text-center"
                  step={0.5}
                  min={0.5}
                  max={20}
                />
                <Select value={unit} onValueChange={(v) => setUnit(v as MeasurementUnit)}>
                  <SelectTrigger className="w-16 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((u) => {
                      const option = UNIT_OPTIONS.find((o) => o.value === u);
                      return (
                        <SelectItem key={u} value={u}>
                          {option?.shortLabel || u}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{food.servingSize}</p>
            )}
          </div>

          {/* Quick Add Button */}
          {onAdd && showAddButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Macro Stats */}
        <div className="grid grid-cols-4 gap-1 mt-3">
          <MacroStat icon={Flame} value={currentMacros.calories} label="cal" color="text-orange-500" />
          <MacroStat icon={Beef} value={currentMacros.protein} label="P" color="text-primary" />
          <MacroStat icon={Wheat} value={currentMacros.carbs} label="C" color="text-success" />
          <MacroStat icon={Droplets} value={currentMacros.fats} label="F" color="text-accent" />
        </div>

        {/* Notes */}
        {food.notes && !interactive && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{food.notes}</p>
        )}

        {/* Tags */}
        {food.tags.length > 0 && !interactive && (
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
      <p className="text-xs font-mono font-medium">{Math.round(value * 10) / 10}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
