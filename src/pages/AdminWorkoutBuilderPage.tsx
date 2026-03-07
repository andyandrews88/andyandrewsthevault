import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChevronLeft, Dumbbell, Plus, Trash2, Check, X, Loader2,
  FileText, Timer, Save, Video, ChevronDown, ChevronUp, RotateCcw,
  MoreVertical, RefreshCw, ArrowRightLeft, Flame, Snowflake, Link, Unlink,
} from "lucide-react";
import { convertWeight, type WeightUnit, getStoredUnit, setStoredUnit } from "@/lib/weightConversion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AdminExerciseMenu } from "@/components/workout/AdminExerciseMenu";
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
  videoUrl: string | null;
  videoExpanded: boolean;
  videoInput: string;
  videoSaving: boolean;
  isTimed: boolean;
  isUnilateral: boolean;
  workout_section: 'warmup' | 'main' | 'cooldown';
  superset_group: string | null;
}

type WorkoutSection = 'warmup' | 'main' | 'cooldown';

const SECTION_CONFIG: { key: WorkoutSection; label: string; icon: any; color: string }[] = [
  { key: 'warmup', label: 'WARM UP', icon: Flame, color: 'text-orange-500' },
  { key: 'main', label: 'EXERCISES', icon: Dumbbell, color: 'text-primary' },
  { key: 'cooldown', label: 'COOL DOWN', icon: Snowflake, color: 'text-blue-400' },
];

