import { useState } from "react";
import { format, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Pencil, Move, Copy, CheckSquare } from "lucide-react";
import { CalendarWorkoutCard, type WorkoutWithExercises } from "./CalendarWorkoutCard";
import { cn } from "@/lib/utils";

interface Props {
  days: Date[];
  workoutsByDate: Map<string, WorkoutWithExercises[]>;
  onAddNew: (date: Date) => void;
  onCardClick: (workout: WorkoutWithExercises) => void;
  onDeleteWorkout: (workoutId: string) => void;
  onCopyWorkout?: (workoutId: string, targetDate: string) => void;
  onMoveWorkout?: (workoutId: string, targetDate: string) => void;
  selectedWorkoutIds?: string[];
  onToggleSelect?: (workoutId: string) => void;
  selectMode?: boolean;
  onToggleSelectMode?: () => void;
}

export function WeeklyCalendarGrid({
  days,
  workoutsByDate,
  onAddNew,
  onCardClick,
  onDeleteWorkout,
  onCopyWorkout,
  onMoveWorkout,
  selectedWorkoutIds = [],
  onToggleSelect,
  selectMode = false,
  onToggleSelectMode,
}: Props) {
  const [hoveredWorkout, setHoveredWorkout] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-7 gap-1 min-h-[500px]">
      {/* Day headers */}
      {days.slice(0, 7).map((d, i) => (
        <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-1">
          {format(d, "EEE")}
        </div>
      ))}

      {/* Day columns */}
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
              {dayWorkouts.map((w) => {
                const isSelected = selectedWorkoutIds.includes(w.id);
                return (
                  <div
                    key={w.id}
                    className="relative group"
                    onMouseEnter={() => setHoveredWorkout(w.id)}
                    onMouseLeave={() => setHoveredWorkout(null)}
                  >
                    {/* Selection checkbox overlay */}
                    {selectMode && (
                      <div className="absolute top-1 left-1 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelect?.(w.id)}
                          className="h-4 w-4 bg-background/80"
                        />
                      </div>
                    )}

                    <div className={cn(
                      selectMode && isSelected && "ring-2 ring-primary rounded-md"
                    )}>
                      <CalendarWorkoutCard workout={w} onClick={() => {
                        if (selectMode) {
                          onToggleSelect?.(w.id);
                        } else {
                          onCardClick(w);
                        }
                      }} />
                    </div>

                    {/* CoachRx-style toolbar — appears on hover */}
                    {hoveredWorkout === w.id && !selectMode && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-secondary border border-border rounded-md shadow-lg px-1 py-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          title="Edit"
                          onClick={(e) => { e.stopPropagation(); onCardClick(w); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {onMoveWorkout && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            title="Move to another day"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newDate = prompt("Move to date (YYYY-MM-DD):", key);
                              if (newDate && newDate !== key) onMoveWorkout(w.id, newDate);
                            }}
                          >
                            <Move className="h-3 w-3" />
                          </Button>
                        )}
                        {onCopyWorkout && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            title="Copy to another day"
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetDate = prompt("Copy to date (YYYY-MM-DD):", key);
                              if (targetDate) onCopyWorkout(w.id, targetDate);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                        {onToggleSelectMode && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            title="Multi-select"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSelectMode();
                              onToggleSelect?.(w.id);
                            }}
                          >
                            <CheckSquare className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteWorkout(w.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

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
