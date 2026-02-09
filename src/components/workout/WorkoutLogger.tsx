import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  X, 
  Dumbbell,
  Clock,
  TrendingUp
} from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseSearch } from "./ExerciseSearch";
import { PRCelebration } from "./PRCelebration";
import { format } from "date-fns";

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
    fetchPersonalRecords
  } = useWorkoutStore();
  
  const [isExerciseSearchOpen, setIsExerciseSearchOpen] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [startTime] = useState(new Date());

  useEffect(() => {
    fetchActiveWorkout();
    fetchPersonalRecords();
  }, [fetchActiveWorkout, fetchPersonalRecords]);

  const handleStartWorkout = async () => {
    if (workoutName.trim()) {
      await startWorkout(workoutName.trim());
      setShowStartDialog(false);
      setWorkoutName("");
    }
  };

  const handleFinish = async () => {
    await finishWorkout();
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

  // Calculate elapsed time
  const elapsedMinutes = Math.floor((new Date().getTime() - startTime.getTime()) / 60000);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No active workout - show start screen
  if (!activeWorkout) {
    return (
      <div className="space-y-6">
        <Card variant="elevated" className="text-center py-12">
          <CardContent>
            <Dumbbell className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Ready to Train?</h3>
            <p className="text-muted-foreground mb-6">
              Start a new workout session to log your exercises and track PRs
            </p>
            
            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
              <DialogTrigger asChild>
                <Button variant="hero" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Start Workout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Name Your Workout</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PR Celebration */}
      {newPR && (
        <PRCelebration
          exerciseName={newPR.exerciseName}
          weight={newPR.weight}
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
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onRemove={() => removeExercise(exercise.id)}
          />
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
              <p className="font-bold">{totalVolume.toLocaleString()} lbs</p>
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
