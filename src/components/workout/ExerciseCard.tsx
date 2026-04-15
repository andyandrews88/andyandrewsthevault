import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Plus, MoreVertical, History, Trash2, Percent, Play, ChevronUp, ChevronDown, Link, Unlink, ArrowUp, ArrowDown, RefreshCw, ChevronsUpDown } from "lucide-react";
import { WorkoutExercise } from "@/types/workout";
import { SetRow } from "./SetRow";
import { ExerciseSearch } from "./ExerciseSearch";
import { ExerciseActionSheet } from "./ExerciseActionSheet";
import { useWorkoutStore } from "@/stores/workoutStore";
import { supabase } from "@/integrations/supabase/client";
import { toEmbedUrl } from "@/lib/vaultService";
import { cn } from "@/lib/utils";
import { AdminExerciseMenu } from "./AdminExerciseMenu";
import { isTimedExercise, isBodyweightExercise, isUnilateralExercise, isPlyometricExercise, getPlyoMetric, type PlyoMetric } from "@/lib/movementPatterns";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";

export interface ExerciseLibraryMeta {
  video_url: string | null;
  is_timed: boolean;
  is_unilateral: boolean;
  is_plyometric: boolean;
  plyo_metric: string | null;
}

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onRemove: () => void;
  allExercises?: WorkoutExercise[];
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  libraryMeta?: ExerciseLibraryMeta | null;
}

function parsePercentageHint(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/@\s*(\d+(?:\.\d+)?)%\s*TM/);
  return match ? match[1] : null;
}

