import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, History, Trash2, Percent } from "lucide-react";
import { WorkoutExercise } from "@/types/workout";
import { SetRow } from "./SetRow";
import { useWorkoutStore } from "@/stores/workoutStore";

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onRemove: () => void;
}

/**
 * Parses a percentage hint encoded in exercise notes during program session creation.
 * Format: "@ 85% TM" — returns "85" or null.
 */
function parsePercentageHint(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/@\s*(\d+(?:\.\d+)?)%\s*TM/);
  return match ? match[1] : null;
}

export function ExerciseCard({ exercise, onRemove }: ExerciseCardProps) {
  const { addSet, removeSet, updateSet, completeSet, loadLastSession, getLastSessionSets, preferredUnit } = useWorkoutStore();
  const [previousSets, setPreviousSets] = useState<{ weight: number; reps: number }[]>([]);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  const percentageHint = parsePercentageHint(exercise.notes);

  useEffect(() => {
    // Fetch previous session data on mount
    const fetchPrevious = async () => {
      const sets = await getLastSessionSets(exercise.exercise_name);
      setPreviousSets(sets);
    };
    fetchPrevious();
  }, [exercise.exercise_name, getLastSessionSets]);

  const handleLoadLastSession = async () => {
    setIsLoadingPrevious(true);
    await loadLastSession(exercise.id, exercise.exercise_name);
    setIsLoadingPrevious(false);
  };

  const handleCompleteSet = async (setId: string, weight: number, reps: number, rir?: number | null) => {
    await completeSet(setId, exercise.exercise_name, weight, reps, rir);
  };

  const completedSets = exercise.sets?.filter(s => s.is_completed).length || 0;
  const totalSets = exercise.sets?.length || 0;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base uppercase tracking-wide">
              {exercise.exercise_name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">
                {completedSets}/{totalSets} sets completed
              </p>
              {percentageHint && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5 h-4">
                  <Percent className="w-2.5 h-2.5" />
                  {percentageHint}% TM
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLoadLastSession} disabled={isLoadingPrevious}>
                <History className="h-4 w-4 mr-2" />
                Load Last Session
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Exercise
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Header Row */}
        <div className="grid grid-cols-[28px_1fr_1fr_1fr_44px_36px_24px] gap-1 sm:gap-1.5 items-center py-2 px-4 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
          <span className="text-center">Set</span>
          <span className="text-center">Prev</span>
          <span className="text-center">{preferredUnit === 'kg' ? 'Kg' : 'Lbs'}</span>
          <span className="text-center">Reps</span>
          <span className="text-center">RIR</span>
          <span className="text-center">✓</span>
          <span></span>
        </div>
        
        {/* Sets */}
        <div className="px-4">
          {exercise.sets?.map((set, index) => (
            <SetRow
              key={set.id}
              set={set}
              previousData={previousSets[index] || null}
              onUpdate={(data) => updateSet(set.id, data)}
              onComplete={(weight, reps, rir) => { handleCompleteSet(set.id, weight, reps, rir); }}
              onRemove={() => removeSet(set.id)}
            />
          ))}
        </div>
        
        {/* Add Set Button */}
        <div className="p-3 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addSet(exercise.id)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
