import { cn } from "@/lib/utils";
import { isBefore } from "date-fns";

interface ExerciseSet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  is_completed: boolean | null;
}

interface Exercise {
  id: string;
  exercise_name: string;
  order_index: number;
  notes: string | null;
  sets: ExerciseSet[];
}

export interface WorkoutWithExercises {
  id: string;
  workout_name: string;
  date: string;
  is_completed: boolean | null;
  total_volume: number | null;
  notes: string | null;
  exercises: Exercise[];
}

interface Props {
  workout: WorkoutWithExercises;
  onClick: () => void;
}

export function CalendarWorkoutCard({ workout, onClick }: Props) {
  const today = new Date();
  const wDate = new Date(workout.date + "T12:00:00");
  const isCompleted = !!workout.is_completed;
  const isMissed = !isCompleted && isBefore(wDate, today);

  const statusColor = isCompleted
    ? "border-l-green-500 bg-green-950/30"
    : isMissed
    ? "border-l-red-500 bg-red-950/30"
    : "border-l-blue-500 bg-blue-950/30";

  const dotColor = isCompleted ? "bg-green-500" : isMissed ? "bg-red-500" : "bg-blue-500";

  return (
    <div
      className={cn(
        "rounded-md border-l-[3px] p-2 cursor-pointer hover:brightness-125 transition-all text-xs space-y-1",
        "bg-card border border-border/50",
        statusColor
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColor)} />
        <span className="font-semibold text-foreground truncate text-[11px]">
          {workout.workout_name}
        </span>
      </div>

      {workout.exercises.slice(0, 4).map((ex, i) => {
        const workingSets = ex.sets.filter((s) => s.weight || s.reps);
        const summary = workingSets.length > 0
          ? `${workingSets.length}×${workingSets[0]?.reps || "—"}${workingSets[0]?.weight ? ` @${workingSets[0].weight}` : ""}`
          : "";
        return (
          <div key={ex.id} className="text-muted-foreground text-[10px] leading-tight truncate">
            <span className="text-foreground/70 font-medium">{String.fromCharCode(65 + i)})</span>{" "}
            {ex.exercise_name}
            {summary && <span className="text-muted-foreground/70 ml-1">{summary}</span>}
          </div>
        );
      })}
      {workout.exercises.length > 4 && (
        <div className="text-muted-foreground/50 text-[10px]">
          +{workout.exercises.length - 4} more
        </div>
      )}

      {workout.notes && (
        <div className="text-[10px] text-muted-foreground/60 italic truncate mt-0.5">
          📝 {workout.notes}
        </div>
      )}
    </div>
  );
}
