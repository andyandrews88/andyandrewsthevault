import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useMealBuilderStore, MealSlotType, MealFood } from '@/stores/mealBuilderStore';
import { PortionSourcePicker, PortionType } from './PortionSourcePicker';
import { FoodItem } from '@/types/nutrition';
import { isHandPortionUnit } from '@/lib/unitConversions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const PORTION_TYPES: { type: PortionType; emoji: string; label: string; macro: string }[] = [
  { type: 'palm', emoji: '✋', label: 'Palms', macro: 'Protein' },
  { type: 'cupped_hand', emoji: '🤲', label: 'Cupped Hands', macro: 'Carbs' },
  { type: 'thumb', emoji: '👍', label: 'Thumbs', macro: 'Fats' },
  { type: 'fist', emoji: '👊', label: 'Fists', macro: 'Veggies' },
];

interface HandPortionLoggerProps {
  entries: MealFood[];
  onRemoveFood: (id: string) => void;
}

export function HandPortionLogger({ entries, onRemoveFood }: HandPortionLoggerProps) {
  const { addDiaryEntry } = useMealBuilderStore();

  const [activeMealSlot, setActiveMealSlot] = useState<MealSlot>('lunch');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activePortionType, setActivePortionType] = useState<PortionType>('palm');
  const [pendingAmount, setPendingAmount] = useState(1);

  // Get hand-portion entries grouped by meal slot
  const getHandEntries = (slot: MealSlot) =>
    entries.filter(e => e.mealSlot === slot && isHandPortionUnit(e.unit));

  const handleAddPortion = (type: PortionType, amount: number) => {
    setActivePortionType(type);
    setPendingAmount(amount);
    setPickerOpen(true);
  };

  const handleFoodSelected = (food: FoodItem) => {
    addDiaryEntry(food, activeMealSlot as MealSlotType, pendingAmount, activePortionType);
  };

  // Count portions of a given type in the current meal slot
  const getPortionCount = (slot: MealSlot, type: PortionType) => {
    return entries
      .filter(e => e.mealSlot === slot && e.unit === type)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <div className="space-y-4">
      {/* Meal Slot Selector */}
      <Select value={activeMealSlot} onValueChange={(v) => setActiveMealSlot(v as MealSlot)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MEAL_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Portion Type Cards */}
      <div className="grid grid-cols-2 gap-3">
        {PORTION_TYPES.map(({ type, emoji, label, macro }) => {
          const count = getPortionCount(activeMealSlot, type);
          return (
            <div
              key={type}
              className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2"
            >
              <span className="text-3xl">{emoji}</span>
              <p className="text-xs text-muted-foreground font-medium">{macro}</p>
              <p className="text-lg font-bold font-mono">{count}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  disabled={count === 0}
                  onClick={() => {
                    // Remove the last entry of this type in this slot
                    const matching = entries.filter(e => e.mealSlot === activeMealSlot && e.unit === type);
                    if (matching.length > 0) {
                      onRemoveFood(matching[matching.length - 1].id);
                    }
                  }}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => handleAddPortion(type, 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logged Entries for Active Slot */}
      {(() => {
        const slotEntries = getHandEntries(activeMealSlot);
        if (slotEntries.length === 0) return null;
        return (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium px-1">
              {MEAL_LABELS[activeMealSlot]} entries
            </p>
            {slotEntries.map((entry) => {
              const unitEmoji = PORTION_TYPES.find(p => p.type === entry.unit)?.emoji || '';
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{unitEmoji}</span>
                    <span className="text-sm font-medium truncate">
                      {entry.amount} × {entry.food.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {entry.calculatedMacros.calories} cal
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => onRemoveFood(entry.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Source Picker Dialog */}
      <PortionSourcePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        portionType={activePortionType}
        onSelectFood={handleFoodSelected}
      />
    </div>
  );
}
