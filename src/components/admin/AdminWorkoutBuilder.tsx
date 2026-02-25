import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Dumbbell, Copy, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface AdminWorkoutBuilderProps {
  userId: string;
  displayName: string;
  onWorkoutSaved?: () => void;
}

interface PastWorkout {
  id: string;
  workout_name: string;
  date: string;
}

export function AdminWorkoutBuilder({ userId, displayName }: AdminWorkoutBuilderProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showCloneList, setShowCloneList] = useState(false);
  const [pastWorkouts, setPastWorkouts] = useState<PastWorkout[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);

  // Fetch past workouts when clone list is shown
  useEffect(() => {
    if (!showCloneList || pastWorkouts.length > 0) return;
    const fetchPast = async () => {
      setLoadingPast(true);
      try {
        const { data, error } = await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "get_user_workouts", userId, limit: 10 },
        });
        if (error) throw error;
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setPastWorkouts(parsed || []);
      } catch {
        setPastWorkouts([]);
      } finally {
        setLoadingPast(false);
      }
    };
    fetchPast();
  }, [showCloneList, userId]);

  const handleStart = () => {
    if (!workoutName.trim()) return;
    const params = new URLSearchParams({
      name: workoutName.trim(),
      date: workoutDate,
      client: displayName,
    });
    navigate(`/admin/user/${userId}/build-workout?${params.toString()}`);
    setOpen(false);
    setWorkoutName("");
  };

  const handleClone = (workout: PastWorkout) => {
    const params = new URLSearchParams({
      name: workout.workout_name,
      date: workoutDate,
      client: displayName,
      cloneFrom: workout.id,
    });
    navigate(`/admin/user/${userId}/build-workout?${params.toString()}`);
    setOpen(false);
    setWorkoutName("");
    setShowCloneList(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setShowCloneList(false);
      setPastWorkouts([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="hero" className="gap-2">
          <Dumbbell className="h-4 w-4" />
          Build Workout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Build Workout for {displayName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!showCloneList ? (
            <>
              <Input
                placeholder="Workout name (e.g. Upper Body A)"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {["Push Day", "Pull Day", "Leg Day", "Upper Body", "Lower Body", "Full Body"].map(
                  (name) => (
                    <Button key={name} variant="outline" size="sm" onClick={() => setWorkoutName(name)}>
                      {name}
                    </Button>
                  )
                )}
              </div>
              <Input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
              />
              <Button onClick={handleStart} disabled={!workoutName.trim()} className="w-full">
                Start Building
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowCloneList(true)}
              >
                <Copy className="h-4 w-4" />
                Clone Previous Workout
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Select a past workout to clone as a template:
              </p>
              <Input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
              />
              {loadingPast ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : pastWorkouts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No completed workouts found
                </p>
              ) : (
                <div className="space-y-1 max-h-[240px] overflow-y-auto">
                  {pastWorkouts.map((w) => (
                    <Button
                      key={w.id}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto py-3 px-3"
                      onClick={() => handleClone(w)}
                    >
                      <Dumbbell className="h-4 w-4 text-primary shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium truncate">{w.workout_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(w.date + "T12:00:00"), "MMM d, yyyy")}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => setShowCloneList(false)}>
                ← Back
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
