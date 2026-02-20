import { useState, useEffect } from "react";
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
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Dumbbell,
  Clock,
  TrendingUp
} from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { ExerciseCard } from "./ExerciseCard";
import { ConditioningCard } from "./ConditioningCard";
import { ExerciseSearch } from "./ExerciseSearch";
import { PRCelebration } from "./PRCelebration";
import { WeekStrip } from "./WeekStrip";
import { WorkoutCalendar } from "./WorkoutCalendar";
import { WorkoutHistoryView } from "./WorkoutHistoryView";
import { DailyProgramWorkout } from "@/components/tracks/DailyProgramWorkout";
import { supabase } from "@/integrations/supabase/client";
import { UserCalendarWorkout } from "@/stores/programStore";
import { format } from "date-fns";
import { convertWeight } from "@/lib/weightConversion";


interface WorkoutLoggerProps {
  onBack: () => void;
}

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
    preferredUnit
  } = useWorkoutStore();
  
  const [isExerciseSearchOpen, setIsExerciseSearchOpen] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [startTime] = useState(new Date());
  const [programWorkoutsForDate, setProgramWorkoutsForDate] = useState<UserCalendarWorkout[]>([]);

  const fetchProgramWorkoutsForDate = async (date: Date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
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

  // Initial load — runs once
  useEffect(() => {
    fetchActiveWorkout();
    fetchPersonalRecords();
    fetchWorkoutDays(12);
  }, [fetchActiveWorkout, fetchPersonalRecords, fetchWorkoutDays]);

  // Date-dependent fetches
  useEffect(() => {
    fetchWorkoutByDate(selectedDate);
    fetchProgramWorkoutsForDate(selectedDate);
  }, [selectedDate, fetchWorkoutByDate]);

  const handleStartWorkout = async () => {
    if (workoutName.trim()) {
      await startWorkout(workoutName.trim(), selectedDate);
      setShowStartDialog(false);
      setWorkoutName("");
    }
  };

  const handleFinish = async () => {
    await finishWorkout();
    // Mark any matching calendar workouts as complete so they show "Done"
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (programWorkoutsForDate.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_calendar_workouts')
          .update({ is_completed: true, completed_at: new Date().toISOString() })
          .eq('scheduled_date', dateStr)
          .eq('user_id', user.id)
          .eq('is_completed', false);
      }
    }
    fetchWorkoutDays(12);
    fetchProgramWorkoutsForDate(selectedDate);
    onBack();
  };

  const handleCancel = async () => {
    await cancelWorkout();
    setShowCancelDialog(false);
  };

  const handleAddExercise = async (name: string) => {
    await addExercise(name);
  };

  // Calculate total volume
  const totalVolume = exercises.reduce((sum, ex) => {
    const exVolume = ex.sets?.reduce((setSum, set) => {
      if (set.is_completed && set.weight && set.reps) {
        return setSum + (set.weight * set.reps);
      }
      return setSum;
    }, 0) || 0;
    return sum + exVolume;
  }, 0);

  const displayVolume = preferredUnit === 'kg' 
    ? convertWeight(totalVolume, 'lbs', 'kg') 
    : totalVolume;

  // Calculate elapsed time
  const elapsedMinutes = Math.floor((new Date().getTime() - startTime.getTime()) / 60000);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if viewing a past workout
  const isViewingPast = viewingWorkout && format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');

  // If viewing past workout
  if (isViewingPast && viewingWorkout) {
    return (
      <div className="space-y-4">
        {/* Week Strip Navigation */}
        <WeekStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          workoutDays={workoutDays}
          onMonthClick={() => setShowCalendar(true)}
        />
        
        {/* Past Workout View */}
        <WorkoutHistoryView 
          workout={viewingWorkout} 
          exercises={viewingExercises} 
        />
        
        {/* Calendar Dialog */}
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

  // No active workout - show start screen
  if (!activeWorkout) {
    return (
      <div className="space-y-4">
        {/* Week Strip Navigation */}
        <WeekStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          workoutDays={workoutDays}
          onMonthClick={() => setShowCalendar(true)}
        />
        
        {/* Program workouts for selected date — only show when no active workout */}
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

        {/* Past free-log workout for selected date */}
        {viewingWorkout && (
          <WorkoutHistoryView 
            workout={viewingWorkout} 
            exercises={viewingExercises} 
          />
        )}
        
        {/* Start workout prompt */}
        {!viewingWorkout && (
          <Card variant="elevated" className="text-center py-8">
            <CardContent>
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
              <h3 className="text-xl font-semibold mb-2">
                {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? programWorkoutsForDate.length > 0 ? "Log Your Own Work" : "Ready to Train?"
                  : `Log a Workout for ${format(selectedDate, 'MMMM d')}`}
              </h3>
              <p className="text-muted-foreground mb-6">
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
                      placeholder="e.g., Upper Body A, Leg Day, Push..."
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
                      onClick={handleStartWorkout} 
                      disabled={!workoutName.trim()}
                      className="w-full"
                    >
                      Start Workout
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
        
        {/* Calendar Dialog */}
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
      
      {/* Exercise Cards */}
      <div className="space-y-4">
        {exercises.map(exercise => (
          exercise.exercise_type === 'conditioning' ? (
            <ConditioningCard
              key={exercise.id}
              exercise={exercise}
              onRemove={() => removeExercise(exercise.id)}
            />
          ) : (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onRemove={() => removeExercise(exercise.id)}
            />
          )
        ))}
      </div>
      
      {/* Add Exercise Button */}
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => setIsExerciseSearchOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Exercise
      </Button>
      
      {/* Session Stats Footer */}
      <Card variant="data" className="mt-4">
        <CardContent className="py-3">
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
        </CardContent>
      </Card>
      
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
              This will delete all exercises and sets from this session. This action cannot be undone.
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
