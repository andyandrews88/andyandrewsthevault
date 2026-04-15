import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Clock, TrendingUp, Pencil, FileText } from "lucide-react";
import { Workout, WorkoutExercise } from "@/types/workout";
import { format } from "date-fns";
import { useWorkoutStore } from "@/stores/workoutStore";
import { convertWeight } from "@/lib/weightConversion";

interface WorkoutHistoryViewProps {
  workout: Workout;
  exercises: WorkoutExercise[];
}

export function WorkoutHistoryView({ workout, exercises }: WorkoutHistoryViewProps) {
  const { preferredUnit, editWorkout } = useWorkoutStore();

  const formatWeight = (weight: number) => {
    const displayWeight = preferredUnit === 'kg' 
      ? convertWeight(weight, 'lbs', 'kg') 
      : weight;
    return `${displayWeight} ${preferredUnit}`;
  };

  return (
    <div className="space-y-4">
      {/* Workout Header */}
      <Card variant="elevated">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>{workout.workout_name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(new Date(workout.date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => editWorkout(workout.id)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Badge variant="outline">Completed</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Dumbbell className="h-4 w-4" />
              <span>{exercises.length} exercises</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>{formatWeight(workout.total_volume)} volume</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Notes */}
      {workout.notes && (
        <Card variant="elevated" className="border-primary/10">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{workout.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      {exercises.map((exercise) => (
        <Card key={exercise.id} variant="elevated">
          <CardHeader className="py-3">
            <CardTitle className="text-sm uppercase tracking-wide">
              {exercise.exercise_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {exercise.exercise_type === 'strength' && exercise.sets && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium pb-1 border-b">
                  <span>Set</span>
                  <span className="text-center">Weight</span>
                  <span className="text-center">Reps</span>
                </div>
                {exercise.sets
                  .filter(s => s.is_completed)
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <div key={set.id} className="grid grid-cols-3 py-1.5 text-xs font-mono">
                      <span className="text-muted-foreground">{set.set_number}</span>
                      <span className="text-center font-medium">
                        {set.weight ? formatWeight(set.weight) : '—'}
                      </span>
                      <span className="text-center font-medium">
                        {set.reps || '—'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            
            {exercise.exercise_type === 'conditioning' && exercise.conditioning_sets && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium pb-1 border-b">
                  <span>Set</span>
                  <span className="text-center">Duration</span>
                  <span className="text-center">Distance/Cals</span>
                </div>
                {exercise.conditioning_sets
                  .filter(s => s.is_completed)
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => {
                    const duration = set.duration_seconds 
                      ? `${Math.floor(set.duration_seconds / 60)}:${String(set.duration_seconds % 60).padStart(2, '0')}`
                      : '—';
                    const metric = set.distance 
                      ? `${set.distance} ${set.distance_unit}`
                      : set.calories 
                        ? `${set.calories} cal`
                        : '—';
                    
                    return (
                      <div key={set.id} className="grid grid-cols-3 py-1.5 text-xs font-mono">
                        <span className="text-muted-foreground">{set.set_number}</span>
                        <span className="text-center font-medium">{duration}</span>
                        <span className="text-center font-medium">{metric}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {exercises.length === 0 && (
        <Card variant="elevated">
          <CardContent className="py-6 text-center text-muted-foreground text-xs">
            <Dumbbell className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No exercises logged for this workout</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
