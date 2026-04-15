import { Card } from "@/components/ui/card";
import { Dumbbell, Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

function kgToLbs(kg: number) { return Math.round(kg * 2.20462 * 10) / 10; }

/* ---------- SVG Readiness Ring ---------- */
function ReadinessRing({ score, hasCheckin }: { score: number; hasCheckin: boolean }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = hasCheckin ? score / 100 : 0;
  const offset = circ * (1 - pct);
  const color = score >= 80 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--primary))" : "hsl(var(--warning))";

  return (
    <div className="relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg md:text-xl font-bold leading-none" style={{ color }}>
          {hasCheckin ? score : "—"}
        </span>
        {hasCheckin && <span className="text-[9px] text-muted-foreground font-mono">/ 100</span>}
      </div>
    </div>
  );
}

/* ---------- Metric Tile ---------- */
function MetricTile({ emoji, label, value, low }: { emoji: string; label: string; value: number; low: boolean }) {
  return (
    <div className={`rounded-md p-2 text-center ${low ? "bg-warning/10 border border-warning/20" : "bg-secondary/50"}`}>
      <span className="text-sm">{emoji}</span>
      <p className={`font-mono text-sm font-bold leading-tight ${low ? "text-warning" : "text-foreground"}`}>{value}/5</p>
      <p className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">{label}</p>
    </div>
  );
}

export function TodaySnapshot() {
  const { todayReadiness, todayTraining, todayBodyComp } = useDashboardStore();
  const isMobile = useIsMobile();

  const weightDisplay = (kg: number | null, imperial: boolean) => {
    if (!kg) return "—";
    return imperial ? `${kgToLbs(kg)} lbs` : `${Math.round(kg * 10) / 10} kg`;
  };

  const weightTrend = () => {
    if (!todayBodyComp.latestWeight || !todayBodyComp.previousWeight) return null;
    const diff = todayBodyComp.latestWeight - todayBodyComp.previousWeight;
    if (Math.abs(diff) < 0.1) return { icon: Minus, label: "Stable", color: "text-muted-foreground" };
    return diff > 0
      ? { icon: TrendingUp, label: `+${todayBodyComp.usesImperial ? kgToLbs(diff) : Math.round(diff * 10) / 10}`, color: "text-warning" }
      : { icon: TrendingDown, label: `${todayBodyComp.usesImperial ? kgToLbs(diff) : Math.round(diff * 10) / 10}`, color: "text-success" };
  };

  const trend = weightTrend();

  return (
    <div className="space-y-3">
      {/* Readiness Card — ring + 4-tile grid */}
      <Card className="p-3 md:p-4 border-primary/20 bg-primary/[0.03]">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Readiness</p>
        <div className="flex items-center gap-4">
          <ReadinessRing score={todayReadiness.score} hasCheckin={todayReadiness.hasCheckin} />
          {todayReadiness.hasCheckin ? (
            <div className="grid grid-cols-2 gap-2 flex-1">
              <MetricTile emoji="😴" label="Sleep" value={todayReadiness.sleep} low={todayReadiness.sleep <= 2} />
              <MetricTile emoji="⚡" label="Energy" value={todayReadiness.energy} low={todayReadiness.energy <= 2} />
              <MetricTile emoji="🧠" label="Stress" value={todayReadiness.stress} low={todayReadiness.stress <= 2} />
              <MetricTile emoji="🔥" label="Drive" value={todayReadiness.drive} low={todayReadiness.drive <= 2} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Complete your daily check-in to see your readiness score.</p>
          )}
        </div>
      </Card>

      {/* Training + Body Comp — side-by-side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Training */}
        <Card className="p-3 md:p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Training</p>
              <p className={`text-lg md:text-xl font-mono font-bold truncate ${todayTraining.hasWorkout ? "text-primary" : "text-muted-foreground"}`}>
                {todayTraining.hasWorkout ? todayTraining.workoutName || "Completed" : "Rest Day"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {todayTraining.hasWorkout
                  ? todayTraining.totalVolume > 0
                    ? `${todayTraining.totalVolume.toLocaleString()} lbs volume`
                    : "Scheduled today"
                  : todayTraining.lastWorkoutDate
                    ? `Last: ${format(new Date(todayTraining.lastWorkoutDate + "T12:00:00"), "MMM d")}`
                    : "No recent workouts"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
          </div>
        </Card>

        {/* Body Comp */}
        <Card className="p-3 md:p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Body Comp</p>
              <p className="text-lg md:text-xl font-mono font-bold">
                {weightDisplay(todayBodyComp.latestWeight, todayBodyComp.usesImperial)}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {trend?.icon && (() => { const TIcon = trend.icon; return <TIcon className={`w-3 h-3 ${trend.color}`} />; })()}
                <p className="text-[11px] text-muted-foreground">{trend ? trend.label : "No trend data"}</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <Scale className="w-4 h-4 text-primary" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
