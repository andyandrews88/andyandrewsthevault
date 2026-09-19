import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Loader2, Plus, Pencil, Mic, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComposeContextStore } from "@/stores/composeContextStore";
import { useEntitlement } from "@/hooks/useEntitlement";
import { hasLiveCoaching } from "@/lib/entitlements";
import { toast } from "sonner";
import { useSessionStore } from "@/stores/sessionStore";
import { StrengthBlock } from "./StrengthBlock";
import { ConditioningBlock } from "./ConditioningBlock";
import { VoiceSetSheet } from "./VoiceSetSheet";
import { SessionVolumeCard } from "./SessionVolumeCard";
import { ExerciseSearch } from "@/components/workout/ExerciseSearch";
import { guessModality } from "@/lib/conditioningModalities";
import type { WorkoutExercise, WorkoutFormat } from "@/types/workout";
import { cn } from "@/lib/utils";

interface Props {
  workoutId: string;
  onBack: () => void;
}

const FORMAT_LABEL: Record<WorkoutFormat, string> = {
  straight: "",
  superset: "Superset",
  circuit: "Circuit",
  interval: "Intervals",
  amrap: "AMRAP",
  emom: "EMOM",
  for_time: "For time",
  conditioning: "Conditioning",
};

const SECTION_LABEL: Record<string, string> = {
  warmup: "Warm-up",
  main: "Main work",
  cooldown: "Cool-down",
};

interface Group {
  key: string;
  format: WorkoutFormat;
  config: Record<string, any>;
  exercises: WorkoutExercise[];
}

function buildGroups(exercises: WorkoutExercise[]): Group[] {
  const groups: Group[] = [];
  exercises.forEach((ex) => {
    const groupKey = ex.group_id ?? ex.superset_group ?? null;
    const last = groups[groups.length - 1];
    if (groupKey && last && last.key === groupKey) {
      last.exercises.push(ex);
      return;
    }
    groups.push({
      key: groupKey ?? ex.id,
      format: ex.format ?? "straight",
      config: (ex.group_config ?? {}) as Record<string, any>,
      exercises: [ex],
    });
  });
  return groups;
}

