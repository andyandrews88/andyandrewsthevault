import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Plus, MoreVertical, History, Trash2, Percent, Play, ChevronUp, ChevronDown, Link, Unlink, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { WorkoutExercise } from "@/types/workout";
import { SetRow } from "./SetRow";
import { ExerciseSearch } from "./ExerciseSearch";
import { useWorkoutStore } from "@/stores/workoutStore";
import { supabase } from "@/integrations/supabase/client";
import { toEmbedUrl } from "@/lib/vaultService";
import { cn } from "@/lib/utils";
import { AdminExerciseMenu } from "./AdminExerciseMenu";
import { isTimedExercise, isBodyweightExercise } from "@/lib/movementPatterns";

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onRemove: () => void;
  allExercises?: WorkoutExercise[];
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

function parsePercentageHint(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/@\s*(\d+(?:\.\d+)?)%\s*TM/);
  return match ? match[1] : null;
}

export function ExerciseCard({ exercise, onRemove, allExercises = [], onMoveUp, onMoveDown, canMoveUp = false, canMoveDown = false }: ExerciseCardProps) {
  const { addSet, removeSet, updateSet, completeSet, loadLastSession, getLastSessionSets, preferredUnit, linkSuperset, unlinkSuperset, replaceExercise } = useWorkoutStore();
  const [previousSets, setPreviousSets] = useState<{ weight: number; reps: number }[]>([]);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isTimed, setIsTimed] = useState(false);
  const isBW = isBodyweightExercise(exercise.exercise_name);
  const [showVideo, setShowVideo] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showReplaceSearch, setShowReplaceSearch] = useState(false);

  const percentageHint = parsePercentageHint(exercise.notes);
  const isSupersetted = !!exercise.superset_group;

  useEffect(() => {
    let cancelled = false;
    const fetchLibrary = async () => {
      const { data } = await supabase
        .from('exercise_library')
        .select('video_url, is_timed')
        .ilike('name', exercise.exercise_name)
        .maybeSingle();
      if (!cancelled) {
        if (data?.video_url) setVideoUrl(data.video_url);
        setIsTimed(isTimedExercise(exercise.exercise_name, (data as any)?.is_timed));
      }
    };
    fetchLibrary();
    return () => { cancelled = true; };
  }, [exercise.exercise_name]);

  useEffect(() => {
    let cancelled = false;
    const fetchPrevious = async () => {
      const sets = await getLastSessionSets(exercise.exercise_name);
      if (!cancelled) setPreviousSets(sets);
    };
    fetchPrevious();
    return () => { cancelled = true; };
  }, [exercise.exercise_name, getLastSessionSets]);

  const handleLoadLastSession = async () => {
    setIsLoadingPrevious(true);
    await loadLastSession(exercise.id, exercise.exercise_name);
    setIsLoadingPrevious(false);
  };

  const handleCompleteSet = async (setId: string, weight: number, reps: number, rir?: number | null) => {
    await completeSet(setId, exercise.exercise_name, weight, reps, rir);
  };

  const completedWorkingSets = exercise.sets?.filter(s => s.is_completed && s.set_type !== 'warmup').length || 0;
  const totalWorkingSets = exercise.sets?.filter(s => s.set_type !== 'warmup').length || 0;

  // Exercises available for superset linking (not this one, not already in same group)
  const linkableExercises = allExercises.filter(e => 
    e.id !== exercise.id && 
    (!exercise.superset_group || e.superset_group !== exercise.superset_group)
  );

  return (
    <Card variant="elevated" className={cn(
      "overflow-hidden",
      isSupersetted && "border-l-4 border-l-primary"
    )}>
      <CardHeader className="py-3 px-4 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base uppercase tracking-wide">
                {exercise.exercise_name}
              </h3>
              {isSupersetted && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30">
                  SS
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">
                {completedWorkingSets}/{totalWorkingSets} sets completed
              </p>
              {percentageHint && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5 h-4">
                  <Percent className="w-2.5 h-2.5" />
                  {percentageHint}% TM
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5">
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
            {videoUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={() => setShowVideo(!showVideo)}
              >
                {showVideo ? <ChevronUp className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}
          
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
              
              {/* Superset options */}
              {linkableExercises.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Link className="h-4 w-4 mr-2" />
                    Link Superset
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {linkableExercises.map(e => (
                      <DropdownMenuItem
                        key={e.id}
                        onClick={() => linkSuperset(exercise.id, e.id)}
                      >
                        {e.exercise_name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {isSupersetted && (
                <DropdownMenuItem onClick={() => unlinkSuperset(exercise.id)}>
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink Superset
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => setShowReplaceSearch(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Replace Exercise
              </DropdownMenuItem>
              <AdminExerciseMenu exerciseName={exercise.exercise_name} />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRemove} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Exercise
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Collapsible Video Embed */}
      {videoUrl && showVideo && (
        <div className="px-4 pb-2">
          <AspectRatio ratio={16 / 9} className="rounded-md overflow-hidden bg-secondary">
            <iframe
              src={toEmbedUrl(videoUrl)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          </AspectRatio>
        </div>
      )}
      
      <CardContent className="p-0">
        {/* Header Row */}
        <div className="grid grid-cols-[28px_1fr_1fr_1fr_44px_36px_24px] gap-1 sm:gap-1.5 items-center py-2 px-4 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
          <span className="text-center">Set</span>
          <span className="text-center">Prev</span>
          <span className="text-center">{isBW ? '+Load' : (preferredUnit === 'kg' ? 'Kg' : 'Lbs')}</span>
          <span className="text-center">{isTimed ? 'Sec' : 'Reps'}</span>
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
              isTimed={isTimed}
              isBodyweight={isBW}
            />
          ))}
        </div>
        
        {/* Add Set Row */}
        <div className="p-3 border-t border-border/50 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addSet(exercise.id, 'working')}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => addSet(exercise.id, 'warmup')}
            className="text-muted-foreground text-xs"
          >
            + Warmup
          </Button>
        </div>

        {/* Superset Row — always visible when linkable exercises exist */}
        {linkableExercises.length > 0 && !isSupersetted && (
          <div className="px-3 pb-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-primary/40 text-primary hover:bg-primary/10 gap-2"
                >
                  <Link className="h-4 w-4" />
                  Link as Superset
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Pair with:</div>
                {linkableExercises.map(e => (
                  <DropdownMenuItem
                    key={e.id}
                    onClick={() => linkSuperset(exercise.id, e.id)}
                    className="font-medium"
                  >
                    {e.exercise_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {isSupersetted && (
          <div className="px-3 pb-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => unlinkSuperset(exercise.id)}
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
            >
              <Unlink className="h-4 w-4" />
              Unlink Superset
            </Button>
          </div>
        )}
      </CardContent>

      {/* Replace Exercise Search */}
      <ExerciseSearch
        open={showReplaceSearch}
        onOpenChange={setShowReplaceSearch}
        onSelectExercise={(name) => replaceExercise(exercise.id, name)}
        mode="replace"
      />
    </Card>
  );
}
