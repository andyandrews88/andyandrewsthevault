import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, MoreVertical, Loader2, AlertCircle, SlidersHorizontal } from "lucide-react";
import type { ConditioningSet, WorkoutExercise } from "@/types/workout";
import { useSessionStore, type SaveStatus } from "@/stores/sessionStore";
import {
  ALL_CONDITIONING_FIELDS,
  CONDITIONING_MODALITIES,
  ConditioningField,
  findModality,
  guessModality,
  HR_ZONES,
} from "@/lib/conditioningModalities";
import { durationToParts, formatDuration, parseNum, partsToDuration } from "@/lib/trainUnits";

interface Props {
  exercise: WorkoutExercise;
  readOnly?: boolean;
}

const FIELD_LABELS: Record<ConditioningField, string> = {
  duration: "Time",
  calories: "Calories",
  distance: "Distance",
  avg_watts: "Avg watts",
  avg_speed: "Avg speed",
  cadence_rpm: "Cadence (rpm)",
  avg_heart_rate: "Avg HR",
  max_heart_rate: "Max HR",
  hr_zone: "HR zone",
  rpe: "RPE",
};

function TargetLine({ set }: { set: ConditioningSet }) {
  const parts = [
    set.target_duration_seconds ? `time ${formatDuration(set.target_duration_seconds)}` : null,
    set.target_distance ? `distance ${set.target_distance}` : null,
    set.target_watts ? `${set.target_watts}W` : null,
    set.target_hr_zone ? `zone ${set.target_hr_zone}` : null,
    set.target_hr_min || set.target_hr_max
      ? `HR ${set.target_hr_min ?? "—"}-${set.target_hr_max ?? "—"}`
      : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p className="font-mono text-[9px] uppercase tracking-wide text-primary">
      Target {parts.join(" · ")}
    </p>
  );
}

function ConditioningSetCard({
  set,
  fields,
  saveStatus,
  readOnly,
  onSave,
  onDelete,
  onRetry,
}: {
  set: ConditioningSet;
  fields: ConditioningField[];
  saveStatus: SaveStatus;
  readOnly?: boolean;
  onSave: (patch: Partial<ConditioningSet>) => void;
  onDelete: () => void;
  onRetry: () => void;
}) {
  const initial = durationToParts(set.duration_seconds);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [seconds, setSeconds] = useState(initial.seconds);
  const [showAll, setShowAll] = useState(false);
  const [notes, setNotes] = useState(set.notes ?? "");

  useEffect(() => {
    const p = durationToParts(set.duration_seconds);
    setMinutes(p.minutes);
    setSeconds(p.seconds);
  }, [set.duration_seconds]);

  const visible = showAll ? ALL_CONDITIONING_FIELDS : fields;

  const numField = (field: ConditioningField, key: keyof ConditioningSet, mode: "numeric" | "decimal") => (
    <label key={field} className="block">
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {FIELD_LABELS[field]}
      </span>
      <Input
        type="number"
        inputMode={mode}
        disabled={readOnly}
        defaultValue={(set[key] as number | null) ?? ""}
        onBlur={(e) => {
          const v = parseNum(e.target.value);
          if (v !== (set[key] as number | null)) onSave({ [key]: v } as Partial<ConditioningSet>);
        }}
        className="h-10 text-center text-sm mt-0.5"
      />
    </label>
  );

  return (
    <div className="rounded-lg border border-border/70 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Effort {set.set_number}
        </span>
        <div className="flex items-center gap-1">
          {saveStatus === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {saveStatus === "error" && (
            <button onClick={onRetry} title="Retry save">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </button>
          )}
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowAll((v) => !v)}
                title="All fields"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <TargetLine set={set} />

      <div className="grid grid-cols-2 gap-2">
        {visible.includes("duration") && (
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Time (min : sec)
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="min"
                value={minutes}
                disabled={readOnly}
                onChange={(e) => setMinutes(e.target.value)}
                onBlur={() => {
                  const v = partsToDuration(minutes, seconds);
                  if (v !== set.duration_seconds) onSave({ duration_seconds: v });
                }}
                className="h-10 text-center text-sm"
              />
              <span className="text-muted-foreground">:</span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="sec"
                value={seconds}
                disabled={readOnly}
                onChange={(e) => setSeconds(e.target.value)}
                onBlur={() => {
                  const v = partsToDuration(minutes, seconds);
                  if (v !== set.duration_seconds) onSave({ duration_seconds: v });
                }}
                className="h-10 text-center text-sm"
              />
            </div>
          </label>
        )}

        {visible.includes("distance") && (
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Distance
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Input
                type="number"
                inputMode="decimal"
                disabled={readOnly}
                defaultValue={set.distance ?? ""}
                onBlur={(e) => {
                  const v = parseNum(e.target.value);
                  if (v !== set.distance) onSave({ distance: v });
                }}
                className="h-10 text-center text-sm flex-1 min-w-0"
              />
              <Select
                value={set.distance_unit}
                disabled={readOnly}
                onValueChange={(v) => onSave({ distance_unit: v as ConditioningSet["distance_unit"] })}
              >
                <SelectTrigger className="h-10 w-14 px-1 text-xs shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miles">mi</SelectItem>
                  <SelectItem value="km">km</SelectItem>
                  <SelectItem value="meters">m</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </label>
        )}

        {visible.includes("calories") && numField("calories", "calories", "numeric")}
        {visible.includes("avg_watts") && numField("avg_watts", "avg_watts", "decimal")}

        {visible.includes("avg_speed") && (
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Avg speed
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Input
                type="number"
                inputMode="decimal"
                disabled={readOnly}
                defaultValue={set.avg_speed ?? ""}
                onBlur={(e) => {
                  const v = parseNum(e.target.value);
                  if (v !== set.avg_speed) onSave({ avg_speed: v });
                }}
                className="h-10 text-center text-sm flex-1 min-w-0"
              />
              <Select
                value={set.speed_unit ?? "mph"}
                disabled={readOnly}
                onValueChange={(v) => onSave({ speed_unit: v })}
              >
                <SelectTrigger className="h-10 w-16 px-1 text-xs shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mph">mph</SelectItem>
                  <SelectItem value="kph">kph</SelectItem>
                  <SelectItem value="min/km">min/km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </label>
        )}

        {visible.includes("cadence_rpm") && numField("cadence_rpm", "cadence_rpm", "decimal")}
        {visible.includes("avg_heart_rate") && numField("avg_heart_rate", "avg_heart_rate", "numeric")}
        {visible.includes("max_heart_rate") && numField("max_heart_rate", "max_heart_rate", "numeric")}

        {visible.includes("hr_zone") && (
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              HR zone
            </span>
            <Select
              value={set.hr_zone ?? ""}
              disabled={readOnly}
              onValueChange={(v) => onSave({ hr_zone: v })}
            >
              <SelectTrigger className="h-10 text-sm mt-0.5">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {HR_ZONES.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}

        {visible.includes("rpe") && numField("rpe", "rpe", "decimal")}
      </div>

      <Input
        placeholder="Notes"
        value={notes}
        disabled={readOnly}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          const v = notes.trim() || null;
          if (v !== set.notes) onSave({ notes: v });
        }}
        className="h-9 text-xs"
      />

      <label className="flex items-center gap-2 pt-0.5">
        <Checkbox
          checked={set.is_completed}
          disabled={readOnly}
          onCheckedChange={(c) => onSave({ is_completed: !!c })}
          className="h-5 w-5"
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Completed
        </span>
      </label>
    </div>
  );
}

