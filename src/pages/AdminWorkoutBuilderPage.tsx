import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, Dumbbell, Plus, Trash2, Check, X, Loader2,
  FileText, Timer, Save, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ExerciseSearch } from "@/components/workout/ExerciseSearch";
import { isConditioningExercise } from "@/types/workout";

interface LocalSet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  is_completed: boolean;
}

interface LocalExercise {
  id: string;
  exercise_name: string;
  exercise_type: string;
  notes: string;
  sets: LocalSet[];
}

async function invokeBuilder(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-workout-builder", { body });
  if (error) throw error;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export default function AdminWorkoutBuilderPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  const workoutName = searchParams.get("name") || "Workout";
  const workoutDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const displayName = searchParams.get("client") || "Client";
  const cloneFrom = searchParams.get("cloneFrom");

  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exerciseSearchOpen, setExerciseSearchOpen] = useState(false);
  const [addingExercise, setAddingExercise] = useState(false);
  const [savingSetId, setSavingSetId] = useState<string | null>(null);

  // Redirect non-admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/");
  }, [adminLoading, isAdmin, navigate]);

  // Create workout on mount + optional clone
  useEffect(() => {
    if (!userId || !isAdmin || adminLoading) return;
    const create = async () => {
      try {
        const data = await invokeBuilder({
          action: "create_workout",
          userId,
          workoutName,
          date: workoutDate,
        });
        const newWorkoutId = data.id;
        setWorkoutId(newWorkoutId);

        // Clone from previous workout if requested
        if (cloneFrom && newWorkoutId) {
          setIsCloning(true);
          try {
            const sourceData = await invokeBuilder({ action: "get_workout_detail", workoutId: cloneFrom });
            const sourceExercises = sourceData.exercises || [];
            for (let i = 0; i < sourceExercises.length; i++) {
              const srcEx = sourceExercises[i];
              const exData = await invokeBuilder({
                action: "add_exercise",
                workoutId: newWorkoutId,
                exerciseName: srcEx.exercise_name,
                orderIndex: i,
                exerciseType: srcEx.exercise_type || "strength",
              });
              const newSets: LocalSet[] = [];
              const srcSets = srcEx.sets || [];
              // First set is auto-created, update it if we have source data
              if (srcSets.length > 0 && exData.sets?.length > 0) {
                const firstSet = exData.sets[0];
                await invokeBuilder({
                  action: "update_set", setId: firstSet.id,
                  weight: srcSets[0].weight, reps: srcSets[0].reps, rir: srcSets[0].rir,
                  isCompleted: false,
                });
                newSets.push({
                  id: firstSet.id, set_number: 1,
                  weight: srcSets[0].weight, reps: srcSets[0].reps, rir: srcSets[0].rir || null,
                  is_completed: false,
                });
              }
              // Add remaining sets
              for (let j = 1; j < srcSets.length; j++) {
                const setData = await invokeBuilder({
                  action: "add_set", exerciseId: exData.id, setNumber: j + 1,
                  weight: srcSets[j].weight, reps: srcSets[j].reps,
                });
                if (srcSets[j].rir != null) {
                  await invokeBuilder({
                    action: "update_set", setId: setData.id,
                    weight: srcSets[j].weight, reps: srcSets[j].reps, rir: srcSets[j].rir,
                    isCompleted: false,
                  });
                }
                newSets.push({
                  id: setData.id, set_number: j + 1,
                  weight: srcSets[j].weight, reps: srcSets[j].reps, rir: srcSets[j].rir || null,
                  is_completed: false,
                });
              }
              // If no source sets, use the auto-created first set
              if (srcSets.length === 0 && exData.sets?.length > 0) {
                newSets.push({
                  id: exData.sets[0].id, set_number: 1,
                  weight: null, reps: null, rir: null, is_completed: false,
                });
              }
              setExercises(prev => [...prev, {
                id: exData.id,
                exercise_name: exData.exercise_name,
                exercise_type: exData.exercise_type || "strength",
                notes: srcEx.notes || "",
                sets: newSets,
              }]);
            }
            toast({ title: "Workout cloned", description: `${sourceExercises.length} exercises loaded from previous session` });
          } catch (cloneErr: any) {
            toast({ title: "Clone partially failed", description: cloneErr.message, variant: "destructive" });
          } finally {
            setIsCloning(false);
          }
        }
      } catch (e: any) {
        toast({ title: "Error creating workout", description: e.message, variant: "destructive" });
        navigate(`/admin/user/${userId}`);
      } finally {
        setIsCreating(false);
      }
    };
    create();
  }, [userId, isAdmin, adminLoading]);

  // Stats
  const stats = useMemo(() => {
    const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
    const completedSets = exercises.reduce((a, e) => a + e.sets.filter(s => s.is_completed).length, 0);
    const totalVolume = exercises.reduce(
      (a, e) => a + e.sets.reduce((sa, s) => sa + (s.weight || 0) * (s.reps || 0), 0), 0
    );
    return { totalSets, completedSets, totalVolume, exerciseCount: exercises.length };
  }, [exercises]);

  const handleAddExercise = async (name: string) => {
    if (!workoutId) return;
    setAddingExercise(true);
    const type = isConditioningExercise(name) ? "conditioning" : "strength";
    try {
      const data = await invokeBuilder({
        action: "add_exercise",
        workoutId,
        exerciseName: name,
        orderIndex: exercises.length,
        exerciseType: type,
      });
      setExercises(prev => [...prev, {
        id: data.id,
        exercise_name: data.exercise_name,
        exercise_type: data.exercise_type || "strength",
        notes: "",
        sets: (data.sets || []).map((s: any) => ({
          id: s.id, set_number: s.set_number, weight: s.weight, reps: s.reps, rir: s.rir || null, is_completed: s.is_completed || false,
        })),
      }]);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAddingExercise(false);
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      await invokeBuilder({ action: "remove_exercise", exerciseId });
      setExercises(prev => prev.filter(e => e.id !== exerciseId));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAddSet = async (exerciseId: string) => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    try {
      const data = await invokeBuilder({ action: "add_set", exerciseId, setNumber: ex.sets.length + 1 });
      setExercises(prev => prev.map(e =>
        e.id === exerciseId
          ? { ...e, sets: [...e.sets, { id: data.id, set_number: data.set_number, weight: null, reps: null, rir: null, is_completed: false }] }
          : e
      ));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveSet = async (setId: string) => {
    try {
      await invokeBuilder({ action: "remove_set", setId });
      setExercises(prev => prev.map(e => ({
        ...e,
        sets: e.sets.filter(s => s.id !== setId).map((s, i) => ({ ...s, set_number: i + 1 })),
      })));
    } catch {}
  };

  const handleUpdateSet = useCallback((setId: string, field: "weight" | "reps" | "rir", value: number | null) => {
    setExercises(prev => prev.map(e => ({
      ...e,
      sets: e.sets.map(s => s.id === setId ? { ...s, [field]: value } : s),
    })));
  }, []);

  // Save set on blur
  const handleSaveSet = useCallback(async (setId: string) => {
    let target: LocalSet | undefined;
    for (const ex of exercises) {
      target = ex.sets.find(s => s.id === setId);
      if (target) break;
    }
    if (!target) return;
    setSavingSetId(setId);
    try {
      await invokeBuilder({
        action: "update_set", setId,
        weight: target.weight, reps: target.reps, rir: target.rir,
        isCompleted: target.is_completed,
      });
    } catch {} finally {
      setSavingSetId(null);
    }
  }, [exercises]);

  const handleCompleteSet = useCallback(async (setId: string) => {
    let target: LocalSet | undefined;
    for (const ex of exercises) {
      target = ex.sets.find(s => s.id === setId);
      if (target) break;
    }
    if (!target) return;
    const newCompleted = !target.is_completed;
    setExercises(prev => prev.map(e => ({
      ...e,
      sets: e.sets.map(s => s.id === setId ? { ...s, is_completed: newCompleted } : s),
    })));
    try {
      await invokeBuilder({
        action: "update_set", setId,
        weight: target.weight, reps: target.reps, rir: target.rir,
        isCompleted: newCompleted,
      });
    } catch {}
  }, [exercises]);

  const handleUpdateExerciseNotes = (exerciseId: string, value: string) => {
    setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, notes: value } : e));
  };

  const handleSaveExerciseNotes = async (exerciseId: string) => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    try {
      await invokeBuilder({ action: "update_exercise_notes", exerciseId, notes: ex.notes });
    } catch {}
  };

  const handleFinish = async () => {
    if (!workoutId) return;
    setIsSaving(true);
    try {
      // Save notes
      if (notes.trim()) {
        await invokeBuilder({ action: "update_notes", workoutId, notes: notes.trim() });
      }
      // Save all exercise notes
      for (const ex of exercises) {
        if (ex.notes.trim()) {
          await invokeBuilder({ action: "update_exercise_notes", exerciseId: ex.id, notes: ex.notes.trim() });
        }
      }
      // Mark filled sets as completed
      for (const ex of exercises) {
        for (const s of ex.sets) {
          if (s.weight != null && s.reps != null) {
            await invokeBuilder({
              action: "update_set", setId: s.id,
              weight: s.weight, reps: s.reps, rir: s.rir, isCompleted: true,
            });
          }
        }
      }
      await invokeBuilder({ action: "finish_workout", workoutId });
      toast({ title: "Workout saved", description: `Workout logged for ${displayName}` });
      navigate(`/admin/user/${userId}`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Delete the unfinished workout
    if (workoutId) {
      invokeBuilder({ action: "finish_workout", workoutId }).catch(() => {});
    }
    navigate(`/admin/user/${userId}`);
  };

  if (adminLoading || isCreating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{isCloning ? "Cloning workout..." : "Setting up workout..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={handleCancel} className="shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary shrink-0" />
                  {workoutName}
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  for <span className="text-primary font-medium">{displayName}</span> · {format(new Date(workoutDate + "T12:00:00"), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {stats.totalSets > 0 && (
                <div className="hidden sm:flex items-center gap-3 mr-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {stats.completedSets}/{stats.totalSets} sets
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {stats.totalVolume.toLocaleString()} kg
                  </Badge>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button size="sm" onClick={handleFinish} disabled={isSaving || exercises.length === 0} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Finish
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
        {/* Mobile Stats */}
        {stats.totalSets > 0 && (
          <div className="flex sm:hidden gap-2">
            <Badge variant="secondary" className="font-mono text-xs flex-1 justify-center py-1.5">
              {stats.completedSets}/{stats.totalSets} sets
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs flex-1 justify-center py-1.5">
              {stats.totalVolume.toLocaleString()} kg
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs flex-1 justify-center py-1.5">
              {stats.exerciseCount} exercises
            </Badge>
          </div>
        )}

        {/* Exercise Cards */}
        {exercises.map((exercise) => {
          const exCompleted = exercise.sets.filter(s => s.is_completed).length;
          return (
            <Card key={exercise.id} className="overflow-hidden border-border/50">
              {/* Exercise Header */}
              <CardHeader className="py-3 px-4 bg-secondary/30 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                      {exercise.exercise_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {exCompleted}/{exercise.sets.length} sets
                      </span>
                      {exercise.exercise_type === "conditioning" && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          <Timer className="h-2.5 w-2.5 mr-0.5" />
                          Conditioning
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveExercise(exercise.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Set Grid Header */}
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px_36px] gap-1.5 items-center py-2.5 px-4 border-b border-border/50 bg-muted/30">
                  <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">Set</span>
                  <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">Kg</span>
                  <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">Reps</span>
                  <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">RIR</span>
                  <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">Done</span>
                  <span></span>
                </div>

                {/* Sets */}
                <div className="divide-y divide-border/20">
                  {exercise.sets.map((s) => (
                    <div
                      key={s.id}
                      className={`grid grid-cols-[40px_1fr_1fr_1fr_44px_36px] gap-1.5 items-center py-2 px-4 transition-colors ${
                        s.is_completed ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className="text-center text-sm font-bold text-muted-foreground font-mono">
                        {s.set_number}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="—"
                        value={s.weight ?? ""}
                        onChange={(e) => handleUpdateSet(s.id, "weight", e.target.value ? Number(e.target.value) : null)}
                        onBlur={() => handleSaveSet(s.id)}
                        className="h-10 text-center text-sm font-mono border-border/50 bg-secondary/20"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="—"
                        value={s.reps ?? ""}
                        onChange={(e) => handleUpdateSet(s.id, "reps", e.target.value ? Number(e.target.value) : null)}
                        onBlur={() => handleSaveSet(s.id)}
                        className="h-10 text-center text-sm font-mono border-border/50 bg-secondary/20"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="—"
                        value={s.rir ?? ""}
                        onChange={(e) => handleUpdateSet(s.id, "rir", e.target.value ? Number(e.target.value) : null)}
                        onBlur={() => handleSaveSet(s.id)}
                        className="h-10 text-center text-sm font-mono border-border/50 bg-secondary/20"
                      />
                      <Button
                        variant={s.is_completed ? "default" : "outline"}
                        size="icon"
                        className={`h-10 w-10 ${s.is_completed ? "bg-success text-success-foreground hover:bg-success/90" : "border-border/50"}`}
                        onClick={() => handleCompleteSet(s.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveSet(s.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add Set + Coach Cue */}
                <div className="p-3 space-y-2 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSet(exercise.id)}
                    className="w-full gap-2 border-dashed border-border/50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Set
                  </Button>
                  <div className="relative">
                    <FileText className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Coach cue (e.g. 3s eccentric, pause at bottom)"
                      value={exercise.notes}
                      onChange={(e) => handleUpdateExerciseNotes(exercise.id, e.target.value)}
                      onBlur={() => handleSaveExerciseNotes(exercise.id)}
                      className="pl-8 h-9 text-xs border-border/30 bg-transparent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Exercise Button */}
        <Button
          variant="outline"
          className="w-full h-14 gap-3 border-dashed border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary"
          onClick={() => setExerciseSearchOpen(true)}
          disabled={addingExercise}
        >
          {addingExercise ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          <span className="text-base font-medium">Add Exercise</span>
        </Button>

        {/* Empty State */}
        {exercises.length === 0 && !addingExercise && (
          <div className="text-center py-12 space-y-3">
            <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No exercises yet</p>
            <p className="text-xs text-muted-foreground/60">
              Click "Add Exercise" to start building this workout
            </p>
          </div>
        )}

        {/* Workout Notes */}
        {exercises.length > 0 && (
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Session Notes
              </label>
              <Textarea
                placeholder="Overall session notes, coaching feedback, adjustments for next time..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none text-sm bg-transparent border-border/30"
              />
            </CardContent>
          </Card>
        )}

        {/* Session Stats Footer */}
        {exercises.length > 0 && (
          <Card className="border-border/50 bg-secondary/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold font-mono text-primary">{stats.exerciseCount}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Exercises</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-primary">{stats.completedSets}/{stats.totalSets}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Sets</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-primary">{stats.totalVolume.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Volume (kg)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom action bar */}
        {exercises.length > 0 && (
          <div className="pb-8">
            <Button
              onClick={handleFinish}
              disabled={isSaving}
              className="w-full h-12 gap-2 text-base"
              variant="hero"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save & Finish Workout
            </Button>
          </div>
        )}
      </main>

      {/* Exercise Search Dialog - uses the 300+ hardcoded catalog */}
      <ExerciseSearch
        open={exerciseSearchOpen}
        onOpenChange={setExerciseSearchOpen}
        onSelectExercise={handleAddExercise}
        recentExercises={exercises.map(e => e.exercise_name)}
      />
    </div>
  );
}
