import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Edit2 } from 'lucide-react';
import { MealFood } from '@/stores/mealBuilderStore';
import { MeasurementUnit, UNIT_OPTIONS, getAvailableUnits, calculateMacros } from '@/lib/unitConversions';
import { inlinePortionLabel } from '@/lib/handPortions';

interface FoodDiaryItemProps {
  mealFood: MealFood;
  onRemove: () => void;
  onUpdate: (amount: number, unit: MeasurementUnit) => void;
}

export function FoodDiaryItem({ mealFood, onRemove, onUpdate }: FoodDiaryItemProps) {
  const { food, amount, unit, calculatedMacros } = mealFood;
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(amount);
  const [editUnit, setEditUnit] = useState(unit);

  const category = 'category' in food ? food.category : 'supplement';
  const availableUnits = getAvailableUnits(category);

  // Dynamically recalculate macros for the edit preview
  const previewMacros = useMemo(() => {
    return calculateMacros(
      food.calories, food.protein, food.carbs, food.fats,
      food.servingGrams, editAmount, editUnit
    );
  }, [food, editAmount, editUnit]);

  const handleSave = () => {
    onUpdate(editAmount, editUnit);
    setIsEditing(false);
  };

  const formatAmount = () => {
    const unitOption = UNIT_OPTIONS.find((o) => o.value === unit);
    return `${amount} ${unitOption?.shortLabel || unit}`;
  };

  // Inline hand portion indicator
  const portionText = inlinePortionLabel(
    calculatedMacros.protein,
    calculatedMacros.carbs,
    calculatedMacros.fats
  );

  return (
    <>
      {/* Compact single-line display */}
      <div className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors group">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-sm font-medium truncate">{food.name}</p>
          <p className="text-xs text-muted-foreground">{formatAmount()}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right whitespace-nowrap">
            <span className="font-mono text-sm">{calculatedMacros.calories} cal</span>
            {portionText && (
              <p className="text-[10px] text-muted-foreground">{portionText}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit {food.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0.5)}
                min={0.5}
                max={20}
                step={0.5}
                className="flex-1"
              />
              <Select value={editUnit} onValueChange={(v) => setEditUnit(v as MeasurementUnit)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.map((u) => {
                    const option = UNIT_OPTIONS.find((o) => o.value === u);
                    return (
                      <SelectItem key={u} value={u}>
                        {option?.label || u}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Live preview macros */}
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold font-mono text-primary">
                {previewMacros.calories} cal
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                P: {Math.round(previewMacros.protein)}g • 
                C: {Math.round(previewMacros.carbs)}g • 
                F: {Math.round(previewMacros.fats)}g
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
