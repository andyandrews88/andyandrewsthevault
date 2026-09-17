import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, History, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkoutExercise } from "@/types/workout";
import { useSessionStore } from "@/stores/sessionStore";
import { StrengthSetRow } from "./StrengthSetRow";
import { MovementHistorySheet } from "./MovementHistorySheet";

interface Props {
  exercise: WorkoutExercise;
  readOnly?: boolean;
}

export function StrengthBlock({ exercise, readOnly }: Props) {
  const {
    saveStates,
    saveSet,
    toggleSetComplete,
    addSet,
    deleteSet,
    retrySave,
    removeExercise,
    lastPerformance,
    loadLastPerformance,
  } = useSessionStore();
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    loadLastPerformance(exercise.exercise_name);
  }, [exercise.exercise_name, loadLastPerformance]);

  const prev = lastPerformance[exercise.exercise_name.toLowerCase()];
  const sets = exercise.sets ?? [];
  const done = sets.filter((s) => s.is_completed).length;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide leading-tight">
            {exercise.exercise_name}
          </h3>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
            {done}/{sets.length} sets
            {prev ? ` · last ${new Date(prev.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}` : ""}
            {prev?.best_e1rm ? ` · best e1RM ${prev.best_e1rm}` : ""}
          </p>
          {exercise.coach_instructions && (
            <p className="text-xs text-primary/90 mt-1">{exercise.coach_instructions}</p>
          )}
          {exercise.notes && (
            <p className="text-xs text-muted-foreground mt-0.5">{exercise.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4 text-muted-foreground" />
          </Button>
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => addSet(exercise.id, "warmup")}>
                  <Plus className="h-4 w-4 mr-2" /> Add warm-up set
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => removeExercise(exercise.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove exercise
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[22px_1fr_1.3fr_46px_34px_26px] gap-1.5 px-3 pb-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        <span className="text-center">#</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Load</span>
        <span className="text-center">RPE</span>
        <span className="text-center">✓</span>
        <span />
      </div>

      <div className="px-3">
        {sets.map((s, i) => (
          <StrengthSetRow
            key={s.id}
            set={s}
            previous={prev?.sets[i] ?? prev?.sets[prev.sets.length - 1]}
            saveStatus={saveStates[s.id] ?? "idle"}
            readOnly={readOnly}
            onSave={(patch) => saveSet(s.id, patch)}
            onToggleComplete={(c) => toggleSetComplete(s.id, c)}
            onDelete={() => deleteSet(s.id)}
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
            onClick={() => addSet(exercise.id)}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add set
          </Button>
        </div>
      )}

      <MovementHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        exerciseName={exercise.exercise_name}
      />
    </div>
  );
}
