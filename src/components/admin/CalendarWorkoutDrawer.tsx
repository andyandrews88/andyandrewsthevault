import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Trash2, Save, X, Loader2, Maximize2, Minimize2,
  MoreVertical, History, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { WorkoutWithExercises } from "./CalendarWorkoutCard";
import { ExerciseSearch } from "@/components/workout/ExerciseSearch";
import { AdminExerciseMenu } from "@/components/workout/AdminExerciseMenu";
import { cn } from "@/lib/utils";

interface DrawerSet {
  id?: string;
  set_number: number;
  weight: string;
  reps: string;
  rir: string;
  is_completed: boolean;
  set_type: string;
  isNew?: boolean;
}

interface DrawerExercise {
  id?: string;
  exercise_name: string;
  notes: string;
  sets: DrawerSet[];
  isNew?: boolean;
  previousSets?: { weight: number; reps: number }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutWithExercises | null;
  userId: string;
  date: string;
  onSaved: () => void;
}

function makeDefaultSet(setNumber: number): DrawerSet {
  return { set_number: setNumber, weight: "", reps: "", rir: "", is_completed: false, set_type: "working", isNew: true };
}

export function CalendarWorkoutDrawer({ open, onOpenChange, workout, userId, date, onSaved }: Props) {
  const [title, setTitle] = useState("New Workout");
  const [warmup, setWarmup] = useState("");
  const [cooldown, setCooldown] = useState("");
  const [exercises, setExercises] = useState<DrawerExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [maximized, setMaximized] = useState(false);

  const isEdit = !!workout;

  useEffect(() => {
    if (!open) return;
    if (workout) {
      setTitle(workout.workout_name);
      setWarmup(workout.notes || "");
      setCooldown("");
      setExercises(
        workout.exercises.map((ex) => ({
          id: ex.id,
          exercise_name: ex.exercise_name,
          notes: ex.notes || "",
          sets: ex.sets.map((s) => ({
            id: s.id,
            set_number: s.set_number,
            weight: s.weight?.toString() || "",
            reps: s.reps?.toString() || "",
            rir: (s as any).rir?.toString() || "",
            is_completed: !!s.is_completed,
            set_type: (s as any).set_type || "working",
          })),
        }))
      );
    } else {
      setTitle("New Workout");
      setWarmup("");
      setCooldown("");
      setExercises([]);
    }
  }, [workout, open]);

  const addExercise = (name: string) => {
    setExercises((prev) => [
      ...prev,
      {
        exercise_name: name,
        notes: "",
        sets: [makeDefaultSet(1), makeDefaultSet(2), makeDefaultSet(3)],
        isNew: true,
      },
    ]);
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateExerciseField = (idx: number, field: keyof DrawerExercise, value: any) => {
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)));
  };

  const addSet = (exIdx: number, type: string = "working") => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const nextNum = ex.sets.length + 1;
        return { ...ex, sets: [...ex.sets, { ...makeDefaultSet(nextNum), set_type: type }] };
      })
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const newSets = ex.sets.filter((_, si) => si !== setIdx).map((s, si) => ({ ...s, set_number: si + 1 }));
        return { ...ex, sets: newSets };
      })
    );
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof DrawerSet, value: any) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const newSets = ex.sets.map((s, si) => (si === setIdx ? { ...s, [field]: value } : s));
        return { ...ex, sets: newSets };
      })
    );
  };

  const toggleSetType = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const newSets = ex.sets.map((s, si) =>
          si === setIdx ? { ...s, set_type: s.set_type === "warmup" ? "working" : "warmup" } : s
        );
        return { ...ex, sets: newSets };
      })
    );
  };

  const loadLastSession = useCallback(async (exIdx: number) => {
    const ex = exercises[exIdx];
    if (!ex) return;
    try {
      const { data } = await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "get_last_session", userId, exerciseName: ex.exercise_name },
      });
      if (data?.sets?.length) {
        const prevSets = data.sets.map((s: any) => ({ weight: s.weight || 0, reps: s.reps || 0 }));
        updateExerciseField(exIdx, "previousSets", prevSets);
        // Also pre-fill sets if current ones are empty
        setExercises((prev) =>
          prev.map((e, i) => {
            if (i !== exIdx) return e;
            const newSets = data.sets.map((s: any, si: number) => ({
              ...(e.sets[si] || makeDefaultSet(si + 1)),
              weight: s.weight?.toString() || "",
              reps: s.reps?.toString() || "",
              rir: s.rir?.toString() || "",
              set_type: s.set_type || "working",
              isNew: e.sets[si]?.isNew ?? true,
            }));
            return { ...e, sets: newSets, previousSets: prevSets };
          })
        );
        toast({ title: "Last session loaded" });
      } else {
        toast({ title: "No previous session found", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to load", variant: "destructive" });
    }
  }, [exercises, userId]);

  const handleReplaceExercise = (name: string) => {
    if (replaceIdx !== null) {
      updateExerciseField(replaceIdx, "exercise_name", name);
      setReplaceIdx(null);
    }
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
        const { data } = await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "create_workout", userId, workoutName: title, date },
        });
        workoutId = data?.id;
        if (!workoutId) throw new Error("Failed to create workout");
      } else {
        await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "update_workout_name", workoutId, workoutName: title },
        });
      }

      if (warmup || workout?.notes) {
        await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "update_notes", workoutId, notes: warmup },
        });
      }

      // Remove deleted exercises
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

      // Process exercises
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        let exerciseId = ex.id;

        if (ex.isNew || !ex.id) {
          if (!ex.exercise_name.trim()) continue;
          const { data: newEx } = await supabase.functions.invoke("admin-workout-builder", {
            body: { action: "add_exercise", workoutId, exerciseName: ex.exercise_name, orderIndex: i },
          });
          exerciseId = newEx?.id;
          if (!exerciseId) continue;

          // Remove auto-created first set, we'll add our own
          if (newEx?.sets?.[0]) {
            await supabase.functions.invoke("admin-workout-builder", {
              body: { action: "remove_set", setId: newEx.sets[0].id },
            });
          }
        }

        // Update exercise notes
        if (exerciseId && ex.notes) {
          await supabase.functions.invoke("admin-workout-builder", {
            body: { action: "update_exercise_notes", exerciseId, notes: ex.notes },
          });
        }

        // Handle sets
        if (exerciseId) {
          // Remove old sets that were deleted (for existing exercises)
          if (ex.id && workout) {
            const oldEx = workout.exercises.find((e) => e.id === ex.id);
            if (oldEx) {
              const keptSetIds = ex.sets.filter((s) => s.id).map((s) => s.id);
              for (const oldSet of oldEx.sets) {
                if (!keptSetIds.includes(oldSet.id)) {
                  await supabase.functions.invoke("admin-workout-builder", {
                    body: { action: "remove_set", setId: oldSet.id },
                  });
                }
              }
            }
          }

          // Add/update sets
          for (const s of ex.sets) {
            if (s.id && !s.isNew) {
              // Update existing set
              await supabase.functions.invoke("admin-workout-builder", {
                body: {
                  action: "update_set",
                  setId: s.id,
                  weight: s.weight ? parseFloat(s.weight) : null,
                  reps: s.reps ? parseInt(s.reps) : null,
                  rir: s.rir ? parseInt(s.rir) : null,
                  isCompleted: s.is_completed,
                },
              });
            } else {
              // Add new set
              await supabase.functions.invoke("admin-workout-builder", {
                body: {
                  action: "add_set",
                  exerciseId,
                  setNumber: s.set_number,
                  weight: s.weight ? parseFloat(s.weight) : null,
                  reps: s.reps ? parseInt(s.reps) : null,
                },
              });
            }
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
        <SheetContent
          side="right"
          className={cn(
            "overflow-y-auto p-0 transition-all duration-200",
            maximized ? "w-full sm:max-w-4xl" : "w-full sm:max-w-md"
          )}
        >
          <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <SheetTitle className="text-base">{isEdit ? "Edit Workout" : "New Workout"}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setMaximized(!maximized)}
            >
              {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
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
                <Button size="sm" variant="outline" onClick={() => { setReplaceIdx(null); setSearchOpen(true); }} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Exercise
                </Button>
              </div>

              {exercises.map((ex, exIdx) => (
                <div key={exIdx} className="border border-border rounded-md bg-muted/20 overflow-hidden">
                  {/* Exercise Header */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      {String.fromCharCode(65 + exIdx)})
                    </span>
                    <span className="text-xs font-semibold flex-1 uppercase tracking-wide truncate">
                      {ex.exercise_name || "Untitled"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {ex.sets.filter((s) => s.is_completed && s.set_type !== "warmup").length}/
                      {ex.sets.filter((s) => s.set_type !== "warmup").length} sets
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => loadLastSession(exIdx)}>
                          <History className="h-4 w-4 mr-2" /> Load Last Session
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setReplaceIdx(exIdx); setSearchOpen(true); }}>
                          <RefreshCw className="h-4 w-4 mr-2" /> Replace Exercise
                        </DropdownMenuItem>
                        <AdminExerciseMenu exerciseName={ex.exercise_name} isAdmin={true} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => removeExercise(exIdx)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Remove Exercise
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Set Header Row */}
                  <div className={cn(
                    "grid gap-1 items-center py-1.5 px-3 text-[10px] font-medium text-muted-foreground border-b border-border/50",
                    maximized
                      ? "grid-cols-[28px_1fr_1fr_1fr_44px_36px_24px]"
                      : "grid-cols-[24px_1fr_1fr_40px_28px_20px]"
                  )}>
                    <span className="text-center">Set</span>
                    {maximized && <span className="text-center">Prev</span>}
                    <span className="text-center">Kg</span>
                    <span className="text-center">Reps</span>
                    <span className="text-center">RIR</span>
                    <span className="text-center">✓</span>
                    <span></span>
                  </div>

                  {/* Set Rows */}
                  <div className="px-3">
                    {ex.sets.map((s, sIdx) => {
                      const isWarmup = s.set_type === "warmup";
                      const prev = ex.previousSets?.[sIdx];
                      return (
                        <div
                          key={sIdx}
                          className={cn(
                            "grid gap-1 items-center py-1.5 border-b border-border/30 last:border-0",
                            maximized
                              ? "grid-cols-[28px_1fr_1fr_1fr_44px_36px_24px]"
                              : "grid-cols-[24px_1fr_1fr_40px_28px_20px]",
                            isWarmup && "opacity-60"
                          )}
                        >
                          {/* Set number / warmup toggle */}
                          <button
                            onClick={() => toggleSetType(exIdx, sIdx)}
                            className={cn(
                              "text-center text-[11px] font-medium cursor-pointer select-none",
                              isWarmup ? "text-yellow-500 font-bold" : "text-muted-foreground"
                            )}
                            title={isWarmup ? "Warmup (tap for working)" : "Working (tap for warmup)"}
                          >
                            {isWarmup ? "W" : s.set_number}
                          </button>

                          {/* Previous */}
                          {maximized && (
                            <div className="text-center text-[10px] text-muted-foreground">
                              {prev ? `${prev.weight}×${prev.reps}` : "—"}
                            </div>
                          )}

                          {/* Weight */}
                          <input
                            type="number"
                            inputMode="decimal"
                            value={s.weight}
                            onChange={(e) => updateSet(exIdx, sIdx, "weight", e.target.value)}
                            placeholder="kg"
                            className="h-7 w-full text-center text-xs rounded-md border border-input bg-background px-1"
                          />

                          {/* Reps */}
                          <input
                            type="number"
                            inputMode="numeric"
                            value={s.reps}
                            onChange={(e) => updateSet(exIdx, sIdx, "reps", e.target.value)}
                            placeholder="reps"
                            className="h-7 w-full text-center text-xs rounded-md border border-input bg-background px-1"
                          />

                          {/* RIR */}
                          <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            max="5"
                            value={s.rir}
                            onChange={(e) => updateSet(exIdx, sIdx, "rir", e.target.value)}
                            placeholder="RIR"
                            className={cn(
                              "h-7 w-full text-center text-[10px] rounded-md border border-input bg-background px-0.5",
                              maximized ? "" : "text-[9px]"
                            )}
                          />

                          {/* Complete */}
                          <div className="flex justify-center">
                            <Checkbox
                              checked={s.is_completed}
                              onCheckedChange={(checked) => updateSet(exIdx, sIdx, "is_completed", !!checked)}
                              className="h-5 w-5"
                            />
                          </div>

                          {/* Remove */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            onClick={() => removeSet(exIdx, sIdx)}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Set / Warmup */}
                  <div className="px-3 py-2 border-t border-border/50 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => addSet(exIdx)} className="flex-1 h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add Set
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => addSet(exIdx, "warmup")} className="text-muted-foreground text-[10px] h-7">
                      + Warmup
                    </Button>
                  </div>

                  {/* Coach Cues / Notes — expandable */}
                  <div className="px-3 pb-2">
                    <Textarea
                      value={ex.notes}
                      onChange={(e) => updateExerciseField(exIdx, "notes", e.target.value)}
                      placeholder="Coach cues, tempo, rest, instructions..."
                      className="text-[11px] min-h-[32px] resize-y"
                      rows={ex.notes ? Math.min(6, Math.max(2, ex.notes.split('\n').length + 1)) : 1}
                    />
                  </div>
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
            if (replaceIdx !== null) {
              handleReplaceExercise(name);
            } else {
              addExercise(name);
            }
            setSearchOpen(false);
          }}
          mode={replaceIdx !== null ? "replace" : "add"}
        />
      )}
    </>
  );
}
