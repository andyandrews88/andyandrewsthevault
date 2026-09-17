import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle, Loader2, StickyNote } from "lucide-react";
import type { ExerciseSet, SetUnit } from "@/types/workout";
import type { LastPerformanceSet, SaveStatus } from "@/stores/sessionStore";
import { convertSetWeight, estimate1RM, parseNum } from "@/lib/trainUnits";
import { cn } from "@/lib/utils";

interface Props {
  set: ExerciseSet;
  previous?: LastPerformanceSet;
  saveStatus: SaveStatus;
  readOnly?: boolean;
  onSave: (patch: Partial<ExerciseSet>) => void;
  onToggleComplete: (completed: boolean) => void;
  onDelete: () => void;
  onRetry: () => void;
}

export function StrengthSetRow({
  set,
  previous,
  saveStatus,
  readOnly,
  onSave,
  onToggleComplete,
  onDelete,
  onRetry,
}: Props) {
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [weight, setWeight] = useState(set.weight?.toString() ?? "");
  const [rpe, setRpe] = useState(set.rpe?.toString() ?? "");
  const [showNotes, setShowNotes] = useState(!!set.notes);
  const [notes, setNotes] = useState(set.notes ?? "");

  useEffect(() => {
    setReps(set.reps?.toString() ?? "");
    setWeight(set.weight?.toString() ?? "");
    setRpe(set.rpe?.toString() ?? "");
    setNotes(set.notes ?? "");
  }, [set.reps, set.weight, set.rpe, set.notes]);

  const commit = (patch: Partial<ExerciseSet>) => {
    const changed = Object.entries(patch).some(
      ([k, v]) => (set as any)[k] !== v
    );
    if (changed) onSave(patch);
  };

  const cycleUnit = () => {
    const next: SetUnit = set.unit === "kg" ? "lb" : "kg";
    const current = parseNum(weight);
    const converted = current !== null ? convertSetWeight(current, set.unit, next) : null;
    setWeight(converted !== null ? converted.toString() : "");
    onSave({ unit: next, weight: converted });
  };

  const target =
    set.is_prescribed || set.prescribed_reps || set.prescribed_weight || set.prescribed_rpe
      ? [
          set.prescribed_reps ? `${set.prescribed_reps} reps` : null,
          set.prescribed_weight ? `${set.prescribed_weight}${set.unit}` : null,
          set.prescribed_rpe ? `RPE ${set.prescribed_rpe}` : null,
          set.tempo ? `tempo ${set.tempo}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : set.tempo
      ? `tempo ${set.tempo}`
      : null;

  const prevLabel = previous
    ? `${previous.reps ?? "—"} × ${previous.weight ?? "—"}${previous.unit}${
        previous.rpe ? ` @${previous.rpe}` : ""
      }`
    : null;

  const e1rm = estimate1RM(set.weight, set.reps);
  const disabled = readOnly;

  return (
    <div
      className={cn(
        "py-1.5 border-b border-border/40 last:border-0",
        set.is_completed && "bg-primary/5"
      )}
    >
      <div className="grid grid-cols-[22px_1fr_1.3fr_46px_34px_26px] gap-1.5 items-center">
        <span className="text-center font-mono text-[11px] text-muted-foreground">
          {set.set_type === "warmup" ? "W" : set.set_number}
        </span>

        <Input
          type="number"
          inputMode="numeric"
          placeholder={previous?.reps ? String(previous.reps) : "reps"}
          value={reps}
          disabled={disabled}
          onChange={(e) => setReps(e.target.value)}
          onBlur={() => commit({ reps: parseNum(reps) })}
          className="h-10 text-center text-sm px-1"
        />

        <div className="flex items-center gap-1">
          <Input
            type="number"
            inputMode="decimal"
            placeholder={previous?.weight ? String(previous.weight) : "load"}
            value={weight}
            disabled={disabled}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={() => commit({ weight: parseNum(weight) })}
            className="h-10 text-center text-sm px-1 flex-1 min-w-0"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={cycleUnit}
            className="h-10 px-1.5 rounded-md border border-border font-mono text-[10px] uppercase text-muted-foreground shrink-0"
          >
            {set.unit}
          </button>
        </div>

        <Input
          type="number"
          inputMode="decimal"
          placeholder="rpe"
          value={rpe}
          disabled={disabled}
          onChange={(e) => setRpe(e.target.value)}
          onBlur={() => commit({ rpe: parseNum(rpe) })}
          className="h-10 text-center text-sm px-1"
        />

        <div className="flex justify-center">
          <Checkbox
            checked={set.is_completed}
            disabled={disabled}
            onCheckedChange={(c) => onToggleComplete(!!c)}
            className="h-6 w-6"
          />
        </div>

        <div className="flex justify-center">
          {saveStatus === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : saveStatus === "error" ? (
            <button onClick={onRetry} title="Retry save">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </button>
          ) : !disabled ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      {(target || prevLabel || e1rm) && (
        <div className="pl-[26px] pr-1 flex flex-wrap items-center gap-x-2 mt-0.5 font-mono text-[9px] uppercase tracking-wide">
          {target && <span className="text-primary">Target {target}</span>}
          {prevLabel && <span className="text-muted-foreground">Last {prevLabel}</span>}
          {e1rm && <span className="text-muted-foreground">e1RM {e1rm}{set.unit}</span>}
        </div>
      )}

      {!disabled && (
        <div className="pl-[26px] mt-0.5">
          {showNotes ? (
            <Input
              placeholder="Set note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => commit({ notes: notes.trim() || null })}
              className="h-8 text-xs"
            />
          ) : (
            <button
              onClick={() => setShowNotes(true)}
              className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/70"
            >
              <StickyNote className="h-3 w-3" /> Note
            </button>
          )}
        </div>
      )}

      {saveStatus === "error" && (
        <p className="pl-[26px] mt-1 text-[10px] text-destructive">
          Not saved. Tap the warning icon to retry.
        </p>
      )}
    </div>
  );
}
