import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Plus, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { MealFood } from '@/stores/mealBuilderStore';
import { FoodDiaryItem } from './FoodDiaryItem';
import { MeasurementUnit } from '@/lib/unitConversions';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

interface MealSectionProps {
  slot: MealSlot;
  foods: MealFood[];
  onAddFood: () => void;
  onRemoveFood: (foodId: string) => void;
  onUpdateFood: (foodId: string, amount: number, unit: MeasurementUnit) => void;
}

const slotConfig: Record<MealSlot, { label: string; icon: React.ElementType; accent: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, accent: 'text-amber-500' },
  lunch: { label: 'Lunch', icon: Sun, accent: 'text-emerald-500' },
  dinner: { label: 'Dinner', icon: Moon, accent: 'text-blue-400' },
  snacks: { label: 'Snacks', icon: Cookie, accent: 'text-primary' },
};

export function MealSection({ slot, foods, onAddFood, onRemoveFood, onUpdateFood }: MealSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const config = slotConfig[slot];
  const Icon = config.icon;

  const totalCalories = foods.reduce((sum, food) => sum + food.calculatedMacros.calories, 0);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${config.accent}`} />
                <span className="font-semibold">{config.label}</span>
                {foods.length > 0 && (
                  <span className="text-xs text-muted-foreground">({foods.length})</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium">{totalCalories} cal</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-3">
            {/* Food List */}
            <div className="space-y-1 mb-3">
              {foods.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No foods logged
                </p>
              ) : (
                foods.map((food) => (
                  <FoodDiaryItem
                    key={food.id}
                    mealFood={food}
                    onRemove={() => onRemoveFood(food.id)}
                    onUpdate={(amount, unit) => onUpdateFood(food.id, amount, unit)}
                  />
                ))
              )}
            </div>

            {/* Add Food Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onAddFood}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Food
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
