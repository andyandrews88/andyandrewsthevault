import { useState } from "react";
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
import { Dumbbell } from "lucide-react";
import { format } from "date-fns";

interface AdminWorkoutBuilderProps {
  userId: string;
  displayName: string;
  onWorkoutSaved?: () => void;
}

export function AdminWorkoutBuilder({ userId, displayName }: AdminWorkoutBuilderProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), "yyyy-MM-dd"));

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
