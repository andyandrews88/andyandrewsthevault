import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Search, Video, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export interface ExerciseLibraryEntry {
  id: string;
  name: string;
  category: string;
  muscle_group: string | null;
  video_url: string | null;
  notes: string | null;
  movement_pattern: string | null;
  equipment_type: string | null;
  created_at: string;
  updated_at: string;
  status?: string;
  submitted_by?: string | null;
}

const CATEGORIES = ["strength", "conditioning", "olympic", "functional"] as const;

const MOVEMENT_PATTERNS = ['hinge', 'squat', 'push', 'pull', 'single_leg', 'core', 'carry', 'olympic', 'isolation'] as const;
const EQUIPMENT_TYPES = ['barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'sandbag', 'bodyweight', 'other'] as const;
const PATTERN_LABELS: Record<string, string> = { hinge: 'Hinge', squat: 'Squat', push: 'Push', pull: 'Pull', single_leg: 'Single Leg', core: 'Core', carry: 'Carry', olympic: 'Olympic', isolation: 'Isolation' };
const EQUIP_LABELS: Record<string, string> = { barbell: 'Barbell', dumbbell: 'Dumbbell', kettlebell: 'Kettlebell', machine: 'Machine', cable: 'Cable', sandbag: 'Sandbag', bodyweight: 'Bodyweight', other: 'Other' };

const EMPTY_FORM = {
  name: "",
  category: "strength",
  muscle_group: "",
  video_url: "",
  notes: "",
  movement_pattern: "",
  equipment_type: "",
};

function ExerciseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<typeof EMPTY_FORM>;
  onSave: (data: typeof EMPTY_FORM) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Exercise name is required"); return; }
    setIsSaving(true);
    try { await onSave(form); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Exercise Name *</Label>
        <Input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g., Back Squat"
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Muscle Group</Label>
          <Input
            value={form.muscle_group}
            onChange={e => setForm(f => ({ ...f, muscle_group: e.target.value }))}
            placeholder="e.g., Quads, Glutes"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label>Video URL</Label>
        <Input
          value={form.video_url}
          onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
          placeholder="https://youtube.com/watch?v=..."
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Movement Pattern</Label>
          <Select value={form.movement_pattern || "none"} onValueChange={v => setForm(f => ({ ...f, movement_pattern: v === "none" ? "" : v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {MOVEMENT_PATTERNS.map(p => (
                <SelectItem key={p} value={p}>{PATTERN_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Equipment Type</Label>
          <Select value={form.equipment_type || "none"} onValueChange={v => setForm(f => ({ ...f, equipment_type: v === "none" ? "" : v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {EQUIPMENT_TYPES.map(e => (
                <SelectItem key={e} value={e}>{EQUIP_LABELS[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Coaching Notes</Label>
        <Textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Optional cues or instructions..."
          rows={2}
          className="mt-1"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
          {isSaving ? "Saving..." : "Save Exercise"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function ExerciseLibraryAdmin() {
  const [exercises, setExercises] = useState<ExerciseLibraryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseLibraryEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadExercises = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('exercise_library')
      .select('*')
      .order('name');
    if (!error && data) setExercises(data as unknown as ExerciseLibraryEntry[]);
    setIsLoading(false);
  };

  useEffect(() => { loadExercises(); }, []);

  const pendingCount = exercises.filter(e => e.status === 'pending').length;

  const handleSave = async (form: typeof EMPTY_FORM) => {
    const row = {
      name: form.name.trim(),
      category: form.category,
      muscle_group: form.muscle_group.trim() || null,
      video_url: form.video_url.trim() || null,
      notes: form.notes.trim() || null,
      movement_pattern: form.movement_pattern.trim() || null,
      equipment_type: form.equipment_type.trim() || null,
    };
    if (editingExercise) {
      const { error } = await supabase.from('exercise_library').update(row).eq('id', editingExercise.id);
      if (error) { toast.error(error.message); throw error; }
      toast.success("Exercise updated");
    } else {
      const { error } = await supabase.from('exercise_library').insert(row);
      if (error) { toast.error(error.message); throw error; }
      toast.success("Exercise added to library");
    }
    setShowForm(false);
    setEditingExercise(null);
    loadExercises();
  };

  const handleApprove = async (ex: ExerciseLibraryEntry) => {
    const { error } = await supabase
      .from('exercise_library')
      .update({ status: 'approved' } as any)
      .eq('id', ex.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ex.name} approved`);
    loadExercises();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from('exercise_library').delete().eq('id', deletingId);
    if (error) { toast.error(error.message); return; }
    toast.success("Exercise deleted");
    setDeletingId(null);
    loadExercises();
  };

  const openEdit = (ex: ExerciseLibraryEntry) => {
    setEditingExercise(ex);
    setShowForm(true);
  };

  const openAdd = () => {
    setEditingExercise(null);
    setShowForm(true);
  };

  const filtered = exercises
    .filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
        (ex.muscle_group || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || ex.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || ex.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      // Pending exercises always first
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return a.name.localeCompare(b.name);
    });

  const categoryCount = (cat: string) => exercises.filter(e => e.category === cat).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">{exercises.length} exercises in library</span>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Exercise
        </Button>
      </div>

      {/* Status filter pills */}
      {pendingCount > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === "pending"
                ? "bg-yellow-500 text-yellow-950"
                : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === "approved"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Approved
          </button>
        </div>
      )}

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            categoryFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All ({exercises.length})
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              categoryFilter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat} ({categoryCount(cat)})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            {exercises.length === 0 ? "No exercises yet. Add your first exercise!" : "No exercises match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map(ex => (
            <div
              key={ex.id}
              className={`flex items-center justify-between p-3 rounded-md border transition-colors gap-3 ${
                ex.status === 'pending'
                  ? 'border-yellow-500/30 bg-yellow-500/5'
                  : 'border-border bg-card hover:bg-accent/5'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{ex.name}</span>
                  {ex.status === 'pending' && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Pending
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">{ex.category}</Badge>
                  {ex.movement_pattern && (
                    <Badge variant="secondary" className="text-[10px] capitalize">{PATTERN_LABELS[ex.movement_pattern] || ex.movement_pattern}</Badge>
                  )}
                  {ex.equipment_type && ex.equipment_type !== 'other' && (
                    <Badge variant="secondary" className="text-[10px] capitalize">{EQUIP_LABELS[ex.equipment_type] || ex.equipment_type}</Badge>
                  )}
                  {ex.muscle_group && (
                    <span className="text-xs text-muted-foreground">{ex.muscle_group}</span>
                  )}
                  {ex.video_url && (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <Video className="w-3 h-3" /> Video
                    </span>
                  )}
                </div>
                {ex.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{ex.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {ex.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-green-400 hover:text-green-300"
                    onClick={() => handleApprove(ex)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(ex)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeletingId(ex.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditingExercise(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExercise ? "Edit Exercise" : "Add Exercise to Library"}</DialogTitle>
          </DialogHeader>
          <ExerciseForm
            initial={editingExercise ? {
              name: editingExercise.name,
              category: editingExercise.category,
              muscle_group: editingExercise.muscle_group || "",
              video_url: editingExercise.video_url || "",
              notes: editingExercise.notes || "",
              movement_pattern: editingExercise.movement_pattern || "",
              equipment_type: editingExercise.equipment_type || "",
            } : undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingExercise(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={open => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove it from the library. Existing workouts that reference this exercise by name are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
