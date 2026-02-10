import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Clock, Trophy, X } from "lucide-react";
import { Goal, GoalProjection, useGoalStore } from "@/stores/goalStore";
import { format } from "date-fns";

const statusConfig = {
  ahead: { label: "Ahead", variant: "success" as const, icon: TrendingUp },
  on_track: { label: "On Track", variant: "data" as const, icon: Target },
  behind: { label: "Behind", variant: "warning" as const, icon: Clock },
  achieved: { label: "Achieved", variant: "elite" as const, icon: Trophy },
  no_data: { label: "Needs Data", variant: "secondary" as const, icon: Clock },
};

interface GoalCardProps {
  goal: Goal;
  projection: GoalProjection;
}

export function GoalCard({ goal, projection }: GoalCardProps) {
  const { cancelGoal, deleteGoal } = useGoalStore();
  const config = statusConfig[projection.status];
  const StatusIcon = config.icon;

  const isActive = goal.status === "active";
  const displayUnit = goal.unit;

  const formatValue = (v: number) => {
    if (goal.unit === "seconds") {
      const mins = Math.floor(v / 60);
      const secs = Math.round(v % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return v % 1 === 0 ? v.toString() : v.toFixed(1);
  };

  return (
    <Card variant="elevated" className="card-interactive">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{goal.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {goal.goal_type === "strength" ? "Strength" : goal.goal_type === "body_weight" ? "Body Weight" : "Conditioning"}
              {goal.exercise_name && ` · ${goal.exercise_name}`}
            </p>
          </div>
          <Badge variant={config.variant} className="ml-2 shrink-0">
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{formatValue(goal.start_value)} {displayUnit}</span>
            <span className="font-mono text-primary">{formatValue(goal.current_value)}</span>
            <span>{formatValue(goal.target_value)} {displayUnit}</span>
          </div>
          <Progress value={projection.percentComplete} className="h-2" />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{projection.daysRemaining}d remaining</span>
          {projection.weeklyRate > 0 && (
            <span className="font-mono">
              {goal.unit === "seconds" ? "-" : "+"}{projection.weeklyRate} {displayUnit}/wk
            </span>
          )}
          {projection.projectedDate && isActive && (
            <span>ETA {format(projection.projectedDate, "MMM d")}</span>
          )}
        </div>

        {/* Actions */}
        {isActive && (
          <div className="flex justify-end mt-2 gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => cancelGoal(goal.id)}>
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          </div>
        )}
        {(goal.status === "cancelled" || goal.status === "achieved") && (
          <div className="flex justify-end mt-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => deleteGoal(goal.id)}>
              Remove
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