function SupersetLinkButton({ exercise, linkableExercises, linkSuperset }: { exercise: WorkoutExercise; linkableExercises: WorkoutExercise[]; linkSuperset: (a: string, b: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-3 pb-3">
      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title="Pair with exercise"
        trigger={
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-primary/40 text-primary hover:bg-primary/10 gap-2"
          >
            <Link className="h-4 w-4" />
            Link as Superset
          </Button>
        }
        popoverAlign="center"
        popoverClassName="w-56"
      >
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Pair with:</p>
          {linkableExercises.map(e => (
            <Button
              key={e.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start font-medium"
              onClick={() => { linkSuperset(exercise.id, e.id); setOpen(false); }}
            >
              {e.exercise_name}
            </Button>
          ))}
        </div>
      </ResponsiveSheet>
    </div>
  );
}

export const ExerciseCard = React.memo(function ExerciseCard({ exercise, onRemove, allExercises = [], onMoveUp, onMoveDown, canMoveUp = false, canMoveDown = false, libraryMeta }: ExerciseCardProps) {
  const { addSet, removeSet, updateSet, completeSet, loadLastSession, getLastSessionSets, preferredUnit, linkSuperset, unlinkSuperset, replaceExercise } = useWorkoutStore();
  const { isAdmin } = useAdminCheck();
  const isMobile = useIsMobile();
  const [previousSets, setPreviousSets] = useState<{ weight: number; reps: number }[]>([]);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isTimed, setIsTimed] = useState(false);
  const [isUnilateral, setIsUnilateral] = useState(false);
  const [isPlyometric, setIsPlyometric] = useState(false);
  const [plyoMetric, setPlyoMetric] = useState<PlyoMetric>('standard');
  const isBW = isBodyweightExercise(exercise.exercise_name);
  const metadataManuallySet = useRef(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showReplaceSearch, setShowReplaceSearch] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Auto-collapse when all sets completed
  const allSetsCompleted = useMemo(() => {
    const sets = exercise.sets || [];
    return sets.length > 0 && sets.every(s => s.is_completed);
  }, [exercise.sets]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  useEffect(() => {
    if (allSetsCompleted) setIsCollapsed(true);
  }, [allSetsCompleted]);

  const percentageHint = parsePercentageHint(exercise.notes);
  const isSupersetted = !!exercise.superset_group;

  useEffect(() => {
    // Skip DB fetch if metadata was just set locally (prevents overwriting optimistic state)
    if (metadataManuallySet.current) {
      metadataManuallySet.current = false;
      return;
    }
    // If parent provided batch-fetched metadata, use it directly
    if (libraryMeta !== undefined) {
      if (libraryMeta) {
        if (libraryMeta.video_url) setVideoUrl(libraryMeta.video_url);
        setIsTimed(isTimedExercise(exercise.exercise_name, libraryMeta.is_timed));
        setIsUnilateral(isUnilateralExercise(exercise.exercise_name, libraryMeta.is_unilateral));
        setIsPlyometric(isPlyometricExercise(exercise.exercise_name, libraryMeta.is_plyometric));
        setPlyoMetric(getPlyoMetric(libraryMeta.plyo_metric));
      }
      return;
    }
    let cancelled = false;
    const fetchLibrary = async () => {
      const { data } = await supabase
        .from('exercise_library')
        .select('video_url, is_timed, is_unilateral, is_plyometric, plyo_metric')
        .ilike('name', exercise.exercise_name)
        .maybeSingle();
      if (!cancelled) {
        if (data?.video_url) setVideoUrl(data.video_url);
        setIsTimed(isTimedExercise(exercise.exercise_name, (data as any)?.is_timed));
        setIsUnilateral(isUnilateralExercise(exercise.exercise_name, (data as any)?.is_unilateral));
        setIsPlyometric(isPlyometricExercise(exercise.exercise_name, (data as any)?.is_plyometric));
        setPlyoMetric(getPlyoMetric((data as any)?.plyo_metric));
      }
    };
    fetchLibrary();
    return () => { cancelled = true; };
  }, [exercise.exercise_name, libraryMeta]);

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
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
    <Card variant="elevated" className={cn(
      "overflow-hidden",
      isSupersetted && "border-l-4 border-l-primary"
    )}>
      <CardHeader className="py-3 px-3 bg-secondary/30 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide">
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
          
            {/* Mobile: action sheet, Desktop: dropdown */}
            {isMobile ? (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowActionSheet(true)}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
                <ExerciseActionSheet
                  open={showActionSheet}
                  onOpenChange={setShowActionSheet}
                  exercise={exercise}
                  isAdmin={isAdmin}
                  isSupersetted={isSupersetted}
                  linkableExercises={linkableExercises}
                  onLoadLastSession={handleLoadLastSession}
                  isLoadingPrevious={isLoadingPrevious}
                  onLinkSuperset={(targetId) => linkSuperset(exercise.id, targetId)}
                  onUnlinkSuperset={() => unlinkSuperset(exercise.id)}
                  onReplace={() => setShowReplaceSearch(true)}
                  onRemove={onRemove}
                   onMetadataChange={(field, value) => {
                    metadataManuallySet.current = true;
                    if (field === 'isTimed') setIsTimed(value);
                    if (field === 'isUnilateral') setIsUnilateral(value);
                    if (field === 'videoUrl') setVideoUrl(value);
                    if (field === 'isPlyometric') setIsPlyometric(value);
                    if (field === 'plyoMetric') setPlyoMetric(value);
                  }}
                />
              </>
            ) : (
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
                  {linkableExercises.length > 0 && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Link className="h-4 w-4 mr-2" />
                        Link Superset
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {linkableExercises.map(e => (
                          <DropdownMenuItem key={e.id} onClick={() => linkSuperset(exercise.id, e.id)}>
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
                  <AdminExerciseMenu exerciseName={exercise.exercise_name} isAdmin={isAdmin} onMetadataChange={(field, value) => {
                    metadataManuallySet.current = true;
                    if (field === 'isTimed') setIsTimed(value);
                    if (field === 'isUnilateral') setIsUnilateral(value);
                    if (field === 'videoUrl') setVideoUrl(value);
                    if (field === 'isPlyometric') setIsPlyometric(value);
                    if (field === 'plyoMetric') setPlyoMetric(value);
                  }} />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onRemove} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Exercise
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsCollapsed(!isCollapsed)}>
            <ChevronsUpDown className={`h-4 w-4 text-muted-foreground transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
          </Button>
          </div>
        </div>
      </CardHeader>

      <CollapsibleContent>
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
        {isPlyometric && plyoMetric !== 'standard' ? (
          <div className="grid grid-cols-[28px_1fr_1fr_1fr_36px_24px] gap-1 sm:gap-1.5 items-center py-2 px-4 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
            <span className="text-center">Set</span>
            <span className="text-center">Reps</span>
            <span className="text-center">
              {plyoMetric === 'height' ? 'Ht (cm)' : plyoMetric === 'distance' ? 'Dist (m)' : 'Speed (m/s)'}
            </span>
            <span className="text-center">RIR</span>
            <span className="text-center">✓</span>
            <span></span>
          </div>
        ) : (
          <div className="grid grid-cols-[28px_1fr_1fr_1fr_44px_36px_24px] gap-1 sm:gap-1.5 items-center py-2 px-4 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
            <span className="text-center">Set</span>
            <span className="text-center">Prev</span>
            <span className="text-center">{isBW ? '+Load' : (preferredUnit === 'kg' ? 'Kg' : 'Lbs')}</span>
            <span className="text-center">{isTimed ? 'Sec' : 'Reps'}</span>
            <span className="text-center">RIR</span>
            <span className="text-center">✓</span>
            <span></span>
          </div>
        )}
        
        {/* Sets */}
        <div className="px-4">
          {exercise.sets?.map((set, index) => {
            const prevIndex = isUnilateral
              ? exercise.sets!.filter(s => s.side === set.side).indexOf(set)
              : index;
            return (
              <SetRow
                key={set.id}
                set={set}
                previousData={previousSets[prevIndex] || null}
                onUpdate={(data) => updateSet(set.id, data)}
                onComplete={(weight, reps, rir) => { handleCompleteSet(set.id, weight, reps, rir); }}
                onRemove={() => removeSet(set.id)}
                isTimed={isTimed}
                isBodyweight={isBW}
                isPlyometric={isPlyometric}
                plyoMetric={plyoMetric}
                side={set.side}
              />
            );
          })}
        </div>
        
        {/* Add Set Row */}
        <div className="p-3 border-t border-border/50 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addSet(exercise.id, 'working', isUnilateral)}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => addSet(exercise.id, 'warmup', isUnilateral)}
            className="text-muted-foreground text-xs"
          >
            + Warmup
          </Button>
        </div>

        {/* Superset Row */}
        {linkableExercises.length > 0 && !isSupersetted && (
          <SupersetLinkButton exercise={exercise} linkableExercises={linkableExercises} linkSuperset={linkSuperset} />
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
      </CollapsibleContent>

      {/* Replace Exercise Search */}
      <ExerciseSearch
        open={showReplaceSearch}
        onOpenChange={setShowReplaceSearch}
        onSelectExercise={(name) => replaceExercise(exercise.id, name)}
        mode="replace"
      />
    </Card>
    </Collapsible>
  );
});
