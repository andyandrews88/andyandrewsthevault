import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  PATTERN_LABEL,
  aggregate,
  bucketByWeek,
  fetchVolumeRange,
  formatTonnage,
  loadLibraryMap,
  type SessionVolume,
} from "@/lib/volumeAnalytics";
import { getStoredUnit } from "@/lib/weightConversion";
import { formatDuration } from "@/lib/trainUnits";
import { cn } from "@/lib/utils";

type RangeKey = "4w" | "12w";

interface Props {
  /** athlete whose volume is shown — the coach passes the client id */
  userId: string;
  className?: string;
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function VolumeAnalytics({ userId, className }: Props) {
  const [range, setRange] = useState<RangeKey>("4w");
  const [sessions, setSessions] = useState<SessionVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const unit = getStoredUnit();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const library = await loadLibraryMap();
        const days = range === "4w" ? 28 : 84;
        const rows = await fetchVolumeRange(
          userId,
          isoDaysAgo(days),
          new Date().toISOString().slice(0, 10),
          library
        );
        if (!cancelled) setSessions(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, range]);

  const totals = useMemo(() => aggregate(sessions), [sessions]);
  const weeks = useMemo(
    () => bucketByWeek(sessions, range === "4w" ? 4 : 12),
    [sessions, range]
  );
  const maxWeek = Math.max(1, ...weeks.map((w) => w.tonnageKg));
  const maxPattern = Math.max(1, ...totals.byPattern.map((p) => p.tonnageKg));
  const nl = totals.nonLoad;
  const hasNonLoad =
    nl.bodyweightReps > 0 ||
    nl.plyoContacts > 0 ||
    nl.timedSeconds > 0 ||
    nl.conditioningSeconds > 0 ||
    nl.conditioningDistanceM > 0 ||
    nl.conditioningCalories > 0;

  if (loading) {
    return (
      <div className={cn("flex justify-center py-8", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Load volume · last {range === "4w" ? "4" : "12"} weeks
            </p>
            <p className="text-2xl font-semibold mt-1">{formatTonnage(totals.tonnageKg, unit)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totals.loadedSets} loaded sets across {sessions.filter((s) => s.tonnageKg > 0).length}{" "}
              sessions
            </p>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
            {(["4w", "12w"] as RangeKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 min-h-[44px] text-xs font-semibold",
                  range === r ? "bg-primary/15 text-primary" : "text-muted-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pattern distribution */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          By movement pattern
        </p>
        {totals.byPattern.length === 0 ? (
          <p className="text-sm text-muted-foreground">No loaded work logged in this window.</p>
        ) : (
          totals.byPattern.map((p) => {
            const share = totals.tonnageKg ? Math.round((p.tonnageKg / totals.tonnageKg) * 100) : 0;
            return (
              <div key={p.pattern} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span
                    className={cn(
                      "font-medium",
                      p.pattern === "unclassified" && "text-muted-foreground"
                    )}
                  >
                    {PATTERN_LABEL[p.pattern]}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatTonnage(p.tonnageKg, unit)} · {share}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      p.pattern === "unclassified" ? "bg-muted-foreground/40" : "bg-primary"
                    )}
                    style={{ width: `${Math.max(2, (p.tonnageKg / maxPattern) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}

        {totals.unclassifiedMovements.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-2 mt-1">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Not yet classified, so counted separately:{" "}
              {totals.unclassifiedMovements.slice(0, 6).join(", ")}
              {totals.unclassifiedMovements.length > 6
                ? ` +${totals.unclassifiedMovements.length - 6} more`
                : ""}
            </p>
          </div>
        )}
      </div>

      {/* Weekly trend */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Weekly trend
        </p>
        <div className="flex items-end gap-1 h-24">
          {weeks.map((w) => (
            <div key={w.weekStart} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{ height: `${Math.max(2, (w.tonnageKg / maxWeek) * 100)}%` }}
                  title={`${w.weekStart}: ${formatTonnage(w.tonnageKg, unit)}`}
                />
              </div>
              <span className="font-mono text-[8px] text-muted-foreground">
                {w.weekStart.slice(8)}/{w.weekStart.slice(5, 7)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Non-tonnage workload */}
      {hasNonLoad && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Other workload (not tonnage)
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {nl.bodyweightReps > 0 && (
              <Stat label="Bodyweight reps" value={nl.bodyweightReps.toLocaleString()} />
            )}
            {nl.plyoContacts > 0 && (
              <Stat label="Plyo contacts" value={nl.plyoContacts.toLocaleString()} />
            )}
            {nl.timedSeconds > 0 && (
              <Stat label="Timed work" value={formatDuration(nl.timedSeconds)} />
            )}
            {nl.conditioningSeconds > 0 && (
              <Stat label="Conditioning" value={formatDuration(nl.conditioningSeconds)} />
            )}
            {nl.conditioningDistanceM > 0 && (
              <Stat
                label="Distance"
                value={`${(nl.conditioningDistanceM / 1000).toFixed(2)} km`}
              />
            )}
            {nl.conditioningCalories > 0 && (
              <Stat label="Calories" value={nl.conditioningCalories.toLocaleString()} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}
