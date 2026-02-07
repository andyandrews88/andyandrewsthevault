import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MacroBreakdown } from '@/types/nutrition';

interface MacroChartProps {
  macros: MacroBreakdown;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS = {
  protein: 'hsl(var(--primary))',
  carbs: 'hsl(var(--success))',
  fats: 'hsl(var(--accent))',
};

export function MacroChart({ macros, size = 'md' }: MacroChartProps) {
  const data = useMemo(() => [
    { name: 'Protein', value: macros.proteinCalories, grams: macros.protein, percent: macros.proteinPercent },
    { name: 'Carbs', value: macros.carbCalories, grams: macros.carbs, percent: macros.carbPercent },
    { name: 'Fats', value: macros.fatCalories, grams: macros.fats, percent: macros.fatPercent },
  ], [macros]);

  const dimensions = {
    sm: { width: 150, height: 150, innerRadius: 40, outerRadius: 60 },
    md: { width: 200, height: 200, innerRadius: 55, outerRadius: 80 },
    lg: { width: 250, height: 250, innerRadius: 70, outerRadius: 100 },
  };

  const { width, height, innerRadius, outerRadius } = dimensions[size];

  const totalCalories = macros.proteinCalories + macros.carbCalories + macros.fatCalories;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.grams}g ({data.percent}%)</p>
          <p className="text-sm font-mono text-primary">{data.value} kcal</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative" style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={Object.values(COLORS)[index]}
                className="transition-opacity hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-lg font-bold font-mono">{totalCalories}</span>
        <span className="text-xs text-muted-foreground">kcal</span>
      </div>

      {/* Legend */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: Object.values(COLORS)[index] }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
