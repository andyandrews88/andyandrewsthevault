import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Program, ProgramExercise, useProgramStore } from "@/stores/programStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, GripVertical, Dumbbell } from "lucide-react";
import { toast } from "sonner";

interface ProgramWorkoutRow {
  id: string;
  program_id: string;
  week_number: number;
  day_number: number;
  workout_name: string;
  notes: string | null;
  exercises: ProgramExercise[];
}

const EMPTY_EXERCISE: ProgramExercise = {
  name: "",
  sets: 3,
  reps: "5",
  tempo: "",
  notes: "",
  rest_seconds: 90,
};

function ExerciseRowEditor({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: ProgramExercise;
  onChange: (ex: ProgramExercise) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Exercise name"
          value={exercise.name}
          onChange={e => onChange({ ...exercise, name: e.target.value })}
          className="flex-1 h-8 text-sm"
        />
        <Button variant="ghost" size="sm" onClick={onRemove} className="shrink-0 h-8 w-8 p-0">
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Sets</Label>
          <Input
            type="number"
            placeholder="3"
            value={exercise.sets}
            onChange={e => onChange({ ...exercise, sets: parseInt(e.target.value) || 1 })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Reps</Label>
          <Input
            placeholder="5"
            value={exercise.reps}
            onChange={e => onChange({ ...exercise, reps: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tempo</Label>
          <Input
            placeholder="30X1"
            value={exercise.tempo || ""}
            onChange={e => onChange({ ...exercise, tempo: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Rest (sec)</Label>
          <Input
            type="number"
            placeholder="90"
            value={exercise.rest_seconds || ""}
            onChange={e => onChange({ ...exercise, rest_seconds: parseInt(e.target.value) || 0 })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">% 1RM</Label>
          <Input
            placeholder="e.g. 75"
            value={exercise.percentage_of_1rm || ""}
            onChange={e => onChange({ ...exercise, percentage_of_1rm: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Input
          placeholder="Optional coaching notes"
          value={exercise.notes || ""}
          onChange={e => onChange({ ...exercise, notes: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}

function WorkoutEditor({
  workout,
  onSave,
  onCancel,
}: {
  workout: Partial<ProgramWorkoutRow> & { program_id: string };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(workout.workout_name || "");
  const [week, setWeek] = useState(workout.week_number || 1);
  const [day, setDay] = useState(workout.day_number || 1);
  const [notes, setNotes] = useState(workout.notes || "");
  const [exercises, setExercises] = useState<ProgramExercise[]>(
    workout.exercises || [{ ...EMPTY_EXERCISE }]
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Workout name is required"); return; }
    setIsSaving(true);
    try {
      const row = {
        program_id: workout.program_id,
        workout_name: name.trim(),
        week_number: week,
        day_number: day,
        notes: notes.trim() || null,
        exercises: exercises.filter(e => e.name.trim()) as unknown as import('@/integrations/supabase/types').Json,
      };
      if (workout.id) {
        const { error } = await supabase.from('program_workouts').update(row as any).eq('id', workout.id);
        if (error) throw error;
        toast.success("Workout updated");
      } else {
        const { error } = await supabase.from('program_workouts').insert(row as any);
        if (error) throw error;
        toast.success("Workout created");
      }
      onSave();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <Label>Workout Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Full Body — Strength" />
        </div>
        <div>
          <Label>Week #</Label>
          <Input type="number" min={1} max={24} value={week} onChange={e => setWeek(parseInt(e.target.value) || 1)} />
        </div>
        <div>
          <Label>Day #</Label>
          <Input type="number" min={1} max={7} value={day} onChange={e => setDay(parseInt(e.target.value) || 1)} />
        </div>
      </div>
      <div>
        <Label>Notes (optional)</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes or coach cues" rows={2} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Exercises</Label>
          <Button variant="outline" size="sm" onClick={() => setExercises([...exercises, { ...EMPTY_EXERCISE }])}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Exercise
          </Button>
        </div>
        <div className="space-y-2">
          {exercises.map((ex, i) => (
            <ExerciseRowEditor
              key={i}
              exercise={ex}
              onChange={updated => setExercises(exercises.map((e, idx) => idx === i ? updated : e))}
              onRemove={() => setExercises(exercises.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? "Saving..." : workout.id ? "Update Workout" : "Create Workout"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ProgramEditor({
  program,
  onSave,
  onCancel,
}: {
  program?: Program;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(program?.name || "");
  const [slug, setSlug] = useState(program?.slug || "");
  const [description, setDescription] = useState(program?.description || "");
  const [category, setCategory] = useState(program?.category || "strength");
  const [durationWeeks, setDurationWeeks] = useState(program?.duration_weeks || 12);
  const [daysPerWeek, setDaysPerWeek] = useState(program?.days_per_week || 4);
  const [difficulty, setDifficulty] = useState(program?.difficulty || "intermediate");
  const [programStyle, setProgramStyle] = useState(program?.program_style || "");
  const [isActive, setIsActive] = useState(program?.is_active ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const autoSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) { toast.error("Name and slug are required"); return; }
    setIsSaving(true);
    try {
      const row = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        category,
        duration_weeks: durationWeeks,
        days_per_week: daysPerWeek,
        difficulty,
        program_style: programStyle.trim() || null,
        is_active: isActive,
      };
      if (program?.id) {
        const { error } = await supabase.from('programs').update(row).eq('id', program.id);
        if (error) throw error;
        toast.success("Program updated");
      } else {
        const { error } = await supabase.from('programs').insert(row);
        if (error) throw error;
        toast.success("Program created");
      }
      onSave();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Program Name</Label>
          <Input
            value={name}
            onChange={e => { setName(e.target.value); if (!program?.id) setSlug(autoSlug(e.target.value)); }}
            placeholder="e.g., Wendler 5/3/1"
          />
        </div>
        <div>
          <Label>Slug (URL key)</Label>
          <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="wendler-531" />
        </div>
        <div>
          <Label>Program Style</Label>
          <Input value={programStyle} onChange={e => setProgramStyle(e.target.value)} placeholder="wendler / fbb / oly" />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the program..." />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="conditioning">Conditioning</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="olympic">Olympic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="elite">Elite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Duration (weeks)</Label>
          <Input type="number" min={1} max={52} value={durationWeeks} onChange={e => setDurationWeeks(parseInt(e.target.value) || 12)} />
        </div>
        <div>
          <Label>Days/Week</Label>
          <Input type="number" min={1} max={7} value={daysPerWeek} onChange={e => setDaysPerWeek(parseInt(e.target.value) || 3)} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="is-active">Active (visible to users)</Label>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? "Saving..." : program?.id ? "Update Program" : "Create Program"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ProgramRow({
  program,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  program: Program;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [workouts, setWorkouts] = useState<ProgramWorkoutRow[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<ProgramWorkoutRow | null>(null);
  const [addingWorkout, setAddingWorkout] = useState(false);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);

  const loadWorkouts = async () => {
    if (workouts.length > 0) return;
    setLoadingWorkouts(true);
    const { data } = await supabase
      .from('program_workouts')
      .select('*')
      .eq('program_id', program.id)
      .order('week_number')
      .order('day_number');
    setWorkouts((data || []).map(w => ({ ...w, exercises: Array.isArray(w.exercises) ? w.exercises as unknown as ProgramExercise[] : [] })));
    setLoadingWorkouts(false);
  };

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!expanded) loadWorkouts();
  };

  const handleDeleteWorkout = async () => {
    if (!deletingWorkoutId) return;
    await supabase.from('program_workouts').delete().eq('id', deletingWorkoutId);
    setWorkouts(workouts.filter(w => w.id !== deletingWorkoutId));
    setDeletingWorkoutId(null);
    toast.success("Workout deleted");
  };

  const refreshWorkouts = async () => {
    setWorkouts([]);
    await loadWorkouts();
    setEditingWorkout(null);
    setAddingWorkout(false);
  };

  // Group by week
  const byWeek: Record<number, ProgramWorkoutRow[]> = {};
  for (const w of workouts) {
    if (!byWeek[w.week_number]) byWeek[w.week_number] = [];
    byWeek[w.week_number].push(w);
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-card gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Dumbbell className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{program.name}</span>
              <Badge variant={program.is_active ? "default" : "secondary"} className="text-xs">
                {program.is_active ? "Active" : "Inactive"}
              </Badge>
              {program.program_style && (
                <Badge variant="outline" className="text-xs">{program.program_style}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{program.duration_weeks}w · {program.days_per_week}d/wk · {program.difficulty}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Switch
            checked={program.is_active}
            onCheckedChange={onToggleActive}
            className="scale-75"
          />
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0">
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExpand} className="h-8 w-8 p-0">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-3 bg-muted/10 space-y-3">
          {loadingWorkouts && <p className="text-xs text-muted-foreground">Loading workouts...</p>}

          {/* Add workout button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setAddingWorkout(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Workout Session
          </Button>

          {/* Week groups */}
          {Object.entries(byWeek).sort(([a], [b]) => Number(a) - Number(b)).map(([week, wouts]) => (
            <div key={week}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Week {week}</p>
              <div className="space-y-1.5">
                {wouts.map(w => (
                  <div key={w.id} className="flex items-center justify-between bg-card rounded p-2 border border-border/50 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Day {w.day_number}: {w.workout_name}</p>
                      <p className="text-xs text-muted-foreground">{w.exercises.length} exercises</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setEditingWorkout(w)} className="h-7 w-7 p-0">
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeletingWorkoutId(w.id)} className="h-7 w-7 p-0">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add/Edit workout dialog */}
          <Dialog open={addingWorkout || !!editingWorkout} onOpenChange={open => { if (!open) { setAddingWorkout(false); setEditingWorkout(null); } }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingWorkout ? "Edit Workout" : "Add Workout Session"}</DialogTitle>
              </DialogHeader>
              <WorkoutEditor
                workout={editingWorkout ? { ...editingWorkout, program_id: program.id } : { program_id: program.id }}
                onSave={refreshWorkouts}
                onCancel={() => { setEditingWorkout(null); setAddingWorkout(false); }}
              />
            </DialogContent>
          </Dialog>

          {/* Delete workout confirm */}
          <AlertDialog open={!!deletingWorkoutId} onOpenChange={open => !open && setDeletingWorkoutId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this workout session?</AlertDialogTitle>
                <AlertDialogDescription>This will remove it from the program template. Enrolled users keep their scheduled sessions.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteWorkout} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

export function ProgramAdmin() {
  const { programs, fetchPrograms } = useProgramStore();
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleToggleActive = async (program: Program) => {
    await supabase.from('programs').update({ is_active: !program.is_active }).eq('id', program.id);
    fetchPrograms();
    toast.success(program.is_active ? "Program deactivated" : "Program activated");
  };

  const handleDeleteProgram = async () => {
    if (!deletingProgramId) return;
    await supabase.from('programs').delete().eq('id', deletingProgramId);
    fetchPrograms();
    setDeletingProgramId(null);
    toast.success("Program deleted");
  };

  const onSave = () => {
    fetchPrograms();
    setEditingProgram(null);
    setCreatingProgram(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Programs ({programs.length})</h3>
          <p className="text-xs text-muted-foreground">Create, edit, and manage 12-week training programs</p>
        </div>
        <Button size="sm" onClick={() => setCreatingProgram(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Program
        </Button>
      </div>

      <div className="space-y-2">
        {programs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No programs yet. Create one above.</p>
        )}
        {programs.map(program => (
          <ProgramRow
            key={program.id}
            program={program}
            onEdit={() => setEditingProgram(program)}
            onDelete={() => setDeletingProgramId(program.id)}
            onToggleActive={() => handleToggleActive(program)}
          />
        ))}
      </div>

      {/* Create/Edit program dialog */}
      <Dialog open={creatingProgram || !!editingProgram} onOpenChange={open => { if (!open) { setCreatingProgram(false); setEditingProgram(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProgram ? "Edit Program" : "Create New Program"}</DialogTitle>
          </DialogHeader>
          <ProgramEditor
            program={editingProgram ?? undefined}
            onSave={onSave}
            onCancel={() => { setEditingProgram(null); setCreatingProgram(false); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete program confirm */}
      <AlertDialog open={!!deletingProgramId} onOpenChange={open => !open && setDeletingProgramId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete program?</AlertDialogTitle>
            <AlertDialogDescription>This removes the program and all its workout templates. Enrolled users keep their scheduled calendar workouts.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProgram} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
