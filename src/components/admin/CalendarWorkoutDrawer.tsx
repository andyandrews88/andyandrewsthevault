import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { WorkoutWithExercises } from "./CalendarWorkoutCard";
import { ExerciseSearch } from "@/components/workout/ExerciseSearch";

interface DrawerExercise {
  id?: string;
  exercise_name: string;
  sets: number;
  reps: string;
  weight: string;
  notes: string;
  isNew?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutWithExercises | null;
  userId: string;
  date: string;
  onSaved: () => void;
}

export function CalendarWorkoutDrawer({ open, onOpenChange, workout, userId, date, onSaved }: Props) {
  const [title, setTitle] = useState("New Workout");
  const [warmup, setWarmup] = useState("");
  const [cooldown, setCooldown] = useState("");
  const [exercises, setExercises] = useState<DrawerExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isEdit = !!workout;

  useEffect(() => {
    if (workout) {
      setTitle(workout.workout_name);
      setWarmup(workout.notes || "");
      setCooldown("");
      setExercises(
        workout.exercises.map((ex) => ({
          id: ex.id,
          exercise_name: ex.exercise_name,
          sets: ex.sets.length || 1,
          reps: ex.sets[0]?.reps?.toString() || "",
          weight: ex.sets[0]?.weight?.toString() || "",
          notes: ex.notes || "",
        }))
      );
    } else {
      setTitle("New Workout");
      setWarmup("");
      setCooldown("");
      setExercises([]);
    }
  }, [workout, open]);

  const addExercise = (name?: string) => {
    setExercises((prev) => [
      ...prev,
      { exercise_name: name || "", sets: 3, reps: "", weight: "", notes: "", isNew: true },
    ]);
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, field: keyof DrawerExercise, value: string | number) => {
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Workout name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let workoutId = workout?.id;

      if (!workoutId) {
        // Create workout
        const { data } = await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "create_workout", userId, workoutName: title, date },
        });
        workoutId = data?.id;
        if (!workoutId) throw new Error("Failed to create workout");
      } else {
        // Update name + notes
        await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "update_workout_name", workoutId, workoutName: title },
        });
      }

      // Update notes
      if (warmup || workout?.notes) {
        await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "update_notes", workoutId, notes: warmup },
        });
      }

      // Remove old exercises that were deleted
      if (workout) {
        const keptIds = exercises.filter((e) => e.id).map((e) => e.id);
        for (const oldEx of workout.exercises) {
          if (!keptIds.includes(oldEx.id)) {
            await supabase.functions.invoke("admin-workout-builder", {
              body: { action: "remove_exercise", exerciseId: oldEx.id },
            });
          }
        }
      }

      // Add new exercises
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        if (ex.isNew || !ex.id) {
          if (!ex.exercise_name.trim()) continue;
          const { data: newEx } = await supabase.functions.invoke("admin-workout-builder", {
            body: {
              action: "add_exercise",
              workoutId,
              exerciseName: ex.exercise_name,
              orderIndex: i,
            },
          });
          // Add additional sets if needed
          if (newEx && ex.sets > 1) {
            for (let s = 2; s <= ex.sets; s++) {
              await supabase.functions.invoke("admin-workout-builder", {
                body: {
                  action: "add_set",
                  exerciseId: newEx.id,
                  setNumber: s,
                  weight: ex.weight ? parseFloat(ex.weight) : null,
                  reps: ex.reps ? parseInt(ex.reps) : null,
                },
              });
            }
          }
          // Update first set with weight/reps
          if (newEx?.sets?.[0] && (ex.weight || ex.reps)) {
            await supabase.functions.invoke("admin-workout-builder", {
              body: {
                action: "update_set",
                setId: newEx.sets[0].id,
                weight: ex.weight ? parseFloat(ex.weight) : null,
                reps: ex.reps ? parseInt(ex.reps) : null,
              },
            });
          }
        }
      }

      toast({ title: isEdit ? "Workout updated" : "Workout created" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error saving workout", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-base">{isEdit ? "Edit Workout" : "New Workout"}</SheetTitle>
          </SheetHeader>

          <div className="p-4 space-y-4">
            <div>
              <Label className="text-xs">Workout Name</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label className="text-xs">Warmup / Coach Notes</Label>
              <Textarea
                value={warmup}
                onChange={(e) => setWarmup(e.target.value)}
                className="mt-1 min-h-[60px]"
                placeholder="Warm-up instructions, notes..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Exercises</Label>
                <Button size="sm" variant="outline" onClick={() => setSearchOpen(true)} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Exercise
                </Button>
              </div>

              {exercises.map((ex, idx) => (
                <div key={idx} className="border border-border rounded-md p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      {String.fromCharCode(65 + idx)})
                    </span>
                    <Input
                      value={ex.exercise_name}
                      onChange={(e) => updateExercise(idx, "exercise_name", e.target.value)}
                      placeholder="Exercise name"
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => removeExercise(idx)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Sets</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={ex.sets}
                        onChange={(e) => updateExercise(idx, "sets", parseInt(e.target.value) || 1)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Reps</Label>
                      <Input
                        value={ex.reps}
                        onChange={(e) => updateExercise(idx, "reps", e.target.value)}
                        placeholder="8-12"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Weight</Label>
                      <Input
                        value={ex.weight}
                        onChange={(e) => updateExercise(idx, "weight", e.target.value)}
                        placeholder="kg"
                        className="h-7 text-xs"
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                  <Input
                    value={ex.notes}
                    onChange={(e) => updateExercise(idx, "notes", e.target.value)}
                    placeholder="Notes (tempo, rest, cues...)"
                    className="h-7 text-[10px]"
                  />
                </div>
              ))}

              {exercises.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No exercises yet. Click "+ Exercise" to add one.
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs">Cooldown</Label>
              <Textarea
                value={cooldown}
                onChange={(e) => setCooldown(e.target.value)}
                className="mt-1 min-h-[60px]"
                placeholder="Cooldown / stretch notes..."
              />
            </div>
          </div>

          <div className="sticky bottom-0 p-4 border-t border-border bg-background flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1" size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {isEdit ? "Update" : "Save Workout"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {searchOpen && (
        <ExerciseSearch
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSelectExercise={(name) => {
            addExercise(name);
            setSearchOpen(false);
          }}
        />
      )}
    </>
  );
}
