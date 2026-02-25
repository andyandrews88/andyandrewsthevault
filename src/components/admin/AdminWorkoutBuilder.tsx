import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus,
  Dumbbell,
  Save,
  Trash2,
  X,
  FileText,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AdminWorkoutBuilderProps {
  userId: string;
  displayName: string;
}

interface LocalExercise {
  id: string;
  exercise_name: string;
  exercise_type: string;
  sets: LocalSet[];
}

interface LocalSet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  is_completed: boolean;
}

interface LibraryExercise {
  id: string;
  name: string;
  category: string;
  muscle_group: string | null;
}

async function invokeBuilder(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-workout-builder", { body });
  if (error) throw error;
  return data;
}

export function AdminWorkoutBuilder({ userId, displayName }: AdminWorkoutBuilderProps) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);

  // Exercise library search
  const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>([]);
  const [exerciseSearchOpen, setExerciseSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchLibrary = async () => {
      const { data } = await supabase
        .from("exercise_library")
        .select("id, name, category, muscle_group")
        .order("name");
      setLibraryExercises(data || []);
    };
    fetchLibrary();
  }, []);

  const filteredExercises = libraryExercises.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.muscle_group && e.muscle_group.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartWorkout = async () => {
    if (!workoutName.trim()) return;
    setIsSaving(true);
    try {
      const data = await invokeBuilder({
        action: "create_workout",
        userId,
        workoutName: workoutName.trim(),
        date: workoutDate,
      });
      setWorkoutId(data.id);
      setIsBuilding(true);
      setShowStartDialog(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExercise = async (name: string) => {
    if (!workoutId) return;
    setExerciseSearchOpen(false);
    setSearchQuery("");
    try {
      const data = await invokeBuilder({
        action: "add_exercise",
        workoutId,
        exerciseName: name,
        orderIndex: exercises.length,
        exerciseType: "strength",
      });
      setExercises((prev) => [
        ...prev,
        {
          id: data.id,
          exercise_name: data.exercise_name,
          exercise_type: data.exercise_type || "strength",
          sets: (data.sets || []).map((s: any) => ({
            id: s.id,
            set_number: s.set_number,
            weight: s.weight,
            reps: s.reps,
            is_completed: s.is_completed || false,
          })),
        },
      ]);
    } catch (e: any) {
      toast({ title: "Error adding exercise", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      await invokeBuilder({ action: "remove_exercise", exerciseId });
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAddSet = async (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    try {
      const data = await invokeBuilder({
        action: "add_set",
        exerciseId,
        setNumber: exercise.sets.length + 1,
      });
      setExercises((prev) =>
        prev.map((e) =>
          e.id === exerciseId
            ? {
                ...e,
                sets: [
                  ...e.sets,
                  { id: data.id, set_number: data.set_number, weight: null, reps: null, is_completed: false },
                ],
              }
            : e
        )
      );
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveSet = async (setId: string) => {
    try {
      await invokeBuilder({ action: "remove_set", setId });
      setExercises((prev) =>
        prev.map((e) => ({
          ...e,
          sets: e.sets.filter((s) => s.id !== setId),
        }))
      );
    } catch {}
  };

  const handleUpdateSet = useCallback(
    async (setId: string, field: "weight" | "reps", value: number | null) => {
      // Optimistic update
      setExercises((prev) =>
        prev.map((e) => ({
          ...e,
          sets: e.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        }))
      );
      try {
        await invokeBuilder({
          action: "update_set",
          setId,
          [field]: value,
          isCompleted: true,
        });
      } catch {}
    },
    []
  );

  const handleFinishWorkout = async () => {
    if (!workoutId) return;
    setIsSaving(true);
    try {
      // Save notes first
      if (notes.trim()) {
        await invokeBuilder({ action: "update_notes", workoutId, notes: notes.trim() });
      }
      // Mark all sets as completed
      for (const ex of exercises) {
        for (const s of ex.sets) {
          if (s.weight && s.reps) {
            await invokeBuilder({
              action: "update_set",
              setId: s.id,
              weight: s.weight,
              reps: s.reps,
              isCompleted: true,
            });
          }
        }
      }
      await invokeBuilder({ action: "finish_workout", workoutId });
      toast({ title: "Workout saved", description: `Workout logged for ${displayName}` });
      // Reset
      setIsBuilding(false);
      setWorkoutId(null);
      setExercises([]);
      setNotes("");
      setWorkoutName("");
    } catch (e: any) {
      toast({ title: "Error finishing workout", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsBuilding(false);
    setWorkoutId(null);
    setExercises([]);
    setNotes("");
    setWorkoutName("");
  };

  if (!isBuilding) {
    return (
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Build Workout for {displayName}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Build Workout for {displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Workout name (e.g. Upper Body A)"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStartWorkout()}
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
            <Button onClick={handleStartWorkout} disabled={!workoutName.trim() || isSaving} className="w-full">
              Start Building
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card variant="elevated" className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              {workoutName}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Building for {displayName} · {format(new Date(workoutDate + "T12:00:00"), "MMMM d, yyyy")}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exercise cards */}
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="border-border/50">
            <CardHeader className="py-2 px-3 bg-secondary/30">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm uppercase tracking-wide">
                  {exercise.exercise_name}
                </h4>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveExercise(exercise.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {/* Set header */}
              <div className="grid grid-cols-[32px_1fr_1fr_28px] gap-2 text-xs text-muted-foreground font-medium">
                <span className="text-center">Set</span>
                <span className="text-center">Weight</span>
                <span className="text-center">Reps</span>
                <span></span>
              </div>
              {exercise.sets.map((s) => (
                <div key={s.id} className="grid grid-cols-[32px_1fr_1fr_28px] gap-2 items-center">
                  <span className="text-center text-sm text-muted-foreground">{s.set_number}</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={s.weight ?? ""}
                    onChange={(e) =>
                      handleUpdateSet(s.id, "weight", e.target.value ? Number(e.target.value) : null)
                    }
                    className="h-8 text-center text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="0"
                    value={s.reps ?? ""}
                    onChange={(e) =>
                      handleUpdateSet(s.id, "reps", e.target.value ? Number(e.target.value) : null)
                    }
                    className="h-8 text-center text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveSet(s.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddSet(exercise.id)}>
                <Plus className="h-3 w-3 mr-1" /> Add Set
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Add exercise via library search */}
        <Popover open={exerciseSearchOpen} onOpenChange={setExerciseSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Search className="h-4 w-4" />
              Add Exercise from Library
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search exercises..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No exercises found</CommandEmpty>
                <CommandGroup>
                  {filteredExercises.slice(0, 20).map((e) => (
                    <CommandItem key={e.id} onSelect={() => handleAddExercise(e.name)}>
                      <div className="flex flex-col">
                        <span className="text-sm">{e.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {e.category} {e.muscle_group ? `· ${e.muscle_group}` : ""}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Coach Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for the client about this session..."
            className="min-h-[60px] resize-none text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleFinishWorkout}
            disabled={isSaving || exercises.length === 0}
            className="flex-1 gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save & Complete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
