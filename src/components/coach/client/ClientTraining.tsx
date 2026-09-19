import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronDown, ClipboardList, Loader2, Pencil } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ServiceTier } from "@/lib/entitlements";
import { VolumeAnalytics } from "@/components/train/VolumeAnalytics";

interface Props {
  clientId: string;
  clientName: string;
  tier: ServiceTier;
  onAssignProgram: () => void;
}

interface WorkoutRow {
  id: string;
  date: string;
  workout_name: string;
  is_completed: boolean | null;
  total_volume: number | null;
}

interface ExerciseDetail {
  id: string;
  exercise_name: string;
  format: string;
  workout_section: string;
  coach_instructions: string | null;
  sets: {
    id: string; set_number: number; reps: number | null; weight: number | null; unit: string;
    rpe: number | null; tempo: string | null; notes: string | null; is_completed: boolean | null;
    is_prescribed: boolean; prescribed_reps: number | null; prescribed_weight: number | null;
  }[];
  conditioning: {
    id: string; set_number: number; modality: string | null; duration_seconds: number | null;
    distance: number | null; distance_unit: string | null; calories: number | null;
    avg_watts: number | null; avg_heart_rate: number | null; rpe: number | null;
    target_duration_seconds: number | null; target_distance: number | null; target_watts: number | null;
    is_completed: boolean | null;
  }[];
}

export function ClientTraining({ clientId, clientName, tier, onAssignProgram }: Props) {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ExerciseDetail[]>>({});
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("workouts")
        .select("id, date, workout_name, is_completed, total_volume")
        .eq("user_id", clientId)
        .order("date", { ascending: false })
        .limit(40);
      if (cancelled) return;
      setWorkouts((data || []) as WorkoutRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  /** Lazy-load a session's exercises only when the coach opens it. */
  const loadDetail = async (workoutId: string) => {
    if (details[workoutId]) return;
    setDetailLoading(true);
    const { data: exercises } = await supabase
      .from("workout_exercises")
      .select("id, exercise_name, format, workout_section, coach_instructions, order_index")
      .eq("workout_id", workoutId)
      .order("order_index");

    const exIds = (exercises || []).map((e) => e.id);
    const [setsRes, condRes] = await Promise.all([
      exIds.length
        ? supabase.from("exercise_sets").select("*").in("exercise_id", exIds).order("set_number")
        : Promise.resolve({ data: [] } as any),
      exIds.length
        ? supabase.from("conditioning_sets").select("*").in("exercise_id", exIds).order("set_number")
        : Promise.resolve({ data: [] } as any),
    ]);

    const mapped: ExerciseDetail[] = (exercises || []).map((e: any) => ({
      id: e.id,
      exercise_name: e.exercise_name,
      format: e.format,
      workout_section: e.workout_section,
      coach_instructions: e.coach_instructions,
      sets: (setsRes.data || []).filter((s: any) => s.exercise_id === e.id),
      conditioning: (condRes.data || []).filter((c: any) => c.exercise_id === e.id),
    }));

    setDetails((d) => ({ ...d, [workoutId]: mapped }));
    setDetailLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline" size="sm" className="gap-1.5 min-h-[44px]"
          onClick={() => navigate(`/admin/user/${clientId}/calendar?client=${encodeURIComponent(clientName)}`)}
        >
          <Calendar className="h-4 w-4" />Calendar
        </Button>
        {tier === "tier_1" && (
          <>
            <Button variant="outline" size="sm" className="gap-1.5 min-h-[44px]" onClick={onAssignProgram}>
              <ClipboardList className="h-4 w-4" />Assign program
            </Button>
            <Button
              size="sm" className="gap-1.5 min-h-[44px]"
              onClick={() => navigate(`/admin/user/${clientId}/build-workout?client=${encodeURIComponent(clientName)}`)}
            >
              <Pencil className="h-4 w-4" />Build session
            </Button>
          </>
        )}
      </div>

      {tier === "tier_2" && (
        <p className="text-xs text-muted-foreground">
          Tier 2: this athlete self-selects from the curated program list. Individualised programming is a Tier 1 service.
        </p>
      )}

      <VolumeAnalytics userId={clientId} />

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : workouts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No sessions logged yet.</p>
      ) : (
        <div className="space-y-2">
          {workouts.map((w) => (
            <Collapsible
              key={w.id}
              open={openId === w.id}
              onOpenChange={(o) => { setOpenId(o ? w.id : null); if (o) loadDetail(w.id); }}
            >
              <div className="rounded-xl border border-border bg-card">
                <CollapsibleTrigger className="w-full p-3 flex items-center gap-3 text-left min-h-[44px]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{w.workout_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(w.date), "EEE d MMM yyyy")}
                      {w.total_volume ? ` · ${Number(w.total_volume).toLocaleString()} volume` : ""}
                    </p>
                  </div>
                  <Badge variant={w.is_completed ? "default" : "secondary"} className="text-[10px]">
                    {w.is_completed ? "Completed" : "Open"}
                  </Badge>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openId === w.id ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3 space-y-3">
                  {detailLoading && !details[w.id] ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  ) : (details[w.id] || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No exercises recorded.</p>
                  ) : (
                    (details[w.id] || []).map((ex) => (
                      <div key={ex.id} className="rounded-lg bg-muted/40 p-2.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{ex.exercise_name}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{ex.format?.replace("_", " ")}</Badge>
                        </div>
                        {ex.coach_instructions && (
                          <p className="text-[11px] text-muted-foreground mt-1">Coach note: {ex.coach_instructions}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          {ex.sets.map((s) => (
                            <div key={s.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Set {s.set_number}</span>
                              <span className="font-mono">
                                {s.is_prescribed && (
                                  <span className="text-muted-foreground mr-2">
                                    Rx {s.prescribed_reps ?? "—"}
                                    {s.prescribed_weight ? ` × ${s.prescribed_weight}` : ""}
                                  </span>
                                )}
                                <span className={s.is_completed ? "text-foreground" : "text-muted-foreground/60"}>
                                  {s.reps ?? "—"} × {s.weight ?? "—"}{s.weight ? ` ${s.unit}` : ""}
                                  {s.rpe ? ` @${s.rpe}` : ""}
                                </span>
                              </span>
                            </div>
                          ))}
                          {ex.conditioning.map((c) => (
                            <div key={c.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground capitalize">{c.modality || "Conditioning"} {c.set_number}</span>
                              <span className="font-mono">
                                {c.duration_seconds ? `${Math.round(c.duration_seconds / 60)}min ` : ""}
                                {c.distance ? `${c.distance}${c.distance_unit || ""} ` : ""}
                                {c.calories ? `${c.calories}cal ` : ""}
                                {c.avg_watts ? `${c.avg_watts}w ` : ""}
                                {c.avg_heart_rate ? `${c.avg_heart_rate}bpm` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
