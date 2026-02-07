import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Percent,
  Activity,
  Target
} from "lucide-react";
import { type BodyEntry, kgToLbs } from "@/types/progress";

interface ProgressOverviewProps {
  latestEntry: BodyEntry | undefined;
  weightChange: number | null;
  usesImperial: boolean;
}

export function ProgressOverview({ latestEntry, weightChange, usesImperial }: ProgressOverviewProps) {
  const displayWeight = (kg: number | null) => {
    if (!kg) return "—";
    return usesImperial ? kgToLbs(kg) : kg;
  };

  const displayWeightChange = (kg: number | null) => {
    if (!kg) return null;
    const value = usesImperial ? kgToLbs(kg) : kg;
    const sign = value > 0 ? "+" : "";
    return `${sign}${value}`;
  };

  const weightUnit = usesImperial ? "lbs" : "kg";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Current Weight */}
      <Card variant="data" className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Weight</p>
            <p className="text-2xl font-bold mt-1">
              {displayWeight(latestEntry?.weight_kg ?? null)}
              <span className="text-sm font-normal text-muted-foreground ml-1">{weightUnit}</span>
            </p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Scale className="w-4 h-4 text-primary" />
          </div>
        </div>
        {weightChange !== null && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            weightChange < 0 ? 'text-green-500' : 
            weightChange > 0 ? 'text-amber-500' : 
            'text-muted-foreground'
          }`}>
            {weightChange < 0 && <TrendingDown className="w-4 h-4" />}
            {weightChange > 0 && <TrendingUp className="w-4 h-4" />}
            {weightChange === 0 && <Minus className="w-4 h-4" />}
            <span>{displayWeightChange(weightChange)} {weightUnit}</span>
          </div>
        )}
      </Card>

      {/* BMI */}
      <Card variant="data" className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">BMI</p>
            <p className="text-2xl font-bold mt-1">
              {latestEntry?.bmi ?? "—"}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/10">
            <Target className="w-4 h-4 text-secondary-foreground" />
          </div>
        </div>
        {latestEntry?.bmi && (
          <Badge 
            variant="outline" 
            className={`mt-2 text-xs ${
              latestEntry.bmi < 18.5 ? 'text-blue-500 border-blue-500/50' :
              latestEntry.bmi < 25 ? 'text-green-500 border-green-500/50' :
              latestEntry.bmi < 30 ? 'text-amber-500 border-amber-500/50' :
              'text-red-500 border-red-500/50'
            }`}
          >
            {latestEntry.bmi < 18.5 ? 'Underweight' :
             latestEntry.bmi < 25 ? 'Normal' :
             latestEntry.bmi < 30 ? 'Overweight' :
             'Obese'}
          </Badge>
        )}
      </Card>

      {/* Body Fat */}
      <Card variant="data" className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Body Fat</p>
            <p className="text-2xl font-bold mt-1">
              {latestEntry?.body_fat_percent ?? "—"}
              {latestEntry?.body_fat_percent && <span className="text-sm font-normal">%</span>}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-accent/10">
            <Percent className="w-4 h-4 text-accent" />
          </div>
        </div>
        {latestEntry?.measurement_source && (
          <Badge variant="outline" className="mt-2 text-xs">
            {latestEntry.measurement_source}
          </Badge>
        )}
      </Card>

      {/* Lean Mass */}
      <Card variant="data" className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Lean Mass</p>
            <p className="text-2xl font-bold mt-1">
              {displayWeight(latestEntry?.lean_mass_kg ?? null)}
              {latestEntry?.lean_mass_kg && (
                <span className="text-sm font-normal text-muted-foreground ml-1">{weightUnit}</span>
              )}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
        </div>
        {latestEntry?.fat_mass_kg && latestEntry?.lean_mass_kg && (
          <p className="text-xs text-muted-foreground mt-2">
            Fat: {displayWeight(latestEntry.fat_mass_kg)} {weightUnit}
          </p>
        )}
      </Card>
    </div>
  );
}
