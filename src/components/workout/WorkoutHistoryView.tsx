import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Clock, TrendingUp } from "lucide-react";
import { Workout, WorkoutExercise } from "@/types/workout";
import { format } from "date-fns";
import { useWorkoutStore } from "@/stores/workoutStore";
import { convertWeight } from "@/lib/weightConversion";

interface WorkoutHistoryViewProps {
  workout: Workout;
  exercises: WorkoutExercise[];
}

export function WorkoutHistoryView({ workout, exercises }: WorkoutHistoryViewProps) {
  const { preferredUnit } = useWorkoutStore();

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{workout.workout_name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(workout.date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <Badge variant="outline">Completed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
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

      {/* Exercises */}
      {exercises.map((exercise) => (
        <Card key={exercise.id} variant="elevated">
          <CardHeader className="py-3">
            <CardTitle className="text-base uppercase tracking-wide">
              {exercise.exercise_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {exercise.exercise_type === 'strength' && exercise.sets && (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium pb-1 border-b">
                  <span>Set</span>
                  <span className="text-center">Weight</span>
                  <span className="text-center">Reps</span>
                </div>
                
                {/* Sets */}
                {exercise.sets
                  .filter(s => s.is_completed)
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <div key={set.id} className="grid grid-cols-3 py-1.5 text-sm">
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
                {/* Header */}
                <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium pb-1 border-b">
                  <span>Set</span>
                  <span className="text-center">Duration</span>
                  <span className="text-center">Distance/Cals</span>
                </div>
                
                {/* Sets */}
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
                      <div key={set.id} className="grid grid-cols-3 py-1.5 text-sm">
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
          <CardContent className="py-8 text-center text-muted-foreground">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No exercises logged for this workout</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
