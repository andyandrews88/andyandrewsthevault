import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { useGoalStore } from "@/stores/goalStore";
import { toast } from "@/hooks/use-toast";
import { format, addWeeks } from "date-fns";
import { STRENGTH_EXERCISES, CONDITIONING_EXERCISES } from "@/types/workout";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function GoalForm() {
  const { addGoal } = useGoalStore();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercisePopoverOpen, setExercisePopoverOpen] = useState(false);

  const [goalType, setGoalType] = useState<"strength" | "body_weight" | "conditioning">("strength");
  const [title, setTitle] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [startValue, setStartValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [targetDate, setTargetDate] = useState(format(addWeeks(new Date(), 12), "yyyy-MM-dd"));

  const exerciseList = useMemo(() => {
    if (goalType === "strength") return [...STRENGTH_EXERCISES].sort();
    if (goalType === "conditioning") return [...CONDITIONING_EXERCISES].sort();
    return [];
  }, [goalType]);

  const resetForm = () => {
    setGoalType("strength");
    setTitle("");
    setExerciseName("");
    setTargetValue("");
    setStartValue("");
    setUnit("kg");
    setTargetDate(format(addWeeks(new Date(), 12), "yyyy-MM-dd"));
  };

  const handleExerciseSelect = async (exercise: string) => {
    setExerciseName(exercise);
    setExercisePopoverOpen(false);

    // Auto-populate start value from latest PR
    if (goalType === "strength") {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pr } = await supabase
        .from("personal_records")
        .select("max_weight")
        .eq("user_id", user.id)
        .eq("exercise_name", exercise.toLowerCase())
        .maybeSingle();

      if (pr) {
        setStartValue(String(pr.max_weight));
        if (!title) setTitle(`${exercise} ${targetValue || "?"}${unit}`);
      }
    }
  };

  const handleGoalTypeChange = async (type: "strength" | "body_weight" | "conditioning") => {
    setGoalType(type);
    setExerciseName("");
    setStartValue("");

    if (type === "body_weight") {
      setUnit("kg");
      // Auto-populate from latest body entry
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: entry } = await supabase
        .from("user_body_entries")
        .select("weight_kg")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (entry?.weight_kg) {
        setStartValue(String(entry.weight_kg));
      }
    } else if (type === "conditioning") {
      setUnit("seconds");
    } else {
      setUnit("kg");
    }
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
            <Select value={goalType} onValueChange={(v: any) => handleGoalTypeChange(v)}>
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

          {/* Exercise picker (strength/conditioning) */}
          {goalType !== "body_weight" && (
            <div className="space-y-2">
              <Label>Exercise</Label>
              <Popover open={exercisePopoverOpen} onOpenChange={setExercisePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={exercisePopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {exerciseName || "Select exercise..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search exercises..." />
                    <CommandList className="max-h-[200px]">
                      <CommandEmpty>No exercise found.</CommandEmpty>
                      <CommandGroup>
                        {exerciseList.map((ex) => (
                          <CommandItem
                            key={ex}
                            value={ex}
                            onSelect={() => handleExerciseSelect(ex)}
                          >
                            <Check className={cn("mr-2 h-4 w-4", exerciseName === ex ? "opacity-100" : "opacity-0")} />
                            {ex}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
