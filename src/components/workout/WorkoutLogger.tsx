import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Dumbbell,
  Clock,
  TrendingUp,
  FileText,
  Timer,
  ChevronDown,
  Flame,
  Snowflake,
} from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { ExerciseCard, ExerciseLibraryMeta } from "./ExerciseCard";
import { ConditioningCard } from "./ConditioningCard";
import { ExerciseSearch } from "./ExerciseSearch";
import { PRCelebration } from "./PRCelebration";
import { WeekStrip } from "./WeekStrip";
import { WorkoutCalendar } from "./WorkoutCalendar";
import { WorkoutHistoryView } from "./WorkoutHistoryView";
import { DailyProgramWorkout } from "@/components/tracks/DailyProgramWorkout";
import { RestTimer } from "./RestTimer";
import { supabase } from "@/integrations/supabase/client";
import { UserCalendarWorkout } from "@/stores/programStore";
import { format } from "date-fns";
import { convertWeight } from "@/lib/weightConversion";
import { BodyweightBanner } from "./BodyweightBanner";
import { classifyExercise, PATTERN_COLORS, MOVEMENT_PATTERN_SHORT, type MovementPattern } from "@/lib/movementPatterns";
import { WorkoutExercise } from "@/types/workout";


interface WorkoutLoggerProps {
  onBack: () => void;
}

type WorkoutSection = 'warmup' | 'main' | 'cooldown';

const SECTION_CONFIG: Record<WorkoutSection, { label: string; icon: React.ReactNode; defaultOpen: boolean }> = {
  warmup: { label: 'WARM UP', icon: <Flame className="h-4 w-4" />, defaultOpen: true },
  main: { label: 'EXERCISES', icon: <Dumbbell className="h-4 w-4" />, defaultOpen: true },
  cooldown: { label: 'COOL DOWN', icon: <Snowflake className="h-4 w-4" />, defaultOpen: true },
};

