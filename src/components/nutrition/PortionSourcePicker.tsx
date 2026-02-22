import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { FoodItem, FoodCategory } from '@/types/nutrition';
import { foodDatabase } from '@/data/foodDatabase';

export type PortionType = 'palm' | 'cupped_hand' | 'thumb' | 'fist';

interface PortionSourcePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portionType: PortionType;
  onSelectFood: (food: FoodItem) => void;
}

const PORTION_META: Record<PortionType, { emoji: string; label: string; question: string; categories: FoodCategory[] }> = {
  palm: {
    emoji: '✋',
    label: 'Palm',
    question: 'What protein did you eat?',
    categories: ['lean_protein', 'whole_protein', 'dairy_vegetarian'],
  },
  cupped_hand: {
    emoji: '🤲',
    label: 'Cupped Hand',
    question: 'What carb did you eat?',
    categories: ['carbohydrate', 'fruit'],
  },
  thumb: {
    emoji: '👍',
    label: 'Thumb',
    question: 'What fat did you eat?',
    categories: ['healthy_fat'],
  },
  fist: {
    emoji: '👊',
    label: 'Fist',
    question: 'What veggie did you eat?',
    categories: ['vegetable'],
  },
};

export function PortionSourcePicker({ open, onOpenChange, portionType, onSelectFood }: PortionSourcePickerProps) {
  const [search, setSearch] = useState('');
  const meta = PORTION_META[portionType];

  const filteredFoods = useMemo(() => {
    const categoryFoods = foodDatabase.filter(f => meta.categories.includes(f.category));
    if (!search.trim()) return categoryFoods;
    const q = search.toLowerCase();
    return categoryFoods.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [search, meta.categories]);

  const handleSelect = (food: FoodItem) => {
    onSelectFood(food);
    setSearch('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch(''); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{meta.emoji}</span>
            {meta.question}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-1">
            {filteredFoods.map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelect(food)}
                className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors text-left flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{food.name}</p>
                  <p className="text-xs text-muted-foreground">{food.servingSize}</p>
                </div>
                <div className="text-right text-xs ml-3 whitespace-nowrap">
                  <p className="font-mono">{food.calories} cal</p>
                  <p className="text-muted-foreground">
                    P:{food.protein}g C:{food.carbs}g F:{food.fats}g
                  </p>
                </div>
              </button>
            ))}
            {filteredFoods.length === 0 && (
              <p className="text-center text-muted-foreground py-6 text-sm">No foods found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
