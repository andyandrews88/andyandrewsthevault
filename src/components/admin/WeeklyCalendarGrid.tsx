import { format, isSameDay, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { CalendarWorkoutCard, type WorkoutWithExercises } from "./CalendarWorkoutCard";
import { cn } from "@/lib/utils";

interface Props {
  days: Date[];
  workoutsByDate: Map<string, WorkoutWithExercises[]>;
  onAddNew: (date: Date) => void;
  onCardClick: (workout: WorkoutWithExercises) => void;
  onDeleteWorkout: (workoutId: string) => void;
}

export function WeeklyCalendarGrid({ days, workoutsByDate, onAddNew, onCardClick, onDeleteWorkout }: Props) {
  return (
    <div className="grid grid-cols-7 gap-1 min-h-[500px]">
      {/* Day headers */}
      {days.slice(0, 7).map((d, i) => (
        <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-1">
          {format(d, "EEE")}
        </div>
      ))}

      {/* Day columns - 2 weeks */}
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayWorkouts = workoutsByDate.get(key) || [];
        const today = isToday(day);

        return (
          <div
            key={key}
            className={cn(
              "border border-border/40 rounded-md p-1.5 flex flex-col gap-1 min-h-[220px] bg-card/30",
              today && "ring-1 ring-primary/60 bg-primary/5"
            )}
          >
            {/* Day header */}
            <div className="flex items-center justify-between mb-0.5">
              <span
                className={cn(
                  "text-xs font-medium",
                  today ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 opacity-50 hover:opacity-100"
                onClick={() => onAddNew(day)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Workout cards */}
            <div className="flex-1 space-y-1 overflow-y-auto">
              {dayWorkouts.map((w) => (
                <div key={w.id} className="relative group">
                  <CalendarWorkoutCard workout={w} onClick={() => onCardClick(w)} />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 bg-destructive/80 text-destructive-foreground rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWorkout(w.id);
                    }}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ))}

              {dayWorkouts.length === 0 && (
                <div className="flex items-center justify-center h-full min-h-[60px]">
                  <span className="text-[10px] text-muted-foreground/40 italic">Rest</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
