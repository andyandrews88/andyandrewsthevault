import { Card, CardContent } from "@/components/ui/card";
import { Moon, Dumbbell, Scale, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { format } from "date-fns";

function kgToLbs(kg: number) { return Math.round(kg * 2.20462 * 10) / 10; }

export function TodaySnapshot() {
  const { todayReadiness, todayTraining, todayBodyComp } = useDashboardStore();

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

  const cards = [
    {
      title: "Readiness",
      icon: Activity,
      value: todayReadiness.hasCheckin ? `${todayReadiness.score}%` : "—",
      subtitle: todayReadiness.hasCheckin
        ? `S:${todayReadiness.sleep} St:${todayReadiness.stress} E:${todayReadiness.energy} D:${todayReadiness.drive}`
        : "No check-in today",
      color: todayReadiness.score >= 80 ? "text-success" : todayReadiness.score >= 60 ? "text-primary" : "text-warning",
    },
    {
      title: "Training",
      icon: Dumbbell,
      value: todayTraining.hasWorkout ? todayTraining.workoutName || "Completed" : "Rest Day",
      subtitle: todayTraining.hasWorkout
        ? todayTraining.totalVolume > 0
          ? `${todayTraining.totalVolume.toLocaleString()} lbs volume`
          : "Scheduled today"
        : todayTraining.lastWorkoutDate
          ? `Last: ${format(new Date(todayTraining.lastWorkoutDate + "T12:00:00"), "MMM d")}`
          : "No recent workouts",
      color: todayTraining.hasWorkout ? "text-primary" : "text-muted-foreground",
    },
    {
      title: "Body Comp",
      icon: Scale,
      value: weightDisplay(todayBodyComp.latestWeight, todayBodyComp.usesImperial),
      subtitle: trend ? trend.label : "No trend data",
      color: "text-foreground",
      trendIcon: trend?.icon,
      trendColor: trend?.color,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(card => (
        <Card key={card.title} variant="data" className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{card.title}</p>
              <p className={`text-2xl font-mono font-bold ${card.color}`}>{card.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {card.trendIcon && <card.trendIcon className={`w-3 h-3 ${card.trendColor}`} />}
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <card.icon className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
