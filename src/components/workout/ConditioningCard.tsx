import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Trash2, Timer, ArrowUp, ArrowDown, RefreshCw, ChevronsUpDown } from "lucide-react";
import { WorkoutExercise, ConditioningSet } from "@/types/workout";
import { ConditioningSetRow } from "./ConditioningSetRow";
import { ExerciseSearch } from "./ExerciseSearch";
import { useWorkoutStore } from "@/stores/workoutStore";
import { AdminExerciseMenu } from "./AdminExerciseMenu";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface ConditioningCardProps {
  exercise: WorkoutExercise;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function ConditioningCard({ exercise, onRemove, onMoveUp, onMoveDown, canMoveUp = false, canMoveDown = false }: ConditioningCardProps) {
  const { isAdmin } = useAdminCheck();
  const { 
    addConditioningSet, 
    removeConditioningSet, 
    updateConditioningSet, 
    completeConditioningSet,
    replaceExercise
  } = useWorkoutStore();
  const [showReplaceSearch, setShowReplaceSearch] = useState(false);

  const completedSets = exercise.conditioning_sets?.filter(s => s.is_completed).length || 0;
  const totalSets = exercise.conditioning_sets?.length || 0;

  const allCompleted = useMemo(() => totalSets > 0 && completedSets === totalSets, [completedSets, totalSets]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  useEffect(() => { if (allCompleted) setIsCollapsed(true); }, [allCompleted]);

  const handleComplete = async (setId: string) => {
    await completeConditioningSet(setId);
  };

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
    <Card variant="elevated" className="overflow-hidden border-l-4 border-l-accent">
      <CardHeader className="py-3 px-4 bg-accent/10 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-accent" />
            <div>
              <h3 className="font-semibold text-base uppercase tracking-wide">
                {exercise.exercise_name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {completedSets}/{totalSets} sets completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {canMoveUp && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
            )}
            {canMoveDown && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown}>
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowReplaceSearch(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Replace Exercise
              </DropdownMenuItem>
              <AdminExerciseMenu exerciseName={exercise.exercise_name} isAdmin={isAdmin} />
              <DropdownMenuItem onClick={onRemove} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Exercise
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronsUpDown className={`h-4 w-4 text-muted-foreground`} />
          </div>
        </div>
      </CardHeader>
      
      <CollapsibleContent>
      <CardContent className="p-0">
        <div className="hidden sm:grid grid-cols-[32px_1fr_1fr_1fr_40px_28px] gap-1.5 sm:gap-2 items-center py-2 px-4 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
          <span className="text-center">Set</span>
          <span className="text-center">Time</span>
          <span className="text-center">Distance</span>
          <span className="text-center">Cals</span>
          <span className="text-center">✓</span>
          <span></span>
        </div>
        <div className="px-4">
          {exercise.conditioning_sets?.map((set) => (
            <ConditioningSetRow
              key={set.id}
              set={set}
              onUpdate={(data) => updateConditioningSet(set.id, data)}
              onComplete={() => handleComplete(set.id)}
              onRemove={() => removeConditioningSet(set.id)}
            />
          ))}
        </div>
        <div className="p-3 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addConditioningSet(exercise.id)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
        </div>
      </CardContent>
      </CollapsibleContent>
      <ExerciseSearch
        open={showReplaceSearch}
        onOpenChange={setShowReplaceSearch}
        onSelectExercise={(name) => replaceExercise(exercise.id, name)}
        mode="replace"
      />
    </Card>
    </Collapsible>
  );
}
