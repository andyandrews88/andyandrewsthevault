import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";

function kgToLbs(kg: number) { return Math.round(kg * 2.20462 * 10) / 10; }

export function WeeklyReview() {
  const { weeklyData } = useDashboardStore();

  const trendIcon = weeklyData.readinessTrend === "up" ? TrendingUp
    : weeklyData.readinessTrend === "down" ? TrendingDown : Minus;
  const trendColor = weeklyData.readinessTrend === "up" ? "text-success"
    : weeklyData.readinessTrend === "down" ? "text-warning" : "text-muted-foreground";
  const trendLabel = weeklyData.readinessTrend === "up" ? "Trending Up"
    : weeklyData.readinessTrend === "down" ? "Trending Down" : "Stable";

  const generateWriteup = (): string => {
    const parts: string[] = [];

    // Training
    if (weeklyData.workoutsCompleted > 0) {
      let s = `This week you completed ${weeklyData.workoutsCompleted} workout${weeklyData.workoutsCompleted > 1 ? "s" : ""}`;
      if (weeklyData.totalVolume > 0) {
        s += ` with a total volume of ${weeklyData.totalVolume.toLocaleString()} lbs`;
      }
      s += ".";
      if (weeklyData.newPRs > 0) {
        s += ` You hit ${weeklyData.newPRs} new personal record${weeklyData.newPRs > 1 ? "s" : ""} 🎉`;
      }
      parts.push(s);
    } else {
      parts.push("No workouts logged this week. Consider getting a session in if you're feeling up to it.");
    }

    // Readiness
    if (weeklyData.avgReadiness > 0) {
      let s = `Your average readiness score was ${weeklyData.avgReadiness}%, ${trendLabel.toLowerCase()} from last week.`;
      if (weeklyData.lowestReadinessDay) {
        s += ` Your lowest day was ${weeklyData.lowestReadinessDay} — consider what affected you that day.`;
      }
      parts.push(s);
    }

    // Body comp
    if (weeklyData.weightStart && weeklyData.weightEnd) {
      const diff = weeklyData.weightEnd - weeklyData.weightStart;
      const displayDiff = weeklyData.usesImperial ? kgToLbs(Math.abs(diff)) : Math.round(Math.abs(diff) * 10) / 10;
      const unit = weeklyData.usesImperial ? "lbs" : "kg";
      const startW = weeklyData.usesImperial ? kgToLbs(weeklyData.weightStart) : Math.round(weeklyData.weightStart * 10) / 10;
      const endW = weeklyData.usesImperial ? kgToLbs(weeklyData.weightEnd) : Math.round(weeklyData.weightEnd * 10) / 10;

      if (Math.abs(diff) < 0.1) {
        parts.push(`Bodyweight held steady around ${endW} ${unit}.`);
      } else {
        parts.push(`Bodyweight moved from ${startW} to ${endW} ${unit} (${diff > 0 ? "+" : "-"}${displayDiff} ${unit}).`);
      }
    }

    return parts.join(" ");
  };

  const hasData = weeklyData.workoutsCompleted > 0 || weeklyData.avgReadiness > 0 || weeklyData.weightEnd;

  return (
    <Card variant="elevated">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Weekly Review</CardTitle>
        </div>
        {weeklyData.avgReadiness > 0 && (
          <div className="flex items-center gap-1.5">
            {(() => { const Icon = trendIcon; return <Icon className={`w-4 h-4 ${trendColor}`} />; })()}
            <Badge variant="secondary" className="font-mono">{weeklyData.avgReadiness}% avg</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">
            Not enough data for a weekly review yet. Log workouts, check in daily, and track your weight to see your summary here.
          </p>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-mono font-bold text-primary">{weeklyData.workoutsCompleted}</p>
                <p className="text-xs text-muted-foreground">Workouts</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-mono font-bold text-primary">
                  {weeklyData.totalVolume > 0 ? `${Math.round(weeklyData.totalVolume / 1000)}k` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Volume (lbs)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-mono font-bold text-accent">{weeklyData.newPRs}</p>
                <p className="text-xs text-muted-foreground">New PRs</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className={`text-2xl font-mono font-bold ${trendColor}`}>
                  {weeklyData.avgReadiness > 0 ? `${weeklyData.avgReadiness}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Readiness</p>
              </div>
            </div>

            {/* Generated writeup */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm leading-relaxed text-foreground/90">{generateWriteup()}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
