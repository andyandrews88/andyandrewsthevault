import { useState } from "react";
import { CheckCircle2, Dumbbell, Moon, Clock, Play, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useProgramStore, UserCalendarWorkout, ProgramExercise } from "@/stores/programStore";
import { useWorkoutStore } from "@/stores/workoutStore";
import { WendlerPercentageCalc } from "./WendlerPercentageCalc";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DailyProgramWorkoutProps {
  calendarWorkout: UserCalendarWorkout | undefined;
  programStyle: string | null | undefined;
  onComplete?: () => void;
  /** Called after "Start Logging" creates the workout so WorkoutLogger can take over */
  onStartLogging?: () => void;
  /** The date this workout is for */
  date?: Date;
  /** Called after rescheduling so parent can refresh */
  onRescheduled?: () => void;
}

function TempoExplanation({ tempo }: { tempo: string }) {
  const digits = tempo.split("");
  const labels = ["Eccentric", "Pause (bottom)", "Concentric", "Pause (top)"];
  return (
    <div className="space-y-1">
      <p className="font-mono font-bold text-sm">{tempo}</p>
      {digits.map((d, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="font-mono font-bold text-foreground">{d}</span> = {labels[i]}: {d === "X" ? "Explosive" : `${d} second${d !== "1" ? "s" : ""}`}
        </p>
      ))}
    </div>
  );
}

function ExerciseRow({ exercise, isFBB }: { exercise: ProgramExercise; isFBB: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-foreground">{exercise.name}</span>
          {isFBB && exercise.tempo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="font-mono text-xs cursor-help">
                    TEMPO: {exercise.tempo}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <TempoExplanation tempo={exercise.tempo} />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {exercise.notes && (
          <p className="text-xs text-muted-foreground mt-0.5">{exercise.notes}</p>
        )}
        {exercise.percentage_of_1rm && (
          <p className="text-xs text-primary font-mono mt-0.5">@ {exercise.percentage_of_1rm}% TM</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">{exercise.sets} × {exercise.reps}</span>
        {exercise.rest_seconds && exercise.rest_seconds > 0 && (
          <div className="flex items-center gap-1 justify-end mt-0.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{exercise.rest_seconds}s rest</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DailyProgramWorkout({
  calendarWorkout,
  programStyle,
  onComplete,
  onStartLogging,
  date,
  onRescheduled,
}: DailyProgramWorkoutProps) {
  const { markWorkoutComplete, isEnrolling, startProgramWorkoutSession, isStartingSession } = useProgramStore();
  const { fetchActiveWorkout } = useWorkoutStore();
  const [isStarting, setIsStarting] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();

  const isWendler = programStyle === "wendler";
  const isFBB = programStyle === "fbb";

  if (!calendarWorkout) {
    return (
      <Card variant="default" className="mt-4">
        <CardContent className="py-6 flex flex-col items-center gap-3 text-center">
          <Moon className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">Rest Day</p>
            <p className="text-sm text-muted-foreground mt-1">Recovery is where growth happens. Prioritize sleep, nutrition, and mobility today.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const workout = calendarWorkout.program_workout;
  const exercises: ProgramExercise[] = Array.isArray(workout?.exercises) ? workout.exercises : [];
  const programName = (calendarWorkout as any).enrollment?.program?.name;

  const handleStartLogging = async () => {
    setIsStarting(true);
    try {
      const sessionDate = date || new Date();
      const workoutId = await startProgramWorkoutSession(calendarWorkout, sessionDate);
      if (!workoutId) {
        toast.error("Failed to start session. Please try again.");
        return;
      }
      // Directly load this workout into the store (bypasses today-only filter)
      await (useWorkoutStore.getState() as any).loadWorkoutIntoActive(workoutId);
      onStartLogging?.();
    } catch (err) {
      console.error("Error starting program session:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !calendarWorkout) return;
    setIsRescheduling(true);
    try {
      const newDateStr = format(rescheduleDate, 'yyyy-MM-dd');
      const { error } = await supabase
        .from('user_calendar_workouts')
        .update({ scheduled_date: newDateStr })
        .eq('id', calendarWorkout.id);
      if (error) throw error;
      toast.success(`Workout moved to ${format(rescheduleDate, 'MMM d')}`);
      setRescheduleOpen(false);
      setRescheduleDate(undefined);
      onRescheduled?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to reschedule");
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <Card variant="data" className="mt-4">
      <CardHeader className="pb-2">
        {/* Program name badge */}
        {programName && (
          <Badge variant="outline" className="w-fit mb-1 text-xs font-semibold tracking-wide uppercase text-primary border-primary/40">
            {programName}
          </Badge>
        )}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">{workout?.workout_name ?? "Today's Workout"}</CardTitle>
            </div>
            {workout?.notes && (
              <p className="text-xs text-muted-foreground mt-1">{workout.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Reschedule button */}
            {!calendarWorkout.is_completed && (
              <Popover open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Move to another day">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-medium">Move to a different day</p>
                    <Calendar
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={setRescheduleDate}
                      className={cn("p-0 pointer-events-auto")}
                      initialFocus
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!rescheduleDate || isRescheduling}
                      onClick={handleReschedule}
                    >
                      {isRescheduling ? "Moving…" : "Confirm Move"}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {calendarWorkout.is_completed ? (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {isWendler && <WendlerPercentageCalc />}

        <div>
          {exercises.map((ex, i) => (
            <ExerciseRow key={i} exercise={ex} isFBB={isFBB} />
          ))}
        </div>

        {!calendarWorkout.is_completed && (
          <div className="flex flex-col gap-2 mt-2">
            {/* Primary: Start Logging (creates linked workout + hands off to ExerciseCard UI) */}
            <Button
              variant="elite"
              className="w-full"
              onClick={handleStartLogging}
              disabled={isStarting || isStartingSession}
            >
              {isStarting || isStartingSession ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isStarting || isStartingSession ? "Starting session…" : "Start Logging"}
            </Button>

            {/* Secondary: just mark done without logging weights */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={async () => {
                await markWorkoutComplete(calendarWorkout.id);
                onComplete?.();
              }}
              disabled={isEnrolling || isStarting}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Mark as Complete (no logging)
            </Button>
          </div>
        )}

        {calendarWorkout.is_completed && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Completed!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
