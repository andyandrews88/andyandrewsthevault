import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Dumbbell, Scale, UtensilsCrossed } from "lucide-react";
import { ServiceTier, TIER_DESCRIPTION, TIER_LABEL } from "@/lib/entitlements";

export interface OverviewData {
  completedLast7: number;
  completedLast28: number;
  lastWorkoutDate: string | null;
  activeProgramName: string | null;
  lastFoodLogDate: string | null;
  hasNutritionTarget: boolean;
  latestBodyEntry: { entry_date: string; weight_kg: number | null; body_fat_percent: number | null } | null;
  unreadFromClient: number;
}

interface Props {
  tier: ServiceTier;
  status: "active" | "archived" | "pending";
  data: OverviewData;
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[11px] uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-lg font-semibold mt-1">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function ClientOverview({ tier, status, data }: Props) {
  const actions: string[] = [];
  if (status === "active") {
    if (!data.lastWorkoutDate) actions.push("No training logged yet.");
    else if (differenceInDays(new Date(), new Date(data.lastWorkoutDate)) >= 7)
      actions.push(`No session logged since ${format(new Date(data.lastWorkoutDate), "d MMM")}.`);
    if (tier === "tier_1" && !data.activeProgramName) actions.push("No program assigned.");
    if (tier === "tier_1" && !data.hasNutritionTarget) actions.push("No nutrition targets set.");
    if (data.unreadFromClient > 0) actions.push(`${data.unreadFromClient} unread message${data.unreadFromClient > 1 ? "s" : ""} from this client.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{TIER_LABEL[tier]}</Badge>
        <span className="text-xs text-muted-foreground">{TIER_DESCRIPTION[tier]}</span>
        {status === "archived" && <Badge variant="secondary" className="text-[10px]">Archived</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat
          icon={Dumbbell}
          label="Training"
          value={`${data.completedLast7} / 7d`}
          sub={data.lastWorkoutDate ? `Last ${format(new Date(data.lastWorkoutDate), "d MMM")}` : "Nothing logged"}
        />
        <Stat icon={Dumbbell} label="Last 28 days" value={`${data.completedLast28} sessions`} sub={data.activeProgramName ?? "No program"} />
        <Stat
          icon={UtensilsCrossed}
          label="Nutrition"
          value={data.lastFoodLogDate ? format(new Date(data.lastFoodLogDate), "d MMM") : "No logs"}
          sub={tier === "tier_1" ? (data.hasNutritionTarget ? "Targets set" : "No targets") : "Self-managed"}
        />
        <Stat
          icon={Scale}
          label="Body"
          value={data.latestBodyEntry?.weight_kg ? `${data.latestBodyEntry.weight_kg} kg` : "—"}
          sub={data.latestBodyEntry ? format(new Date(data.latestBodyEntry.entry_date), "d MMM yyyy") : "No entries"}
        />
      </div>

      {actions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Needs your attention</p>
          <ul className="space-y-1.5">
            {actions.map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
