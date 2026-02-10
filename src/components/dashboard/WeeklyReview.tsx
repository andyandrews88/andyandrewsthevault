import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, FileText, Sparkles, Loader2 } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

function kgToLbs(kg: number) { return Math.round(kg * 2.20462 * 10) / 10; }

export function WeeklyReview() {
  const { weeklyData } = useDashboardStore();
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const trendIcon = weeklyData.readinessTrend === "up" ? TrendingUp
    : weeklyData.readinessTrend === "down" ? TrendingDown : Minus;
  const trendColor = weeklyData.readinessTrend === "up" ? "text-success"
    : weeklyData.readinessTrend === "down" ? "text-warning" : "text-muted-foreground";
  const trendLabel = weeklyData.readinessTrend === "up" ? "Trending Up"
    : weeklyData.readinessTrend === "down" ? "Trending Down" : "Stable";

  const generateWriteup = (): string => {
    const parts: string[] = [];

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

    if (weeklyData.avgReadiness > 0) {
      let s = `Your average readiness score was ${weeklyData.avgReadiness}%, ${trendLabel.toLowerCase()} from last week.`;
      if (weeklyData.lowestReadinessDay) {
        s += ` Your lowest day was ${weeklyData.lowestReadinessDay} — consider what affected you that day.`;
      }
      parts.push(s);
    }

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

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-review", {
        body: { weeklyData },
      });

      if (error) {
        const status = (error as any)?.status;
        if (status === 429) {
          toast({ title: "Rate limited", description: "Please try again in a moment.", variant: "destructive" });
        } else if (status === 402) {
          toast({ title: "Credits exhausted", description: "Top up your AI credits in Settings.", variant: "destructive" });
        } else {
          toast({ title: "Generation failed", description: "Could not generate AI review. Try again later.", variant: "destructive" });
        }
        return;
      }

      if (data?.error) {
        toast({ title: "Generation failed", description: data.error, variant: "destructive" });
        return;
      }

      setAiReview(data?.review || null);
    } catch {
      toast({ title: "Error", description: "Something went wrong. Try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
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

            {/* Write-up box */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm leading-relaxed text-foreground/90">
                {aiReview || generateWriteup()}
              </p>
              {aiReview && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI-generated review
                </p>
              )}
            </div>

            {/* Generate button */}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              onClick={handleGenerateAI}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {isGenerating ? "Generating..." : aiReview ? "Regenerate AI Review" : "Generate AI Review"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