function groupSubtitle(group: Group) {
  const c = group.config ?? {};
  const parts = [
    c.rounds ? `${c.rounds} rounds` : null,
    c.work_seconds ? `${c.work_seconds}s work` : null,
    c.rest_seconds ? `${c.rest_seconds}s rest` : null,
    c.interval_seconds ? `every ${c.interval_seconds}s` : null,
    c.time_cap_seconds ? `cap ${Math.round(c.time_cap_seconds / 60)} min` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function SessionScreen({ workoutId, onBack }: Props) {
  const {
    workout,
    exercises,
    loading,
    error,
    pending,
    loadSession,
    clearSession,
    addExercise,
    finishSession,
    reopenSession,
  } = useSessionStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const navigate = useNavigate();
  const setContext = useComposeContextStore((s) => s.setContext);
  const { entitlement } = useEntitlement();
  const canMessageCoach = hasLiveCoaching(entitlement) && !!entitlement.coachId;
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    loadSession(workoutId);
    return () => clearSession();
  }, [workoutId, loadSession, clearSession]);

  const sections = useMemo(() => {
    const bySection: Record<string, WorkoutExercise[]> = { warmup: [], main: [], cooldown: [] };
    exercises.forEach((ex) => {
      const s = ex.workout_section ?? "main";
      (bySection[s] ?? bySection.main).push(ex);
    });
    return bySection;
  }, [exercises]);

  const totalSets = exercises.reduce(
    (n, e) => n + (e.sets?.length ?? 0) + (e.conditioning_sets?.length ?? 0),
    0
  );
  const doneSets = exercises.reduce(
    (n, e) =>
      n +
      (e.sets?.filter((s) => s.is_completed).length ?? 0) +
      (e.conditioning_sets?.filter((s) => s.is_completed).length ?? 0),
    0
  );
  const pendingCount = Object.keys(pending).length;
  const readOnly = !!workout?.is_completed;

  const handleFinish = async () => {
    setFinishing(true);
    const ok = await finishSession();
    setFinishing(false);
    if (ok) {
      toast.success("Session finished");
      onBack();
    } else if (pendingCount > 0) {
      toast.error("Some sets haven't saved yet. Retry them first.");
    } else {
      toast.error("Could not finish the session. Try again.");
    }
  };

  const handleAdd = (name: string) => {
    addExercise(name, guessModality(name) ? "conditioning" : "strength");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-muted-foreground">{error ?? "Session not found."}</p>
        <Button variant="outline" onClick={onBack}>
          Back to Train
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide truncate">
              {workout.workout_name}
            </h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              {new Date(workout.date).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}{" "}
              · {doneSets}/{totalSets} logged
              {readOnly ? " · completed" : ""}
            </p>
          </div>
          {canMessageCoach && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Ask your coach about this session"
              onClick={() => {
                setContext({
                  type: "workout",
                  id: workout.id,
                  label: `${workout.workout_name} · ${workout.date}`,
                });
                navigate("/vault?tab=coach");
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: totalSets ? `${(doneSets / totalSets) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {pendingCount > 0 && (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {pendingCount} change{pendingCount > 1 ? "s" : ""} not saved. Tap the warning icon on the
          affected row to retry.
        </p>
      )}

      <div className="mt-4">
        <SessionVolumeCard workoutId={workoutId} refreshKey={`${doneSets}-${pendingCount}`} />
      </div>

      <div className="space-y-5 mt-4">
        {(["warmup", "main", "cooldown"] as const).map((section) => {
          const list = sections[section];
          if (!list || list.length === 0) return null;
          const groups = buildGroups(list);
          return (
            <div key={section} className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {SECTION_LABEL[section]}
              </p>
              {groups.map((group) => {
                const grouped = group.exercises.length > 1 || (group.format !== "straight" && group.format !== "conditioning");
                const label = FORMAT_LABEL[group.format];
                const subtitle = groupSubtitle(group);
                return (
                  <div
                    key={group.key}
                    className={cn(
                      grouped && "rounded-xl border border-primary/30 bg-primary/[0.03] p-2 space-y-2"
                    )}
                  >
                    {grouped && (label || subtitle) && (
                      <p className="px-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                        {label}
                        {subtitle ? ` · ${subtitle}` : ""}
                      </p>
                    )}
                    {!grouped && <></>}
                    <div className="space-y-3">
                      {group.exercises.map((ex) =>
                        ex.exercise_type === "conditioning" ? (
                          <ConditioningBlock key={ex.id} exercise={ex} readOnly={readOnly} />
                        ) : (
                          <StrengthBlock key={ex.id} exercise={ex} readOnly={readOnly} />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {exercises.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nothing in this session yet. Add your first movement.
          </p>
        )}
      </div>

      {!readOnly && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-11" onClick={() => setSearchOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add movement
          </Button>
          <Button variant="outline" className="h-11" onClick={() => setVoiceOpen(true)}>
            <Mic className="h-4 w-4 mr-1.5" /> Log by voice
          </Button>
        </div>
      )}

      <VoiceSetSheet
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        exercises={exercises}
        defaultExerciseId={
          exercises.find((e) => (e.sets ?? []).some((s) => !s.is_completed))?.id ?? null
        }
      />

      <div className="fixed bottom-16 left-0 right-0 px-4 z-20">
        <div className="max-w-2xl mx-auto">
          {readOnly ? (
            <Button variant="outline" className="w-full h-12" onClick={() => reopenSession()}>
              <Pencil className="h-4 w-4 mr-2" /> Reopen session
            </Button>
          ) : (
            <Button variant="elite" className="w-full h-12" onClick={handleFinish} disabled={finishing}>
              {finishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Finish session
            </Button>
          )}
        </div>
      </div>

      <ExerciseSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectExercise={handleAdd}
        mode="add"
      />
    </div>
  );
}
