import { Progress } from '@/components/ui/progress';
import { Flame } from 'lucide-react';
import { macrosToPortions, portionsFromTargets, formatPortionProgress, PORTION_LABELS } from '@/lib/handPortions';

interface CalorieSummaryProps {
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export function CalorieSummary({ consumed, targets }: CalorieSummaryProps) {
  const caloriePercent = Math.min((consumed.calories / targets.calories) * 100, 100);
  const remaining = targets.calories - consumed.calories;

  const consumedPortions = macrosToPortions(consumed.protein, consumed.carbs, consumed.fats);
  const targetPortions = portionsFromTargets(targets.protein, targets.carbs, targets.fats);

  const portionItems = [
    {
      key: 'palms' as const,
      consumed: consumedPortions.palms,
      target: targetPortions.palms,
    },
    {
      key: 'cuppedHands' as const,
      consumed: consumedPortions.cuppedHands,
      target: targetPortions.cuppedHands,
    },
    {
      key: 'thumbs' as const,
      consumed: consumedPortions.thumbs,
      target: targetPortions.thumbs,
    },
  ];

  return (
    <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b pb-4 pt-3 mb-4">
      {/* Calorie Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-warning" />
          <span className="text-lg font-bold font-mono">{consumed.calories.toLocaleString()}</span>
          <span className="text-muted-foreground text-xs">/ {targets.calories.toLocaleString()} cal</span>
        </div>
        <span className={`font-mono text-xs ${remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
          {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
        </span>
      </div>

      <Progress value={caloriePercent} className="h-2 mb-3" />

      {/* Hand Portion Row */}
      <div className="grid grid-cols-3 gap-3">
        {portionItems.map((item) => {
          const meta = PORTION_LABELS[item.key];
          const percent = item.target > 0 ? Math.min((item.consumed / item.target) * 100, 100) : 0;
          return (
            <div key={item.key} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-base">{meta.emoji}</span>
                <span className="text-xs text-muted-foreground">{meta.macro}</span>
              </div>
              <p className="font-mono text-sm font-semibold">
                {formatPortionProgress(item.consumed, item.target)}
              </p>
              <Progress value={percent} className="h-1 mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
