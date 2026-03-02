import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, Plus, Copy, Trash2, Save, Loader2, Dumbbell, GripVertical,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TemplateExercise {
  name: string;
  sets: number;
  reps: string;
  rpe?: number | null;
  rir?: number | null;
  percentage?: number | null;
  tempo?: string;
  rest_seconds?: number;
  notes?: string;
  set_type?: string;
}

interface TemplateWorkout {
  id?: string;
  template_id: string;
  week_number: number;
  day_number: number;
  workout_name: string;
  notes: string;
  exercises: TemplateExercise[];
}

interface Props {
  template: { id: string; name: string; duration_weeks: number; days_per_week: number; category: string; description: string };
  onBack: () => void;
}

export function TemplateEditor({ template, onBack }: Props) {
  const [workouts, setWorkouts] = useState<TemplateWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1);
  const [saving, setSaving] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const [dupTarget, setDupTarget] = useState("");
  const [dupProgression, setDupProgression] = useState("none");
  const [dupValue, setDupValue] = useState("2.5");

  useEffect(() => {
    fetchWorkouts();
  }, [template.id]);

  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "get_template_detail", templateId: template.id },
      });
      if (error) throw error;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setWorkouts((parsed.workouts || []).map((w: any) => ({
        ...w,
        exercises: Array.isArray(w.exercises) ? w.exercises : [],
      })));
    } catch { setWorkouts([]); }
    finally { setLoading(false); }
  };

  const weekWorkouts = workouts.filter(w => w.week_number === activeWeek);

  const addWorkout = () => {
    const dayNum = weekWorkouts.length + 1;
    setWorkouts(prev => [...prev, {
      template_id: template.id,
      week_number: activeWeek,
      day_number: dayNum,
      workout_name: `Day ${dayNum}`,
      notes: "",
      exercises: [],
    }]);
  };

  const updateWorkout = (idx: number, field: string, value: any) => {
    setWorkouts(prev => {
      const all = [...prev];
      const wIdx = all.findIndex((w, i) => {
        let count = 0;
        for (let j = 0; j < all.length; j++) {
          if (all[j].week_number === activeWeek) {
            if (count === idx) return j === i;
            count++;
          }
        }
        return false;
      });
      const realIdx = all.reduce((acc, w, i) => {
        if (w.week_number === activeWeek) {
          acc.push(i);
        }
        return acc;
      }, [] as number[])[idx];
      if (realIdx !== undefined) {
        (all[realIdx] as any)[field] = value;
      }
      return all;
    });
  };

  const addExercise = (workoutIdx: number) => {
    const realIdx = getRealIndex(workoutIdx);
    if (realIdx === undefined) return;
    setWorkouts(prev => {
      const all = [...prev];
      const w = { ...all[realIdx] };
      w.exercises = [...w.exercises, { name: "", sets: 3, reps: "8", set_type: "working" }];
      all[realIdx] = w;
      return all;
    });
  };

  const updateExercise = (workoutIdx: number, exIdx: number, field: string, value: any) => {
    const realIdx = getRealIndex(workoutIdx);
    if (realIdx === undefined) return;
    setWorkouts(prev => {
      const all = [...prev];
      const w = { ...all[realIdx] };
      const exercises = [...w.exercises];
      exercises[exIdx] = { ...exercises[exIdx], [field]: value };
      w.exercises = exercises;
      all[realIdx] = w;
      return all;
    });
  };

  const removeExercise = (workoutIdx: number, exIdx: number) => {
    const realIdx = getRealIndex(workoutIdx);
    if (realIdx === undefined) return;
    setWorkouts(prev => {
      const all = [...prev];
      const w = { ...all[realIdx] };
      w.exercises = w.exercises.filter((_, i) => i !== exIdx);
      all[realIdx] = w;
      return all;
    });
  };

  const removeWorkout = async (workoutIdx: number) => {
    const realIdx = getRealIndex(workoutIdx);
    if (realIdx === undefined) return;
    const w = workouts[realIdx];
    if (w.id) {
      await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "delete_template_workout", templateWorkoutId: w.id },
      });
    }
    setWorkouts(prev => prev.filter((_, i) => i !== realIdx));
  };

  const getRealIndex = (weekIdx: number): number | undefined => {
    let count = 0;
    for (let i = 0; i < workouts.length; i++) {
      if (workouts[i].week_number === activeWeek) {
        if (count === weekIdx) return i;
        count++;
      }
    }
    return undefined;
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const w of workouts) {
        await supabase.functions.invoke("admin-workout-builder", {
          body: {
            action: "save_template_workout",
            templateWorkoutId: w.id || null,
            templateId: template.id,
            weekNumber: w.week_number,
            dayNumber: w.day_number,
            workoutName: w.workout_name,
            notes: w.notes,
            exercises: w.exercises,
          },
        });
      }
      // Propagate changes to all assigned clients
      const { data: propagateResult } = await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "propagate_template", templateId: template.id },
      });
      const updatedCount = propagateResult?.updated || 0;
      const clientCount = propagateResult?.clients || 0;
      toast({ 
        title: "Saved & Synced!", 
        description: clientCount > 0 
          ? `Updated ${updatedCount} future workouts across ${clientCount} client(s)` 
          : "No active assignments to sync"
      });
      fetchWorkouts();
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDuplicate = async () => {
    const target = parseInt(dupTarget);
    if (!target || target === activeWeek) return;
    setSaving(true);
    try {
      const progression = dupProgression === "none" ? null : {
        type: dupProgression,
        value: parseFloat(dupValue) || 0,
      };
      await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "duplicate_template_week", templateId: template.id, sourceWeek: activeWeek, targetWeek: target, progression },
      });
      toast({ title: `Week ${activeWeek} → Week ${target}` });
      setDupOpen(false);
      fetchWorkouts();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                {template.name}
              </h1>
              <p className="text-xs text-muted-foreground">{template.duration_weeks} weeks · {template.days_per_week} days/week · {template.category}</p>
            </div>
          </div>
          <Button variant="hero" onClick={saveAll} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All
          </Button>
        </div>

        {/* Week tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: template.duration_weeks }, (_, i) => i + 1).map(w => (
            <Button
              key={w}
              variant={activeWeek === w ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveWeek(w)}
              className="shrink-0"
            >
              Week {w}
            </Button>
          ))}
        </div>

        {/* Week actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addWorkout} className="gap-1">
            <Plus className="h-3.5 w-3.5" />Add Workout Day
          </Button>
          <Dialog open={dupOpen} onOpenChange={setDupOpen}>
            <Button variant="outline" size="sm" onClick={() => { setDupTarget(String(activeWeek + 1)); setDupOpen(true); }} className="gap-1">
              <Copy className="h-3.5 w-3.5" />Duplicate Week
            </Button>
            <DialogContent>
              <DialogHeader><DialogTitle>Duplicate Week {activeWeek}</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-muted-foreground">Target Week</label>
                  <Input type="number" value={dupTarget} onChange={(e) => setDupTarget(e.target.value)} min="1" max={String(template.duration_weeks)} />
                </div>
                <Select value={dupProgression} onValueChange={setDupProgression}>
                  <SelectTrigger><SelectValue placeholder="Auto-progression" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No progression</SelectItem>
                    <SelectItem value="weight_increase">Increase %1RM</SelectItem>
                    <SelectItem value="reps_increase">Increase reps</SelectItem>
                    <SelectItem value="rir_decrease">Decrease RIR</SelectItem>
                  </SelectContent>
                </Select>
                {dupProgression !== "none" && (
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {dupProgression === "weight_increase" ? "% increase" : dupProgression === "reps_increase" ? "Reps to add" : "RIR to reduce"}
                    </label>
                    <Input type="number" value={dupValue} onChange={(e) => setDupValue(e.target.value)} step="0.5" />
                  </div>
                )}
                <Button onClick={handleDuplicate} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Duplicate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workout cards */}
        {weekWorkouts.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="p-6 text-center text-muted-foreground">
              No workouts for Week {activeWeek}. Add one above.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {weekWorkouts.map((w, wIdx) => (
              <Card key={w.id || `new-${wIdx}`} className="glass border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={w.workout_name}
                      onChange={(e) => updateWorkout(wIdx, "workout_name", e.target.value)}
                      className="font-semibold text-base border-none px-0 h-auto focus-visible:ring-0"
                      placeholder="Workout name"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeWorkout(wIdx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input
                    value={w.notes}
                    onChange={(e) => updateWorkout(wIdx, "notes", e.target.value)}
                    placeholder="Workout notes..."
                    className="text-xs border-none px-0 h-auto focus-visible:ring-0 text-muted-foreground"
                  />
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Exercise rows */}
                  {w.exercises.map((ex, eIdx) => (
                    <div key={eIdx} className="border border-border/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          value={ex.name}
                          onChange={(e) => updateExercise(wIdx, eIdx, "name", e.target.value)}
                          placeholder="Exercise name"
                          className="flex-1 h-8 text-sm"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeExercise(wIdx, eIdx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Sets</label>
                          <Input type="number" value={ex.sets} onChange={(e) => updateExercise(wIdx, eIdx, "sets", parseInt(e.target.value) || 1)} className="h-7 text-xs" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Reps</label>
                          <Input value={ex.reps} onChange={(e) => updateExercise(wIdx, eIdx, "reps", e.target.value)} className="h-7 text-xs" placeholder="8" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">%1RM</label>
                          <Input type="number" value={ex.percentage ?? ""} onChange={(e) => updateExercise(wIdx, eIdx, "percentage", e.target.value ? parseFloat(e.target.value) : null)} className="h-7 text-xs" placeholder="85" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">RPE</label>
                          <Input type="number" value={ex.rpe ?? ""} onChange={(e) => updateExercise(wIdx, eIdx, "rpe", e.target.value ? parseFloat(e.target.value) : null)} className="h-7 text-xs" placeholder="8" step="0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">RIR</label>
                          <Input type="number" value={ex.rir ?? ""} onChange={(e) => updateExercise(wIdx, eIdx, "rir", e.target.value ? parseInt(e.target.value) : null)} className="h-7 text-xs" placeholder="2" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Tempo</label>
                          <Input value={ex.tempo ?? ""} onChange={(e) => updateExercise(wIdx, eIdx, "tempo", e.target.value)} className="h-7 text-xs" placeholder="30X1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Rest (sec)</label>
                          <Input type="number" value={ex.rest_seconds ?? ""} onChange={(e) => updateExercise(wIdx, eIdx, "rest_seconds", e.target.value ? parseInt(e.target.value) : undefined)} className="h-7 text-xs" placeholder="120" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Notes</label>
                          <Input value={ex.notes ?? ""} onChange={(e) => updateExercise(wIdx, eIdx, "notes", e.target.value)} className="h-7 text-xs" placeholder="Pause at bottom..." />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addExercise(wIdx)} className="w-full gap-1 border-dashed">
                    <Plus className="h-3.5 w-3.5" />Add Exercise
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
