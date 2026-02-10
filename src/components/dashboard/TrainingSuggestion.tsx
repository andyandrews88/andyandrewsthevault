import { useDashboardStore } from "@/stores/dashboardStore";
import { Badge } from "@/components/ui/badge";
import { Zap, Activity, AlertTriangle, BedDouble, ClipboardList } from "lucide-react";

interface Zone {
  label: string;
  suggestion: string;
  icon: React.ElementType;
  badgeVariant: "success" | "data" | "warning" | "destructive" | "secondary";
  borderClass: string;
}

function getZone(score: number, hasCheckin: boolean): Zone {
  if (!hasCheckin) {
    return {
      label: "No Check-in",
      suggestion: "Complete your daily check-in to get a training recommendation.",
      icon: ClipboardList,
      badgeVariant: "secondary",
      borderClass: "border-border",
    };
  }
  if (score >= 85) {
    return {
      label: "Push",
      suggestion: "Readiness is high. Great day to push intensity — go for PRs or increase volume.",
      icon: Zap,
      badgeVariant: "success",
      borderClass: "border-success/30",
    };
  }
  if (score >= 70) {
    return {
      label: "Normal",
      suggestion: "Solid readiness. Train as programmed. Stay consistent.",
      icon: Activity,
      badgeVariant: "data",
      borderClass: "border-primary/30",
    };
  }
  if (score >= 50) {
    return {
      label: "Moderate",
      suggestion: "Readiness is moderate. Consider reducing volume by 10-20% or skipping heavy compounds.",
      icon: AlertTriangle,
      badgeVariant: "warning",
      borderClass: "border-warning/30",
    };
  }
  return {
    label: "Recovery",
    suggestion: "Readiness is low. Prioritise recovery today — light mobility, a walk, or complete rest.",
    icon: BedDouble,
    badgeVariant: "destructive",
    borderClass: "border-destructive/30",
  };
}

function getLowScores(readiness: { sleep: number; stress: number; energy: number; drive: number }): string | null {
  const low: string[] = [];
  if (readiness.sleep <= 2) low.push("sleep");
  if (readiness.stress <= 2) low.push("stress");
  if (readiness.energy <= 2) low.push("energy");
  if (readiness.drive <= 2) low.push("drive");
  if (low.length === 0) return null;
  return `${low.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" and ")} ${low.length > 1 ? "are" : "is"} low today.`;
}

export function TrainingSuggestion() {
  const { todayReadiness } = useDashboardStore();
  const zone = getZone(todayReadiness.score, todayReadiness.hasCheckin);
  const ZoneIcon = zone.icon;
  const lowScores = todayReadiness.hasCheckin ? getLowScores(todayReadiness) : null;

  return (
    <div className={`rounded-lg border ${zone.borderClass} bg-card p-4 flex items-start gap-3`}>
      <div className="mt-0.5">
        <ZoneIcon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={zone.badgeVariant}>{zone.label}</Badge>
          {todayReadiness.hasCheckin && (
            <span className="text-xs font-mono text-muted-foreground">{todayReadiness.score}%</span>
          )}
        </div>
        <p className="text-sm text-foreground/90">{zone.suggestion}</p>
        {lowScores && (
          <p className="text-xs text-muted-foreground mt-1">{lowScores}</p>
        )}
      </div>
    </div>
  );
}
