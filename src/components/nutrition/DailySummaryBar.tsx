import { Progress } from '@/components/ui/progress';
import { Flame, Beef, Wheat, Droplets } from 'lucide-react';

interface DailySummaryBarProps {
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

export function DailySummaryBar({ consumed, targets }: DailySummaryBarProps) {
  const caloriePercent = Math.min((consumed.calories / targets.calories) * 100, 100);
  const remaining = targets.calories - consumed.calories;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b pb-4 mb-4">
      {/* Main Calorie Display */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-1">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-warning" />
          <span className="text-2xl font-bold font-mono">{consumed.calories.toLocaleString()}</span>
          <span className="text-muted-foreground text-sm">/ {targets.calories.toLocaleString()} cal</span>
        </div>
        <div className="sm:text-right">
          <span className={`font-mono text-sm ${remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
            {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress 
        value={caloriePercent} 
        className="h-2 mb-3"
      />

      {/* Macro Summary */}
      <div className="grid grid-cols-3 gap-4">
        <MacroStat
          icon={Beef}
          label="Protein"
          consumed={consumed.protein}
          target={targets.protein}
          color="text-primary"
        />
        <MacroStat
          icon={Wheat}
          label="Carbs"
          consumed={consumed.carbs}
          target={targets.carbs}
          color="text-success"
        />
        <MacroStat
          icon={Droplets}
          label="Fats"
          consumed={consumed.fats}
          target={targets.fats}
          color="text-accent"
        />
      </div>
    </div>
  );
}

interface MacroStatProps {
  icon: React.ElementType;
  label: string;
  consumed: number;
  target: number;
  color: string;
}

function MacroStat({ icon: Icon, label, consumed, target, color }: MacroStatProps) {
  const percent = Math.min((consumed / target) * 100, 100);
  
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-mono text-sm font-medium">
        {Math.round(consumed)}g <span className="text-muted-foreground">/ {target}g</span>
      </p>
      <Progress value={percent} className="h-1 mt-1" />
    </div>
  );
}