async function invokeBuilder(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-workout-builder", { body });
  if (error) throw error;
  return typeof data === "string" ? JSON.parse(data) : data;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
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
  const editWorkoutId = searchParams.get("edit");
  const isEditMode = !!editWorkoutId;

  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [exerciseSearchOpen, setExerciseSearchOpen] = useState(false);
  const [exerciseSearchSection, setExerciseSearchSection] = useState<WorkoutSection>('main');
  const [replaceSearchOpen, setReplaceSearchOpen] = useState(false);
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [savingSetId, setSavingSetId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<WorkoutSection, boolean>>({
    warmup: false, main: false, cooldown: false,
  });

  const toggleSection = (section: WorkoutSection) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const openSearchForSection = (section: WorkoutSection) => {
    setExerciseSearchSection(section);
    setExerciseSearchOpen(true);
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/");
  }, [adminLoading, isAdmin, navigate]);

  // Load or create workout on mount
  useEffect(() => {
    if (!userId || !isAdmin || adminLoading) return;

    const init = async () => {
      try {
        if (isEditMode) {
          const detail = await invokeBuilder({ action: "get_workout_detail", workoutId: editWorkoutId });
          setWorkoutId(editWorkoutId);
          setNotes(detail.workout?.notes || "");
          setIsCompleted(detail.workout?.is_completed || false);

          const loadedExercises: LocalExercise[] = [];
          for (const ex of (detail.exercises || [])) {
            let videoUrl: string | null = null;
            let isTimed = false;
            let isUnilateral = false;
            try {
              const vData = await invokeBuilder({ action: "get_exercise_video", exerciseName: ex.exercise_name });
              videoUrl = vData.video_url || null;
              isTimed = vData.is_timed || false;
              isUnilateral = vData.is_unilateral || false;
            } catch {}
            loadedExercises.push({
              id: ex.id,
              exercise_name: ex.exercise_name,
              exercise_type: ex.exercise_type || "strength",
              notes: ex.notes || "",
              sets: (ex.sets || []).map((s: any) => ({
                id: s.id, set_number: s.set_number, weight: s.weight, reps: s.reps, rir: s.rir || null, is_completed: s.is_completed || false,
              })),
              videoUrl,
              videoExpanded: false,
              videoInput: videoUrl || "",
              videoSaving: false,
              isTimed,
              isUnilateral,
              workout_section: ex.workout_section || 'main',
              superset_group: ex.superset_group || null,
            });
          }
          setExercises(loadedExercises);
        } else {
          const data = await invokeBuilder({
            action: "create_workout", userId, workoutName, date: workoutDate,
          });
          const newWorkoutId = data.id;
          setWorkoutId(newWorkoutId);

          if (cloneFrom && newWorkoutId) {
            setIsCloning(true);
            try {
              const sourceData = await invokeBuilder({ action: "get_workout_detail", workoutId: cloneFrom });
              const sourceExercises = sourceData.exercises || [];
              for (let i = 0; i < sourceExercises.length; i++) {
                const srcEx = sourceExercises[i];
                const exData = await invokeBuilder({
                  action: "add_exercise", workoutId: newWorkoutId,
                  exerciseName: srcEx.exercise_name, orderIndex: i,
                  exerciseType: srcEx.exercise_type || "strength",
                  workoutSection: srcEx.workout_section || "main",
                });
                const newSets: LocalSet[] = [];
                const srcSets = srcEx.sets || [];
                if (srcSets.length > 0 && exData.sets?.length > 0) {
                  const firstSet = exData.sets[0];
                  await invokeBuilder({
                    action: "update_set", setId: firstSet.id,
                    weight: srcSets[0].weight, reps: srcSets[0].reps, rir: srcSets[0].rir, isCompleted: false,
                  });
                  newSets.push({ id: firstSet.id, set_number: 1, weight: srcSets[0].weight, reps: srcSets[0].reps, rir: srcSets[0].rir || null, is_completed: false });
                }
                for (let j = 1; j < srcSets.length; j++) {
                  const setData = await invokeBuilder({
                    action: "add_set", exerciseId: exData.id, setNumber: j + 1,
                    weight: srcSets[j].weight, reps: srcSets[j].reps,
                  });
                  if (srcSets[j].rir != null) {
                    await invokeBuilder({
                      action: "update_set", setId: setData.id,
                      weight: srcSets[j].weight, reps: srcSets[j].reps, rir: srcSets[j].rir, isCompleted: false,
                    });
                  }
                  newSets.push({ id: setData.id, set_number: j + 1, weight: srcSets[j].weight, reps: srcSets[j].reps, rir: srcSets[j].rir || null, is_completed: false });
                }
                if (srcSets.length === 0 && exData.sets?.length > 0) {
                  newSets.push({ id: exData.sets[0].id, set_number: 1, weight: null, reps: null, rir: null, is_completed: false });
                }
                setExercises(prev => [...prev, {
                  id: exData.id, exercise_name: exData.exercise_name,
                  exercise_type: exData.exercise_type || "strength", notes: srcEx.notes || "",
                  sets: newSets, videoUrl: null, videoExpanded: false, videoInput: "", videoSaving: false,
                  isTimed: false, isUnilateral: false,
                  workout_section: srcEx.workout_section || 'main',
                  superset_group: null,
                }]);
              }
              toast({ title: "Workout cloned", description: `${sourceExercises.length} exercises loaded` });
            } catch (cloneErr: any) {
              toast({ title: "Clone partially failed", description: cloneErr.message, variant: "destructive" });
            } finally {
              setIsCloning(false);
            }
          }
        }
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
        navigate(`/admin/user/${userId}`);
      } finally {
        setIsCreating(false);
      }
    };
    init();
  }, [userId, isAdmin, adminLoading]);

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
    const sectionExercises = exercises.filter(e => e.workout_section === exerciseSearchSection);
    try {
      const data = await invokeBuilder({
        action: "add_exercise", workoutId, exerciseName: name,
        orderIndex: exercises.length, exerciseType: type,
        workoutSection: exerciseSearchSection,
      });
      let videoUrl: string | null = null;
      let isTimed = false;
      let isUnilateral = false;
      try {
        const vData = await invokeBuilder({ action: "get_exercise_video", exerciseName: name });
        videoUrl = vData.video_url || null;
        isTimed = vData.is_timed || false;
        isUnilateral = vData.is_unilateral || false;
      } catch {}
      setExercises(prev => [...prev, {
        id: data.id, exercise_name: data.exercise_name,
        exercise_type: data.exercise_type || "strength", notes: "",
        sets: (data.sets || []).map((s: any) => ({
          id: s.id, set_number: s.set_number, weight: s.weight, reps: s.reps, rir: s.rir || null, is_completed: s.is_completed || false,
        })),
        videoUrl, videoExpanded: false, videoInput: videoUrl || "", videoSaving: false,
        isTimed, isUnilateral,
        workout_section: exerciseSearchSection,
        superset_group: null,
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
        ...e, sets: e.sets.filter(s => s.id !== setId).map((s, i) => ({ ...s, set_number: i + 1 })),
      })));
    } catch {}
  };

  const handleUpdateSet = useCallback((setId: string, field: "weight" | "reps" | "rir", value: number | null) => {
    setExercises(prev => prev.map(e => ({
      ...e, sets: e.sets.map(s => s.id === setId ? { ...s, [field]: value } : s),
    })));
  }, []);

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
        weight: target.weight, reps: target.reps, rir: target.rir, isCompleted: target.is_completed,
      });
    } catch {} finally { setSavingSetId(null); }
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
      ...e, sets: e.sets.map(s => s.id === setId ? { ...s, is_completed: newCompleted } : s),
    })));
    try {
      await invokeBuilder({
        action: "update_set", setId,
        weight: target.weight, reps: target.reps, rir: target.rir, isCompleted: newCompleted,
      });
    } catch {}
  }, [exercises]);

  const handleUpdateExerciseNotes = (exerciseId: string, value: string) => {
    setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, notes: value } : e));
  };

  const handleSaveExerciseNotes = async (exerciseId: string) => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    try { await invokeBuilder({ action: "update_exercise_notes", exerciseId, notes: ex.notes }); } catch {}
  };

  const toggleVideoExpanded = (exerciseId: string) => {
    setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, videoExpanded: !e.videoExpanded } : e));
  };

  const handleVideoInputChange = (exerciseId: string, value: string) => {
    setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, videoInput: value } : e));
  };

  const handleSaveVideo = async (exerciseId: string) => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, videoSaving: true } : e));
    try {
      await invokeBuilder({ action: "upsert_exercise_video", exerciseName: ex.exercise_name, videoUrl: ex.videoInput.trim() });
      setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, videoUrl: ex.videoInput.trim(), videoSaving: false } : e));
      toast({ title: "Video saved", description: `Video URL saved for ${ex.exercise_name}` });
    } catch (e: any) {
      toast({ title: "Error saving video", description: e.message, variant: "destructive" });
      setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, videoSaving: false } : e));
    }
  };

  const handleReopenWorkout = async () => {
    if (!workoutId) return;
    try {
      await invokeBuilder({ action: "reopen_workout", workoutId });
      setIsCompleted(false);
      toast({ title: "Workout reopened", description: "This workout is now marked as in progress" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleFinish = async () => {
    if (!workoutId) return;
    setIsSaving(true);
    try {
      if (notes.trim()) {
        await invokeBuilder({ action: "update_notes", workoutId, notes: notes.trim() });
      }
      for (const ex of exercises) {
        if (ex.notes.trim()) {
          await invokeBuilder({ action: "update_exercise_notes", exerciseId: ex.id, notes: ex.notes.trim() });
        }
      }
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
    navigate(`/admin/user/${userId}`);
  };

  const handleLoadLastSession = async (exerciseId: string, exerciseName: string) => {
    try {
      const workouts = await invokeBuilder({ action: "get_user_workouts", userId, limit: 50 });
      let lastSets: any[] = [];
      for (const w of (workouts || [])) {
        const detail = await invokeBuilder({ action: "get_workout_detail", workoutId: w.id });
        const matchEx = (detail.exercises || []).find((e: any) => e.exercise_name.toLowerCase() === exerciseName.toLowerCase());
        if (matchEx && matchEx.sets?.length > 0) {
          lastSets = matchEx.sets;
          break;
        }
      }
      if (lastSets.length === 0) {
        toast({ title: "No previous data", description: `No past sessions found for ${exerciseName}` });
        return;
      }
      const ex = exercises.find(e => e.id === exerciseId);
      if (!ex) return;
      for (let i = 0; i < lastSets.length; i++) {
        if (i < ex.sets.length) {
          await invokeBuilder({ action: "update_set", setId: ex.sets[i].id, weight: lastSets[i].weight, reps: lastSets[i].reps, rir: lastSets[i].rir, isCompleted: false });
        } else {
          await invokeBuilder({ action: "add_set", exerciseId, setNumber: i + 1, weight: lastSets[i].weight, reps: lastSets[i].reps });
        }
      }
      const detail = await invokeBuilder({ action: "get_workout_detail", workoutId: workoutId! });
      const updatedEx = (detail.exercises || []).find((e: any) => e.id === exerciseId);
      if (updatedEx) {
        setExercises(prev => prev.map(e => e.id === exerciseId ? {
          ...e, sets: (updatedEx.sets || []).map((s: any) => ({ id: s.id, set_number: s.set_number, weight: s.weight, reps: s.reps, rir: s.rir || null, is_completed: s.is_completed || false }))
        } : e));
      }
      toast({ title: "Last session loaded", description: `Loaded ${lastSets.length} sets for ${exerciseName}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleMetadataChange = (exerciseId: string, field: string, value: any) => {
    setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, [field]: value } : e));
  };

  const handleReplaceExercise = async (newName: string) => {
    if (!replacingExerciseId) return;
    try {
      await invokeBuilder({ action: "replace_exercise", exerciseId: replacingExerciseId, newExerciseName: newName });
      let videoUrl: string | null = null;
      let isTimed = false;
      let isUnilateral = false;
      try { const v = await invokeBuilder({ action: "get_exercise_video", exerciseName: newName }); videoUrl = v.video_url || null; isTimed = v.is_timed || false; isUnilateral = v.is_unilateral || false; } catch {}
      setExercises(prev => prev.map(e => e.id === replacingExerciseId ? { ...e, exercise_name: newName, videoUrl, videoInput: videoUrl || "", isTimed, isUnilateral } : e));
      toast({ title: "Exercise replaced", description: `Swapped to ${newName}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setReplacingExerciseId(null);
      setReplaceSearchOpen(false);
    }
  };

  const handleLinkSuperset = async (exerciseIdA: string, exerciseIdB: string) => {
    try {
      const result = await invokeBuilder({ action: "link_superset", exerciseIdA, exerciseIdB });
      const groupId = result.superset_group;
      setExercises(prev => prev.map(e =>
        e.id === exerciseIdA || e.id === exerciseIdB
          ? { ...e, superset_group: groupId }
          : e
      ));
      toast({ title: "Superset linked" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleUnlinkSuperset = async (exerciseId: string) => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex?.superset_group) return;
    const groupId = ex.superset_group;
    try {
      await invokeBuilder({ action: "unlink_superset", exerciseId });
      // Count members in group
      const groupMembers = exercises.filter(e => e.superset_group === groupId);
      if (groupMembers.length <= 2) {
        // Both get unlinked
        setExercises(prev => prev.map(e =>
          e.superset_group === groupId ? { ...e, superset_group: null } : e
        ));
      } else {
        setExercises(prev => prev.map(e =>
          e.id === exerciseId ? { ...e, superset_group: null } : e
        ));
      }
      toast({ title: "Superset unlinked" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // Helper to render an exercise card (reused across sections)
  const renderExerciseCard = (exercise: LocalExercise) => {
    const exCompleted = exercise.sets.filter(s => s.is_completed).length;
    const embedUrl = exercise.videoUrl ? getEmbedUrl(exercise.videoUrl) : null;
    const isSupersetted = !!exercise.superset_group;
    const linkableExercises = exercises.filter(e =>
      e.id !== exercise.id &&
      e.workout_section === exercise.workout_section &&
      (!exercise.superset_group || e.superset_group !== exercise.superset_group)
    );
    return (
      <Card key={exercise.id} className={`overflow-hidden border-border/50 ${isSupersetted ? 'border-l-4 border-l-primary' : ''}`}>
        <CardHeader className="py-3 px-4 bg-secondary/30 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm uppercase tracking-wider text-foreground flex items-center gap-1.5">
                {exercise.exercise_name}
                {isSupersetted && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30">
                    SS
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {exCompleted}/{exercise.sets.length} sets
                </span>
                {exercise.exercise_type === "conditioning" && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                    <Timer className="h-2.5 w-2.5 mr-0.5" />Conditioning
                  </Badge>
                )}
                {exercise.isTimed && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-accent text-accent-foreground">
                    <Timer className="h-2.5 w-2.5 mr-0.5" />Timed
                  </Badge>
                )}
                {exercise.isUnilateral && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-accent text-accent-foreground">
                    L/R
                  </Badge>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => toggleVideoExpanded(exercise.id)}>
                  <Video className={`h-4 w-4 mr-2 ${exercise.videoUrl ? 'text-primary' : ''}`} />
                  {exercise.videoExpanded ? 'Hide Video' : 'Show Video'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLoadLastSession(exercise.id, exercise.exercise_name)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load Last Session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReplacingExerciseId(exercise.id); setReplaceSearchOpen(true); }}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Replace Exercise
                </DropdownMenuItem>
                {linkableExercises.length > 0 && !isSupersetted && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Link className="h-4 w-4 mr-2" />
                      Link Superset
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {linkableExercises.map(e => (
                        <DropdownMenuItem key={e.id} onClick={() => handleLinkSuperset(exercise.id, e.id)}>
                          {e.exercise_name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                {isSupersetted && (
                  <DropdownMenuItem onClick={() => handleUnlinkSuperset(exercise.id)}>
                    <Unlink className="h-4 w-4 mr-2" />
                    Unlink Superset
                  </DropdownMenuItem>
                )}
                <AdminExerciseMenu exerciseName={exercise.exercise_name} isAdmin={true} onMetadataChange={(field, value) => handleMetadataChange(exercise.id, field, value)} />
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveExercise(exercise.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Exercise
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {exercise.videoExpanded && (
            <div className="p-3 border-b border-border/30 bg-muted/20 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Paste YouTube or Vimeo URL..."
                  value={exercise.videoInput}
                  onChange={(e) => handleVideoInputChange(exercise.id, e.target.value)}
                  className="flex-1 h-9 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => handleSaveVideo(exercise.id)}
                  disabled={exercise.videoSaving || !exercise.videoInput.trim()}
                  className="h-9"
                >
                  {exercise.videoSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {embedUrl && (
                <div className="aspect-video rounded-md overflow-hidden bg-black">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px_36px] gap-1.5 items-center py-2.5 px-4 border-b border-border/50 bg-muted/30">
            <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">Set</span>
            <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">{exercise.isTimed ? "+Load" : "Kg"}</span>
            <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">{exercise.isTimed ? "Sec" : "Reps"}</span>
            <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">RIR</span>
            <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase">Done</span>
            <span></span>
          </div>

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
                  type="number" inputMode="decimal" placeholder="—"
                  value={s.weight ?? ""}
                  onChange={(e) => handleUpdateSet(s.id, "weight", e.target.value ? Number(e.target.value) : null)}
                  onBlur={() => handleSaveSet(s.id)}
                  className="h-10 text-center text-sm font-mono border-border/50 bg-secondary/20"
                />
                <Input
                  type="number" inputMode="numeric" placeholder={exercise.isTimed ? "sec" : "—"}
                  value={s.reps ?? ""}
                  onChange={(e) => handleUpdateSet(s.id, "reps", e.target.value ? Number(e.target.value) : null)}
                  onBlur={() => handleSaveSet(s.id)}
                  className="h-10 text-center text-sm font-mono border-border/50 bg-secondary/20"
                />
                <Input
                  type="number" inputMode="numeric" placeholder="—"
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
                  variant="ghost" size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveSet(s.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="p-3 space-y-2 border-t border-border/30">
            <Button
              variant="outline" size="sm"
              onClick={() => handleAddSet(exercise.id)}
              className="w-full gap-2 border-dashed border-border/50"
            >
              <Plus className="h-3.5 w-3.5" />Add Set
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
  };

  if (adminLoading || isCreating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{isCloning ? "Cloning workout..." : isEditMode ? "Loading workout..." : "Setting up workout..."}</p>
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
                  {isEditMode ? "Editing" : "Building"}: {workoutName}
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  for <span className="text-primary font-medium">{displayName}</span> · {format(new Date(workoutDate + "T12:00:00"), "MMMM d, yyyy")}
                  {isEditMode && isCompleted && <Badge variant="secondary" className="ml-2 text-[10px] bg-green-600/80">Completed</Badge>}
                  {isEditMode && !isCompleted && <Badge variant="secondary" className="ml-2 text-[10px] bg-amber-500/80">In Progress</Badge>}
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
              {isEditMode && isCompleted && (
                <Button variant="outline" size="sm" onClick={handleReopenWorkout} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />Reopen
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCancel}>Back</Button>
              <Button size="sm" onClick={handleFinish} disabled={isSaving || exercises.length === 0} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditMode ? "Save" : "Finish"}
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

        {/* Section-based Exercise Layout */}
        {SECTION_CONFIG.map(({ key, label, icon: Icon, color }) => {
          const sectionExercises = exercises.filter(e => e.workout_section === key);
          const isOpen = !collapsedSections[key];

          return (
            <Collapsible key={key} open={isOpen} onOpenChange={() => toggleSection(key)}>
              <div className="flex items-center justify-between py-2">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    <Icon className={`h-4 w-4 ${color}`} />
                    {label}
                    {sectionExercises.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">
                        {sectionExercises.length}
                      </Badge>
                    )}
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-primary"
                  onClick={() => openSearchForSection(key)}
                  disabled={addingExercise}
                >
                  <Plus className="h-3 w-3" />Add
                </Button>
              </div>
              <CollapsibleContent className="space-y-3">
                {sectionExercises.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-border/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">No {label.toLowerCase()} exercises</p>
                  </div>
                ) : (
                  sectionExercises.map(exercise => renderExerciseCard(exercise))
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Empty State */}
        {exercises.length === 0 && !addingExercise && (
          <div className="text-center py-12 space-y-3">
            <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No exercises yet</p>
            <p className="text-xs text-muted-foreground/60">Click "Add" in any section to start building this workout</p>
          </div>
        )}

        {/* Workout Notes */}
        {exercises.length > 0 && (
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />Session Notes
              </label>
              <Textarea
                placeholder="Overall session notes, coaching feedback, adjustments for next time..."
                value={notes} onChange={(e) => setNotes(e.target.value)}
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
            <Button onClick={handleFinish} disabled={isSaving} className="w-full h-12 gap-2 text-base" variant="hero">
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {isEditMode ? "Save Changes" : "Save & Finish Workout"}
            </Button>
          </div>
        )}
      </main>

      <ExerciseSearch
        open={exerciseSearchOpen}
        onOpenChange={setExerciseSearchOpen}
        onSelectExercise={handleAddExercise}
        recentExercises={exercises.map(e => e.exercise_name)}
        section={exerciseSearchSection}
      />

      <ExerciseSearch
        open={replaceSearchOpen}
        onOpenChange={(open) => { setReplaceSearchOpen(open); if (!open) setReplacingExerciseId(null); }}
        onSelectExercise={handleReplaceExercise}
        recentExercises={exercises.map(e => e.exercise_name)}
      />
    </div>
  );
}