export function WorkoutLogger({ onBack }: WorkoutLoggerProps) {
  const { 
    activeWorkout, 
    exercises, 
    isLoading,
    isSaving,
    newPR,
    clearNewPR,
    startWorkout, 
    addExercise,
    removeExercise,
    moveExercise,
    finishWorkout,
    cancelWorkout,
    fetchActiveWorkout,
    fetchPersonalRecords,
    selectedDate,
    setSelectedDate,
    viewingWorkout,
    viewingExercises,
    workoutDays,
    fetchWorkoutDays,
    fetchWorkoutByDate,
    preferredUnit,
    isEditing,
    updateWorkoutNotes,
    restTimerTrigger
  } = useWorkoutStore();
  
  const [isExerciseSearchOpen, setIsExerciseSearchOpen] = useState(false);
  const [exerciseSearchSection, setExerciseSearchSection] = useState<WorkoutSection>('main');
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [startTime] = useState(new Date());
  const [programWorkoutsForDate, setProgramWorkoutsForDate] = useState<UserCalendarWorkout[]>([]);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [sectionOpen, setSectionOpen] = useState<Record<WorkoutSection, boolean>>({ warmup: true, main: true, cooldown: true });
  const [libraryMetaMap, setLibraryMetaMap] = useState<Record<string, ExerciseLibraryMeta>>({});

  const fetchProgramWorkoutsForDate = async (date: Date) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const user = session.user;
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data } = await supabase
      .from('user_calendar_workouts')
      .select(`
        *,
        program_workout:program_workouts(*),
        enrollment:user_program_enrollments(*, program:programs(*))
      `)
      .eq('scheduled_date', dateStr)
      .eq('user_id', user.id);
    setProgramWorkoutsForDate((data as unknown as UserCalendarWorkout[]) || []);
  };

  useEffect(() => {
    fetchActiveWorkout();
    fetchPersonalRecords();
    fetchWorkoutDays(12);
  }, [fetchActiveWorkout, fetchPersonalRecords, fetchWorkoutDays]);

  // Batch-fetch exercise library metadata for all exercises in the active workout
  useEffect(() => {
    if (!exercises.length) return;
    const names = [...new Set(exercises.map(e => e.exercise_name))];
    // Only fetch names not already cached
    const missing = names.filter(n => !libraryMetaMap[n.toLowerCase()]);
    if (!missing.length) return;
    const fetchMeta = async () => {
      const { data } = await supabase
        .from('exercise_library')
        .select('name, video_url, is_timed, is_unilateral, is_plyometric, plyo_metric')
        .in('name', missing);
      if (data) {
        const map: Record<string, ExerciseLibraryMeta> = { ...libraryMetaMap };
        data.forEach(d => {
          map[d.name.toLowerCase()] = {
            video_url: d.video_url,
            is_timed: d.is_timed,
            is_unilateral: d.is_unilateral,
            is_plyometric: d.is_plyometric,
            plyo_metric: d.plyo_metric,
          };
        });
        // Mark missing names with no DB entry as null-resolved
        missing.forEach(n => { if (!map[n.toLowerCase()]) map[n.toLowerCase()] = { video_url: null, is_timed: false, is_unilateral: false, is_plyometric: false, plyo_metric: null }; });
        setLibraryMetaMap(map);
      }
    };
    fetchMeta();
  }, [exercises.map(e => e.exercise_name).join(',')]);

  useEffect(() => {
    fetchWorkoutByDate(selectedDate);
    fetchProgramWorkoutsForDate(selectedDate);
  }, [selectedDate, fetchWorkoutByDate]);

  const handleStartWorkout = async () => {
    const name = workoutName.trim() || `Workout — ${format(selectedDate, 'MMM d')}`;
    await startWorkout(name, selectedDate);
    setShowStartDialog(false);
    setWorkoutName("");
  };

  const handleFinish = async () => {
    const wasEditing = isEditing;
    await finishWorkout();
    
    if (!wasEditing) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      if (programWorkoutsForDate.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase
            .from('user_calendar_workouts')
            .update({ is_completed: true, completed_at: new Date().toISOString() })
            .eq('scheduled_date', dateStr)
            .eq('user_id', session.user.id)
            .eq('is_completed', false);
        }
      }
      fetchProgramWorkoutsForDate(selectedDate);
      onBack();
    }
    fetchWorkoutDays(12);
  };

  const handleCancel = async () => {
    await cancelWorkout();
    setShowCancelDialog(false);
  };

  const handleAddExercise = useCallback(async (name: string) => {
    await addExercise(name, exerciseSearchSection);
  }, [addExercise, exerciseSearchSection]);

  const openExerciseSearchForSection = useCallback((section: WorkoutSection) => {
    setExerciseSearchSection(section);
    setIsExerciseSearchOpen(true);
  }, []);

  // Calculate total volume (working sets only)
  const totalVolume = exercises.reduce((sum, ex) => {
    const exVolume = ex.sets?.reduce((setSum, set) => {
      if (set.is_completed && set.weight && set.reps && set.set_type !== 'warmup') {
        return setSum + (set.weight * set.reps);
      }
      return setSum;
    }, 0) || 0;
    return sum + exVolume;
  }, 0);

  const displayVolume = preferredUnit === 'kg' 
    ? convertWeight(totalVolume, 'lbs', 'kg') 
    : totalVolume;

  const exercisesBySection = useMemo(() => {
    const sections: Record<WorkoutSection, WorkoutExercise[]> = { warmup: [], main: [], cooldown: [] };
    exercises.forEach(ex => {
      const s = (ex.workout_section || 'main') as WorkoutSection;
      sections[s].push(ex);
    });
    return sections;
  }, [exercises]);

  const elapsedMinutes = Math.floor((new Date().getTime() - startTime.getTime()) / 60000);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isViewingPast = viewingWorkout && format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');

  if (isViewingPast && viewingWorkout) {
    return (
      <div className="space-y-4">
        <WeekStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          workoutDays={workoutDays}
          onMonthClick={() => setShowCalendar(true)}
        />
        <WorkoutHistoryView 
          workout={viewingWorkout} 
          exercises={viewingExercises} 
        />
        <WorkoutCalendar
          open={showCalendar}
          onOpenChange={setShowCalendar}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          workoutDays={workoutDays}
        />
      </div>
    );
  }

  if (!activeWorkout) {
    return (
      <div className="space-y-4">
        <WeekStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          workoutDays={workoutDays}
          onMonthClick={() => setShowCalendar(true)}
        />
        
        {!activeWorkout && programWorkoutsForDate.map(cw => (
          <DailyProgramWorkout
            key={cw.id}
            calendarWorkout={cw}
            programStyle={(cw as any).enrollment?.program?.program_style}
            date={selectedDate}
            onComplete={() => {
              fetchWorkoutDays(12);
              fetchProgramWorkoutsForDate(selectedDate);
            }}
            onStartLogging={() => {
              fetchWorkoutDays(12);
            }}
          />
        ))}

        {viewingWorkout && (
          <WorkoutHistoryView 
            workout={viewingWorkout} 
            exercises={viewingExercises} 
          />
        )}
        
        {!viewingWorkout && (
          <Card variant="elevated" className="text-center py-6">
            <CardContent>
              <Dumbbell className="h-8 w-8 mx-auto mb-3 text-primary opacity-50" />
              <h3 className="text-base font-semibold mb-2">
                {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? programWorkoutsForDate.length > 0 ? "Log Your Own Work" : "Ready to Train?"
                  : `Log a Workout for ${format(selectedDate, 'MMMM d')}`}
              </h3>
              <p className="text-muted-foreground text-xs mb-4">
                {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? programWorkoutsForDate.length > 0
                    ? "Add extra free-log work on top of your program"
                    : "Start a new workout session to log your exercises and track PRs"
                  : "Add a workout retroactively for this date"}
              </p>
              
              <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
                <DialogTrigger asChild>
                  <Button variant={programWorkoutsForDate.length > 0 ? "outline" : "hero"} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Start Workout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Name Your Workout</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Logging for: <span className="font-medium text-foreground">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                    </p>
                    <Input
                      placeholder={`Workout — ${format(selectedDate, 'MMM d')}`}
                      value={workoutName}
                      onChange={(e) => setWorkoutName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartWorkout()}
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                      {["Push Day", "Pull Day", "Leg Day", "Upper Body", "Lower Body", "Full Body"].map(name => (
                        <Button
                          key={name}
                          variant="outline"
                          size="sm"
                          onClick={() => setWorkoutName(name)}
                        >
                          {name}
                        </Button>
                      ))}
                    </div>
                    <Button 
                      onClick={() => {
                        if (!workoutName.trim()) {
                          setWorkoutName(`Workout — ${format(selectedDate, 'MMM d')}`);
                        }
                        handleStartWorkout();
                      }} 
                      className="w-full"
                    >
                      {workoutName.trim() ? "Start Workout" : "Quick Start"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
        
        <WorkoutCalendar
          open={showCalendar}
          onOpenChange={setShowCalendar}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          workoutDays={workoutDays}
        />
      </div>
    );
  }

  // Render exercises for a given section
  const renderExercisesForSection = (sectionExercises: WorkoutExercise[]) => {
    const rendered = new Set<string>();
    const elements: JSX.Element[] = [];
    const sorted = [...sectionExercises].sort((a, b) => a.order_index - b.order_index);

    sorted.forEach((exercise, globalIdx) => {
      if (rendered.has(exercise.id)) return;
      rendered.add(exercise.id);

      const canUp = globalIdx > 0;
      const canDown = globalIdx < sorted.length - 1;
      const moveUp = () => moveExercise(exercise.id, 'up');
      const moveDown = () => moveExercise(exercise.id, 'down');

      if (exercise.superset_group) {
        const group = sorted.filter(e => e.superset_group === exercise.superset_group);
        group.map(e => e.id).forEach(id => rendered.add(id));

        elements.push(
          <div key={`ss-${exercise.superset_group}`} className="space-y-0">
            <div className="text-xs font-medium text-primary uppercase tracking-wider px-1 mb-1">
              ⚡ Superset
            </div>
            {group.map((ex) => {
              const gIdx = sorted.indexOf(ex);
              return ex.exercise_type === 'conditioning' ? (
                <ConditioningCard
                  key={ex.id}
                  exercise={ex}
                  onRemove={() => removeExercise(ex.id)}
                  onMoveUp={() => moveExercise(ex.id, 'up')}
                  onMoveDown={() => moveExercise(ex.id, 'down')}
                  canMoveUp={gIdx > 0}
                  canMoveDown={gIdx < sorted.length - 1}
                />
              ) : (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onRemove={() => removeExercise(ex.id)}
                  allExercises={exercises}
                  onMoveUp={() => moveExercise(ex.id, 'up')}
                  onMoveDown={() => moveExercise(ex.id, 'down')}
                  canMoveUp={gIdx > 0}
                  canMoveDown={gIdx < sorted.length - 1}
                  libraryMeta={libraryMetaMap[ex.exercise_name.toLowerCase()] ?? undefined}
                />
              );
            })}
          </div>
        );
      } else {
        elements.push(
          exercise.exercise_type === 'conditioning' ? (
            <ConditioningCard
              key={exercise.id}
              exercise={exercise}
              onRemove={() => removeExercise(exercise.id)}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              canMoveUp={canUp}
              canMoveDown={canDown}
            />
          ) : (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onRemove={() => removeExercise(exercise.id)}
              allExercises={exercises}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              canMoveUp={canUp}
              canMoveDown={canDown}
              libraryMeta={libraryMetaMap[exercise.exercise_name.toLowerCase()] ?? undefined}
            />
          )
        );
      }
    });

    return elements;
  };

  // exercisesBySection moved to before early returns

  return (
    <div className="space-y-4">
      {/* PR Celebration */}
      {newPR && (
        <PRCelebration
          exerciseName={newPR.exerciseName}
          weight={preferredUnit === 'kg' ? convertWeight(newPR.weight, 'lbs', 'kg') : newPR.weight}
          unit={preferredUnit}
          onComplete={clearNewPR}
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="icon" onClick={() => setShowCancelDialog(true)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 text-center">
          <h2 className="font-semibold">{activeWorkout.workout_name}</h2>
          <p className="text-xs text-muted-foreground">
            {format(new Date(activeWorkout.date), 'EEEE, MMMM d')}
          </p>
        </div>
        
        <Button 
          variant="hero" 
          size="sm" 
          onClick={handleFinish}
          disabled={isSaving || exercises.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          Finish
        </Button>
      </div>
      
      {/* Section-grouped Exercise Cards */}
      {(['warmup', 'main', 'cooldown'] as WorkoutSection[]).map(section => {
        const config = SECTION_CONFIG[section];
        const sectionExercises = exercisesBySection[section];
        const isOpen = sectionOpen[section];
        
        return (
          <Collapsible
            key={section}
            open={isOpen}
            onOpenChange={(open) => setSectionOpen(prev => ({ ...prev, [section]: open }))}
          >
            <div className="flex items-center justify-between py-2">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                  {config.icon}
                  {config.label}
                  {sectionExercises.length > 0 && (
                    <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                      {sectionExercises.length}
                    </span>
                  )}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                </button>
              </CollapsibleTrigger>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary"
                onClick={() => openExerciseSearchForSection(section)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
            <CollapsibleContent>
              <div className="space-y-3">
                {renderExercisesForSection(sectionExercises)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      
      {/* Bodyweight Banner */}
      <BodyweightBanner />

      {/* Session Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Session Notes
        </label>
        <Textarea
          value={activeWorkout.notes || ""}
          onChange={(e) => updateWorkoutNotes(e.target.value)}
          placeholder="How did training feel today? Any notes for your coach..."
          className="min-h-[60px] resize-none text-sm"
        />
      </div>
      
      {/* Session Stats Footer */}
      <Card variant="data" className="mt-4">
        <CardContent className="py-3 space-y-2">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Volume</span>
              </div>
              <p className="font-bold">{displayVolume.toLocaleString()} {preferredUnit}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Duration</span>
              </div>
              <p className="font-bold">{elapsedMinutes} min</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Dumbbell className="h-4 w-4" />
                <span className="text-xs">Exercises</span>
              </div>
              <p className="font-bold">{exercises.length}</p>
            </div>
          </div>
          {/* Pattern dots */}
          {(() => {
            const hitPatterns = new Map<MovementPattern, number>();
            exercises.forEach(ex => {
              if (ex.exercise_type === 'conditioning') return;
              const p = classifyExercise(ex.exercise_name);
              hitPatterns.set(p, (hitPatterns.get(p) || 0) + 1);
            });
            if (hitPatterns.size === 0) return null;
            return (
              <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-border">
                {Array.from(hitPatterns.entries()).map(([p, count]) => (
                  <div key={p} className="flex items-center gap-0.5" title={`${MOVEMENT_PATTERN_SHORT[p]}: ${count} exercise${count > 1 ? 's' : ''}`}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PATTERN_COLORS[p] }} />
                    <span className="text-[10px] text-muted-foreground font-mono">{MOVEMENT_PATTERN_SHORT[p]}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Rest Timer Button — prominent at bottom */}
      <Button
        variant="outline"
        size="lg"
        className="w-full border-primary/40 text-primary hover:bg-primary/10 gap-2 h-12 text-base font-semibold"
        onClick={() => setShowRestTimer(true)}
      >
        <Timer className="h-5 w-5" />
        Rest Timer
      </Button>

      {/* Rest Timer */}
      <RestTimer 
        trigger={restTimerTrigger} 
        manualOpen={showRestTimer}
        onManualClose={() => setShowRestTimer(false)}
      />
      
      {/* Exercise Search Dialog */}
      <ExerciseSearch
        open={isExerciseSearchOpen}
        onOpenChange={setIsExerciseSearchOpen}
        onSelectExercise={handleAddExercise}
      />
      
      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditing
                ? "This will discard your changes and restore the workout to its previous state."
                : "This will delete all exercises and sets from this session. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Workout</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
              Cancel Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