export function ConditioningBlock({ exercise, readOnly }: Props) {
  const {
    saveStates,
    saveConditioningSet,
    addConditioningSet,
    deleteConditioningSet,
    retrySave,
    removeExercise,
  } = useSessionStore();

  const sets = exercise.conditioning_sets ?? [];
  const modalityId = sets[0]?.modality ?? guessModality(exercise.exercise_name);
  const modality = findModality(modalityId);
  const fields = modality?.fields ?? ["duration", "calories", "rpe"];

  const setModality = (id: string) => {
    const def = findModality(id);
    sets.forEach((s) =>
      saveConditioningSet(s.id, {
        modality: id,
        distance_unit: def?.distanceUnit ?? s.distance_unit,
        speed_unit: def?.speedUnit ?? s.speed_unit,
      })
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card border-l-2 border-l-accent">
      <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide leading-tight">
            {exercise.exercise_name}
          </h3>
          {exercise.coach_instructions && (
            <p className="text-xs text-primary/90 mt-1">{exercise.coach_instructions}</p>
          )}
          {exercise.notes && <p className="text-xs text-muted-foreground mt-0.5">{exercise.notes}</p>}
        </div>
        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={() => removeExercise(exercise.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Remove exercise
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="px-3 pb-2">
        <Select value={modalityId ?? ""} disabled={readOnly} onValueChange={setModality}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Select modality" />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONING_MODALITIES.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="px-3 space-y-2">
        {sets.map((s) => (
          <ConditioningSetCard
            key={s.id}
            set={s}
            fields={fields}
            saveStatus={saveStates[s.id] ?? "idle"}
            readOnly={readOnly}
            onSave={(patch) => saveConditioningSet(s.id, patch)}
            onDelete={() => deleteConditioningSet(s.id)}
            onRetry={() => retrySave(s.id)}
          />
        ))}
      </div>

      {!readOnly && (
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9"
            onClick={() => addConditioningSet(exercise.id, modalityId)}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add effort
          </Button>
        </div>
      )}
    </div>
  );
}
