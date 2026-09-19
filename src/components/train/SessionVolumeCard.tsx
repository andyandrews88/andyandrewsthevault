import { useEffect, useState } from "react";
import {
  PATTERN_LABEL,
  fetchSessionVolume,
  formatTonnage,
  loadLibraryMap,
  type SessionVolume,
} from "@/lib/volumeAnalytics";
import { getStoredUnit } from "@/lib/weightConversion";
import { formatDuration } from "@/lib/trainUnits";

interface Props {
  workoutId: string;
  /** bump to recalculate after sets are logged */
  refreshKey?: number | string;
}

/**
 * Session tonnage from completed working sets only. Non-load work is reported
 * separately so kg totals stay honest.
 */
export function SessionVolumeCard({ workoutId, refreshKey }: Props) {
  const [data, setData] = useState<SessionVolume | null>(null);
  const unit = getStoredUnit();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const library = await loadLibraryMap();
      const v = await fetchSessionVolume(workoutId, library);
      if (!cancelled) setData(v);
    })();
    return () => {
      cancelled = true;
    };
  }, [workoutId, refreshKey]);

  if (!data) return null;

  const nl = data.nonLoad;
  const extras: string[] = [];
  if (nl.bodyweightReps > 0) extras.push(`${nl.bodyweightReps} bodyweight reps`);
  if (nl.plyoContacts > 0) extras.push(`${nl.plyoContacts} plyo contacts`);
  if (nl.timedSeconds > 0) extras.push(`${formatDuration(nl.timedSeconds)} timed`);
  if (nl.conditioningSeconds > 0)
    extras.push(`${formatDuration(nl.conditioningSeconds)} conditioning`);
  if (nl.conditioningDistanceM > 0)
    extras.push(`${(nl.conditioningDistanceM / 1000).toFixed(2)} km`);
  if (nl.conditioningCalories > 0) extras.push(`${nl.conditioningCalories} cal`);

  if (data.tonnageKg === 0 && extras.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Session load volume
        </p>
        <p className="text-lg font-semibold">{formatTonnage(data.tonnageKg, unit)}</p>
      </div>

      {data.byPattern.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.byPattern.map((p) => (
            <span
              key={p.pattern}
              className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {PATTERN_LABEL[p.pattern]} {formatTonnage(p.tonnageKg, unit)}
            </span>
          ))}
        </div>
      )}

      {extras.length > 0 && (
        <p className="text-[11px] text-muted-foreground">Also logged: {extras.join(" · ")}</p>
      )}
    </div>
  );
}
