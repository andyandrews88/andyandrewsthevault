import { CheckCircle2, Dumbbell, Moon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProgramStore, UserCalendarWorkout, ProgramExercise } from "@/stores/programStore";
import { WendlerPercentageCalc } from "./WendlerPercentageCalc";

interface DailyProgramWorkoutProps {
  calendarWorkout: UserCalendarWorkout | undefined;
  programStyle: string | null | undefined;
  onComplete?: () => void;
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

export function DailyProgramWorkout({ calendarWorkout, programStyle, onComplete }: DailyProgramWorkoutProps) {
  const { markWorkoutComplete, isEnrolling } = useProgramStore();
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

  return (
    <Card variant="data" className="mt-4">
      <CardHeader className="pb-2">
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
          {calendarWorkout.is_completed ? (
            <Badge variant="secondary" className="flex items-center gap-1 shrink-0 text-xs">
              <CheckCircle2 className="w-3 h-3" />
              Done
            </Badge>
          ) : null}
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
          <Button
            variant="elite"
            className="w-full mt-2"
            onClick={async () => {
              await markWorkoutComplete(calendarWorkout.id);
              onComplete?.();
            }}
            disabled={isEnrolling}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark as Complete
          </Button>
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
