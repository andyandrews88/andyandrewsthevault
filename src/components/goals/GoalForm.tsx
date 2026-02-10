import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useGoalStore } from "@/stores/goalStore";
import { toast } from "@/hooks/use-toast";
import { format, addWeeks } from "date-fns";

export function GoalForm() {
  const { addGoal } = useGoalStore();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [goalType, setGoalType] = useState<"strength" | "body_weight" | "conditioning">("strength");
  const [title, setTitle] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [startValue, setStartValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [targetDate, setTargetDate] = useState(format(addWeeks(new Date(), 12), "yyyy-MM-dd"));

  const resetForm = () => {
    setGoalType("strength");
    setTitle("");
    setExerciseName("");
    setTargetValue("");
    setStartValue("");
    setUnit("kg");
    setTargetDate(format(addWeeks(new Date(), 12), "yyyy-MM-dd"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetValue || !startValue) {
      toast({ title: "Missing fields", description: "Fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const sv = parseFloat(startValue);
      const tv = parseFloat(targetValue);

      await addGoal({
        goal_type: goalType,
        title,
        exercise_name: goalType !== "body_weight" ? exerciseName || null : null,
        target_value: tv,
        start_value: sv,
        current_value: sv,
        target_date: targetDate,
        unit,
      });

      toast({ title: "Goal created", description: `"${title}" has been added.` });
      resetForm();
      setOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to create goal.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set a New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal type */}
          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select value={goalType} onValueChange={(v: any) => setGoalType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength (PR Target)</SelectItem>
                <SelectItem value="body_weight">Body Weight</SelectItem>
                <SelectItem value="conditioning">Conditioning (Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder='e.g. "Squat 150kg" or "Lose 5kg"' value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Exercise name (strength/conditioning) */}
          {goalType !== "body_weight" && (
            <div className="space-y-2">
              <Label>Exercise Name</Label>
              <Input placeholder="e.g. Squat, Bench Press, Running (Outdoor)" value={exerciseName} onChange={e => setExerciseName(e.target.value)} />
            </div>
          )}

          {/* Start & Target values */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Current Value</Label>
              <Input type="number" step="any" placeholder="0" value={startValue} onChange={e => setStartValue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Target Value</Label>
              <Input type="number" step="any" placeholder="0" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
            </div>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="lbs">lbs</SelectItem>
                <SelectItem value="seconds">seconds</SelectItem>
                <SelectItem value="minutes">minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target date */}
          <div className="space-y-2">
            <Label>Target Date</Label>
            <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Goal
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
