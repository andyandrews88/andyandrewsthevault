import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TrendingUp, TrendingDown, Minus, FileText, Sparkles, Loader2, Timer, Gauge, Dumbbell, Apple, Heart } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

function kgToLbs(kg: number) { return Math.round(kg * 2.20462 * 10) / 10; }

interface ReviewSection {
  title: string;
  content: string;
  icon: React.ElementType;
}

const sectionIcons: Record<string, React.ElementType> = {
  "training": Dumbbell,
  "nutrition": Apple,
  "lifestyle": Heart,
  "overall summary": Sparkles,
  "overall": Sparkles,
};

function parseSections(text: string): ReviewSection[] | null {
  console.log("[WeeklyReview] Raw AI response:", JSON.stringify(text).slice(0, 500));

  // Strategy 1: ## headers (normalize inline ones to newlines first)
  let normalized = text.replace(/([^\n])## /g, "$1\n## ");
  let parts = normalized.split(/^## /m).filter(Boolean);

  // Strategy 2: try # headers (single hash)
  if (parts.length < 3) {
    normalized = text.replace(/([^\n])# /g, "$1\n# ");
    parts = normalized.split(/^# /m).filter(Boolean);
  }

  // Strategy 3: try **Header** bold patterns on their own line
  if (parts.length < 3) {
    parts = text.split(/^\*\*([^*]+)\*\*\s*$/m).filter(Boolean);
    // Re-pair: odd indices are titles, even are content
    if (parts.length >= 6) {
      const paired: string[] = [];
      for (let i = 0; i < parts.length - 1; i += 2) {
        paired.push(parts[i] + "\n" + (parts[i + 1] || ""));
      }
      parts = paired;
    }
  }

  // Strategy 4: try splitting by known section names
  if (parts.length < 3) {
    const sectionPattern = /(?:^|\n)\s*(?:#{1,3}\s*|(?:\*\*))?\s*(Training|Nutrition|Lifestyle|Overall(?:\s+Summary)?)\s*(?:\*\*)?\s*(?::|\n)/gi;
    const matches = [...text.matchAll(sectionPattern)];
    if (matches.length >= 3) {
      parts = [];
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index! + matches[i][0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
        parts.push(matches[i][1] + "\n" + text.slice(start, end));
      }
    }
  }

  console.log("[WeeklyReview] Parsed sections count:", parts.length);

  if (parts.length < 3) return null;

  return parts.map((p) => {
    const [titleLine, ...rest] = p.split("\n");
    const title = titleLine.trim().replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/:$/, "");
    const key = title.toLowerCase();
    const icon = sectionIcons[key] || Object.entries(sectionIcons).find(([k]) => key.includes(k))?.[1] || Sparkles;
    return { title, content: rest.join("\n").trim(), icon };
  });
}

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

  const hasTraining = weeklyData.workoutsCompleted > 0;
  const hasNutrition = !!(weeklyData.weightStart && weeklyData.weightEnd);
  const hasLifestyle = weeklyData.avgReadiness > 0;
  const hasAllData = hasTraining && hasNutrition && hasLifestyle;
  const hasAnyData = hasTraining || hasNutrition || hasLifestyle;

  const sections = aiReview ? parseSections(aiReview) : null;

  const getTrainingSummary = () => {
    if (!hasTraining) return null;
    let s = `You completed ${weeklyData.workoutsCompleted} workout${weeklyData.workoutsCompleted > 1 ? "s" : ""}`;
    if (weeklyData.totalVolume > 0) s += ` with a total volume of ${weeklyData.totalVolume.toLocaleString()} lbs`;
    s += ".";
    if (weeklyData.newPRs > 0) s += ` You hit ${weeklyData.newPRs} new PR${weeklyData.newPRs > 1 ? "s" : ""} 🎉`;
    if (weeklyData.avgRIR !== null && weeklyData.rirSetsCount > 0) {
      s += ` Average RIR across ${weeklyData.rirSetsCount} sets was ${weeklyData.avgRIR} (${weeklyData.hardSetsPercent}% at RIR 0-1).`;
    }
    if (weeklyData.conditioningSessions > 0) {
      s += ` ${weeklyData.conditioningSessions} conditioning session${weeklyData.conditioningSessions > 1 ? "s" : ""} totaling ${weeklyData.totalConditioningMinutes} min.`;
    }
    return s;
  };

  const getNutritionSummary = () => {
    if (!hasNutrition) return null;
    const diff = weeklyData.weightEnd! - weeklyData.weightStart!;
    const unit = weeklyData.usesImperial ? "lbs" : "kg";
    const startW = weeklyData.usesImperial ? kgToLbs(weeklyData.weightStart!) : Math.round(weeklyData.weightStart! * 10) / 10;
    const endW = weeklyData.usesImperial ? kgToLbs(weeklyData.weightEnd!) : Math.round(weeklyData.weightEnd! * 10) / 10;
    const displayDiff = weeklyData.usesImperial ? kgToLbs(Math.abs(diff)) : Math.round(Math.abs(diff) * 10) / 10;
    if (Math.abs(diff) < 0.1) return `Bodyweight held steady around ${endW} ${unit}.`;
    return `Bodyweight moved from ${startW} to ${endW} ${unit} (${diff > 0 ? "+" : "-"}${displayDiff} ${unit}).`;
  };

  const getLifestyleSummary = () => {
    if (!hasLifestyle) return null;
    let s = `Average readiness score was ${weeklyData.avgReadiness}%, ${trendLabel.toLowerCase()} from last week.`;
    if (weeklyData.lowestReadinessDay) s += ` Lowest day was ${weeklyData.lowestReadinessDay}.`;
    return s;
  };

  type GuidanceSection = { title: string; icon: React.ElementType; content: string; hasData: boolean };

  const guidanceSections: GuidanceSection[] = [
    {
      title: "Training",
      icon: Dumbbell,
      hasData: hasTraining,
      content: hasTraining
        ? getTrainingSummary()!
        : "No workouts logged this week. Head to the Training tab and log your sessions — include RIR on each set so we can assess your effort.",
    },
    {
      title: "Nutrition",
      icon: Apple,
      hasData: hasNutrition,
      content: hasNutrition
        ? getNutritionSummary()!
        : "No weight entries this week. Log your bodyweight in Progress and track meals in Nutrition to get dietary insights.",
    },
    {
      title: "Lifestyle",
      icon: Heart,
      hasData: hasLifestyle,
      content: hasLifestyle
        ? getLifestyleSummary()!
        : "No daily check-ins this week. Open the Lifestyle tab and complete your daily check-in — rate sleep, stress, energy, and write a short note about your day.",
    },
    {
      title: "Overall Summary",
      icon: Sparkles,
      hasData: hasAllData,
      content: hasAllData
        ? "You've logged across all areas this week. Generate your AI review for a personalised breakdown and action items."
        : "We need more data to build your summary. Log workouts, check in daily, and track your weight. Add notes to give the AI more context — the more consistently you log, the better your review becomes.",
    },
  ];

  const renderAccordionSections = (items: { title: string; icon: React.ElementType; content: string; hasData?: boolean }[]) => (
    <Accordion type="single" collapsible className="space-y-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        const iconColor = item.hasData === false ? "text-muted-foreground" : "text-primary";
        return (
          <AccordionItem key={i} value={`section-${i}`} className="rounded-lg border border-border/50 bg-muted/30 px-4">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                {item.title}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <p className="text-sm leading-relaxed text-foreground/90">
                {item.content}
              </p>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  return (
    <Card variant="elevated">
      <CardHeader className="flex flex-row items-center justify-between p-3 md:p-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <CardTitle>Weekly Review</CardTitle>
        </div>
        {weeklyData.avgReadiness > 0 && (
          <div className="flex items-center gap-1.5">
            {(() => { const Icon = trendIcon; return <Icon className={`w-4 h-4 ${trendColor}`} />; })()}
            <Badge variant="secondary" className="font-mono">{weeklyData.avgReadiness}% avg</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!hasAnyData ? (
          <p className="text-sm text-muted-foreground">
            Not enough data for a weekly review yet. Log workouts, check in daily, and track your weight to see your summary here.
          </p>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 rounded-md bg-secondary/50">
                <p className="text-lg font-mono font-bold text-primary">{weeklyData.workoutsCompleted}</p>
                <p className="text-[10px] text-muted-foreground">Workouts</p>
              </div>
              <div className="text-center p-2 rounded-md bg-secondary/50">
                <p className="text-lg font-mono font-bold text-primary">
                  {weeklyData.totalVolume > 0 ? `${Math.round(weeklyData.totalVolume / 1000)}k` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">Volume</p>
              </div>
              <div className="text-center p-2 rounded-md bg-secondary/50">
                <p className="text-lg font-mono font-bold text-accent">{weeklyData.newPRs}</p>
                <p className="text-[10px] text-muted-foreground">PRs</p>
              </div>
            </div>

            {/* AI sections or guidance sections */}
            {sections
              ? renderAccordionSections(sections.map(s => ({ ...s, hasData: true })))
              : renderAccordionSections(guidanceSections)
            }

            {aiReview && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI-generated review
              </p>
            )}

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
