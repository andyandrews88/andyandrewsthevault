import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, GripVertical, Dumbbell, Video, Link, Maximize2, Minimize2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ExerciseLibraryEntry } from "./ExerciseLibraryAdmin";

// ─── Shared hook: fetch exercise library ──────────────────────────────────────
function useExerciseLibrary() {
  const [library, setLibrary] = useState<ExerciseLibraryEntry[]>([]);
  useEffect(() => {
    supabase
      .from('exercise_library' as any)
      .select('*')
      .order('name')
      .then(({ data }) => { if (data) setLibrary(data as unknown as ExerciseLibraryEntry[]); });
  }, []);
  return library;
}

// ─── Types ────────────────────────────────────────────────────────────────────
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
  video_url: "",
};

// ─── ExerciseComboBox ─────────────────────────────────────────────────────────
function ExerciseComboBox({
  value,
  onChange,
  library,
}: {
  value: string;
  onChange: (name: string, videoUrl?: string) => void;
  library: ExerciseLibraryEntry[];
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync when value changes externally
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim().length > 0
    ? library.filter(ex => ex.name.toLowerCase().includes(query.toLowerCase()))
    : library;

  const handleSelect = (ex: ExerciseLibraryEntry) => {
    onChange(ex.name, ex.video_url || undefined);
    setQuery(ex.name);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleBlur = () => {
    // Short delay so click on dropdown item registers first
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={ref} className="relative flex-1">
      <Input
        placeholder="Search library or type name..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        className="h-8 text-sm"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.slice(0, 20).map(ex => (
            <button
              key={ex.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 flex items-center justify-between gap-2"
              onMouseDown={() => handleSelect(ex)}
            >
              <div className="min-w-0">
                <span className="font-medium">{ex.name}</span>
                {ex.muscle_group && (
                  <span className="text-xs text-muted-foreground ml-2">{ex.muscle_group}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground capitalize">{ex.category}</span>
                {ex.video_url && <Video className="w-3 h-3 text-primary" />}
              </div>
            </button>
          ))}
          {query.trim() && !filtered.find(ex => ex.name.toLowerCase() === query.toLowerCase()) && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 text-muted-foreground"
              onMouseDown={() => { onChange(query); setOpen(false); }}
            >
              + Use "<span className="text-foreground font-medium">{query}</span>" as custom name
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ExerciseRowEditor ────────────────────────────────────────────────────────
function ExerciseRowEditor({
  exercise,
  onChange,
  onRemove,
  library,
}: {
  exercise: ProgramExercise;
  onChange: (ex: ProgramExercise) => void;
  onRemove: () => void;
  library: ExerciseLibraryEntry[];
}) {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="border border-border rounded-md p-3 space-y-2 bg-muted/20">
      {/* Desktop: single-row layout like CoachRx */}
      <div className="hidden lg:flex items-end gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mb-2" />
        <div className="flex-[2] min-w-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Exercise</Label>
          <ExerciseComboBox
            value={exercise.name}
            library={library}
            onChange={(name, videoUrl) => onChange({
              ...exercise,
              name,
              ...(videoUrl !== undefined ? { video_url: videoUrl } : {}),
            })}
          />
        </div>
        <div className="w-16">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Sets</Label>
          <Input
            type="number"
            placeholder="3"
            value={exercise.sets}
            onChange={e => onChange({ ...exercise, sets: parseInt(e.target.value) || 1 })}
            className="h-8 text-sm"
          />
        </div>
        <div className="w-16">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Reps</Label>
          <Input
            placeholder="5"
            value={exercise.reps}
            onChange={e => onChange({ ...exercise, reps: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="w-16">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Tempo</Label>
          <Input
            placeholder="30X1"
            value={exercise.tempo || ""}
            onChange={e => onChange({ ...exercise, tempo: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="w-16">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Rest</Label>
          <Input
            type="number"
            placeholder="90"
            value={exercise.rest_seconds || ""}
            onChange={e => onChange({ ...exercise, rest_seconds: parseInt(e.target.value) || 0 })}
            className="h-8 text-sm"
          />
        </div>
        <div className="w-16">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">%1RM</Label>
          <Input
            placeholder="75"
            value={exercise.percentage_of_1rm || ""}
            onChange={e => onChange({ ...exercise, percentage_of_1rm: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[80px]">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Notes</Label>
          <Input
            placeholder="Coaching cues..."
            value={exercise.notes || ""}
            onChange={e => onChange({ ...exercise, notes: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="shrink-0 h-8 w-8 p-0 mb-0">
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>

      {/* Mobile: stacked layout */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
          <ExerciseComboBox
            value={exercise.name}
            library={library}
            onChange={(name, videoUrl) => onChange({
              ...exercise,
              name,
              ...(videoUrl !== undefined ? { video_url: videoUrl } : {}),
            })}
          />
          <Button variant="ghost" size="sm" onClick={onRemove} className="shrink-0 h-8 w-8 p-0">
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Sets</Label>
            <Input type="number" placeholder="3" value={exercise.sets} onChange={e => onChange({ ...exercise, sets: parseInt(e.target.value) || 1 })} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Reps</Label>
            <Input placeholder="5" value={exercise.reps} onChange={e => onChange({ ...exercise, reps: e.target.value })} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tempo</Label>
            <Input placeholder="30X1" value={exercise.tempo || ""} onChange={e => onChange({ ...exercise, tempo: e.target.value })} className="h-8 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Rest (sec)</Label>
            <Input type="number" placeholder="90" value={exercise.rest_seconds || ""} onChange={e => onChange({ ...exercise, rest_seconds: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">% 1RM</Label>
            <Input placeholder="75" value={exercise.percentage_of_1rm || ""} onChange={e => onChange({ ...exercise, percentage_of_1rm: e.target.value })} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Input placeholder="Cues..." value={exercise.notes || ""} onChange={e => onChange({ ...exercise, notes: e.target.value })} className="h-8 text-sm" />
          </div>
        </div>
      </div>

      {/* Collapsible video URL */}
      <Collapsible open={videoOpen} onOpenChange={setVideoOpen}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Video className="w-3 h-3" />
            {exercise.video_url ? "Video linked" : "Add video"}
            <ChevronDown className={`w-3 h-3 transition-transform ${videoOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1">
          <Input
            placeholder="https://youtube.com/... (auto-filled from library)"
            value={exercise.video_url || ""}
            onChange={e => onChange({ ...exercise, video_url: e.target.value })}
            className="h-8 text-sm"
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ─── WorkoutEditor ────────────────────────────────────────────────────────────
function WorkoutEditor({
  workout,
  onSave,
  onCancel,
  isMaximized,
}: {
  workout: Partial<ProgramWorkoutRow> & { program_id: string };
  onSave: () => void;
  onCancel: () => void;
  isMaximized?: boolean;
}) {
  const library = useExerciseLibrary();
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
              library={library}
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

// ─── ProgramEditor ────────────────────────────────────────────────────────────
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
  const [longDescription, setLongDescription] = useState((program as any)?.long_description || "");
  const [videoUrl, setVideoUrl] = useState(program?.video_url || "");
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
        long_description: longDescription.trim(),
        video_url: videoUrl.trim() || null,
        category,
        duration_weeks: durationWeeks,
        days_per_week: daysPerWeek,
        difficulty,
        program_style: programStyle.trim() || null,
        is_active: isActive,
      };
      if (program?.id) {
        const { error } = await supabase.from('programs').update(row as any).eq('id', program.id);
        if (error) throw error;
        toast.success("Program updated");
      } else {
        const { error } = await supabase.from('programs').insert(row as any);
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
        <Label>Description (card blurb)</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Short description shown on the program card..." />
      </div>
      <div>
        <Label>Landing Page Description</Label>
        <Textarea value={longDescription} onChange={e => setLongDescription(e.target.value)} rows={5} placeholder="Full description for the program landing page — explain what users can expect..." />
        <p className="text-xs text-muted-foreground mt-1">Detailed description shown on the dedicated landing page.</p>
      </div>
      {/* Program video URL */}
      <div>
        <Label className="flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-muted-foreground" />
          Program Overview Video URL
        </Label>
        <Input
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=... (optional)"
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">Paste any YouTube or Vimeo link — shown to users as a "Watch Overview" button.</p>
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

// ─── ProgramRow ───────────────────────────────────────────────────────────────
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
  const [isMaximized, setIsMaximized] = useState(false);
  const isMobile = useIsMobile();

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
              {program.video_url && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Video className="w-3 h-3" /> Video
                </span>
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
                      <p className="text-xs text-muted-foreground">
                        {w.exercises.length} exercises
                        {w.exercises.some(e => e.video_url) && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-primary">
                            <Video className="w-3 h-3" /> videos
                          </span>
                        )}
                      </p>
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
          <Dialog open={addingWorkout || !!editingWorkout} onOpenChange={open => { if (!open) { setAddingWorkout(false); setEditingWorkout(null); setIsMaximized(false); } }}>
            <DialogContent className={`max-h-[90vh] overflow-y-auto transition-all duration-200 ${
              isMaximized && !isMobile
                ? "max-w-[95vw] h-[90vh]"
                : "sm:max-w-2xl lg:max-w-4xl"
            }`}>
              <DialogHeader className="flex flex-row items-center justify-between pr-8">
                <DialogTitle>{editingWorkout ? "Edit Workout" : "Add Workout Session"}</DialogTitle>
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setIsMaximized(!isMaximized)}
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                )}
              </DialogHeader>
              <WorkoutEditor
                workout={editingWorkout ? { ...editingWorkout, program_id: program.id } : { program_id: program.id }}
                onSave={refreshWorkouts}
                onCancel={() => { setEditingWorkout(null); setAddingWorkout(false); setIsMaximized(false); }}
                isMaximized={isMaximized}
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

// ─── ProgramAdmin (main export) ───────────────────────────────────────────────
export function ProgramAdmin() {
  const { fetchPrograms } = useProgramStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);

  // Admin fetches ALL programs (active + inactive) — store only fetches active ones
  const loadAllPrograms = async () => {
    const { data } = await supabase.from('programs').select('*').order('created_at');
    if (data) setPrograms(data as Program[]);
  };

  useEffect(() => {
    loadAllPrograms();
  }, []);

  const handleToggleActive = async (program: Program) => {
    await supabase.from('programs').update({ is_active: !program.is_active } as any).eq('id', program.id);
    loadAllPrograms();
    // Also refresh the user-facing store so the Tracks library updates
    fetchPrograms();
    toast.success(program.is_active ? "Program deactivated" : "Program activated");
  };

  const handleDeleteProgram = async () => {
    if (!deletingProgramId) return;
    await supabase.from('programs').delete().eq('id', deletingProgramId);
    loadAllPrograms();
    fetchPrograms();
    setDeletingProgramId(null);
    toast.success("Program deleted");
  };

  const onSave = () => {
    loadAllPrograms();
    fetchPrograms();
    setEditingProgram(null);
    setCreatingProgram(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Programs ({programs.length})</h3>
          <p className="text-xs text-muted-foreground">Create, edit, and manage training programs</p>
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
