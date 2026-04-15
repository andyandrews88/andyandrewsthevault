import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useGoalStore } from "@/stores/goalStore";
import { GoalCard } from "./GoalCard";
import { GoalForm } from "./GoalForm";
import { Target } from "lucide-react";

export function GoalsPanel() {
  const { goals, projections, isLoading, fetchGoals } = useGoalStore();

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "achieved" || g.status === "cancelled").slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Goals</h3>
          {activeGoals.length > 0 && (
            <Badge variant="data" className="ml-1">{activeGoals.length} active</Badge>
          )}
        </div>
        <GoalForm />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map(i => <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-xs">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>No goals set yet. Add your first goal to start tracking progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeGoals.map(g => (
            <GoalCard key={g.id} goal={g} projection={projections[g.id]} />
          ))}
          {completedGoals.map(g => (
            <GoalCard key={g.id} goal={g} projection={projections[g.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
