import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Plus, Dumbbell, ChevronRight, Moon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useProgramStore, type UserCalendarWorkout } from "@/stores/programStore";
import { SessionScreen } from "./SessionScreen";
import { cn } from "@/lib/utils";

interface WorkoutRow {
  id: string;
  date: string;
  workout_name: string;
  is_completed: boolean;
  total_volume: number | null;
}

export function TrainTab() {
  const { user } = useAuthStore();
  const { todaysWorkouts, fetchTodaysWorkouts, startProgramWorkoutSession, isStartingSession } =
    useProgramStore();

  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [todaySessions, setTodaySessions] = useState<WorkoutRow[]>([]);
  const [history, setHistory] = useState<WorkoutRow[]>([]);
  const [weekDates, setWeekDates] = useState<Record<string, number>>({});
  const [starting, setStarting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // These must be stable strings: rebuilding Date objects each render previously
  // re-created `load`, which re-fired the effect forever and pinned the spinner.
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const weekStartStr = useMemo(
    () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    []
  );
  const weekStart = useMemo(() => new Date(`${weekStartStr}T00:00:00`), [weekStartStr]);

  const userId = user?.id ?? null;

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const weekEndStr = format(addDays(new Date(`${weekStartStr}T00:00:00`), 6), "yyyy-MM-dd");
      const [todayRes, historyRes, weekRes] = await Promise.all([
        supabase
          .from("workouts")
          .select("id, date, workout_name, is_completed, total_volume")
          .eq("user_id", userId)
          .eq("date", today)
          .order("created_at", { ascending: true }),
        supabase
          .from("workouts")
          .select("id, date, workout_name, is_completed, total_volume")
          .eq("user_id", userId)
          .eq("is_completed", true)
          .order("date", { ascending: false })
          .limit(15),
        supabase
          .from("workouts")
          .select("date")
          .eq("user_id", userId)
          .gte("date", weekStartStr)
          .lte("date", weekEndStr)
          .eq("is_completed", true),
      ]);

      const firstError = todayRes.error || historyRes.error || weekRes.error;
      if (firstError) throw firstError;

      setTodaySessions((todayRes.data ?? []) as WorkoutRow[]);
      setHistory((historyRes.data ?? []) as WorkoutRow[]);
      const counts: Record<string, number> = {};
      (weekRes.data ?? []).forEach((r: any) => {
        counts[r.date] = (counts[r.date] ?? 0) + 1;
      });
      setWeekDates(counts);
    } catch (e: any) {
      setLoadError(e?.message ?? "Could not load your training.");
    } finally {
      setLoading(false);
    }
  }, [userId, today, weekStartStr]);

  useEffect(() => {
    fetchTodaysWorkouts();
    load();
  }, [fetchTodaysWorkouts, load]);

  const assigned: UserCalendarWorkout | undefined = todaysWorkouts.find((w) => !w.is_completed);

  const startAssigned = async () => {
    if (!assigned) return;
    setStarting(true);
    const id = await startProgramWorkoutSession(assigned, new Date());
    setStarting(false);
    if (!id) {
      toast.error("Could not start this session. Try again.");
      return;
    }
    setOpenWorkoutId(id);
  };

  const startEmpty = async () => {
    if (!user) return;
    setStarting(true);
    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        date: today,
        workout_name: `Session ${format(new Date(), "d MMM")}`,
        is_completed: false,
      })
      .select("id")
      .single();
    setStarting(false);
    if (error || !data) {
      toast.error("Could not start a session.");
      return;
    }
    setOpenWorkoutId(data.id);
  };

  const closeSession = () => {
    setOpenWorkoutId(null);
    load();
  };

  if (openWorkoutId) {
    return <SessionScreen workoutId={openWorkoutId} onBack={closeSession} />;
  }

  const inProgress = todaySessions.find((w) => !w.is_completed);
  const completedToday = todaySessions.filter((w) => w.is_completed);

  return (
    <div className="space-y-6 pb-24">
      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const d = addDays(weekStart, i);
          const key = format(d, "yyyy-MM-dd");
          const isToday = key === today;
          return (
            <div
              key={key}
              className={cn(
                "rounded-lg border py-2 text-center",
                isToday ? "border-primary bg-primary/10" : "border-border bg-card"
              )}
            >
              <p className="font-mono text-[9px] uppercase text-muted-foreground">
                {format(d, "EEEEE")}
              </p>
              <p className="text-sm font-semibold">{format(d, "d")}</p>
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full mt-1",
                  weekDates[key] ? "bg-primary" : "bg-muted"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Today */}
      <section className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Today
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 space-y-2">
            <p className="text-sm font-semibold text-destructive">Couldn't load your training</p>
            <p className="text-xs text-muted-foreground">{loadError}</p>
            <Button variant="outline" className="h-10" onClick={load}>
              Try again
            </Button>
          </div>
        ) : inProgress ? (
          <button
            onClick={() => setOpenWorkoutId(inProgress.id)}
            className="w-full rounded-xl border border-primary/50 bg-primary/5 p-4 text-left"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
              In progress
            </p>
            <p className="text-base font-semibold mt-1">{inProgress.workout_name}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Play className="h-4 w-4" /> Continue session
            </span>
          </button>
        ) : assigned ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
              {(assigned as any).enrollment?.program?.name ?? "Assigned"}
            </p>
            <p className="text-base font-semibold mt-1 flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              {assigned.program_workout?.workout_name ?? "Today's session"}
            </p>
            {assigned.program_workout?.notes && (
              <p className="text-xs text-muted-foreground mt-1">{assigned.program_workout.notes}</p>
            )}
            <Button
              variant="elite"
              className="w-full mt-3 h-11"
              onClick={startAssigned}
              disabled={starting || isStartingSession}
            >
              {starting || isStartingSession ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start session
            </Button>
          </div>
        ) : completedToday.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Session complete</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nice work. Add another session below if you're training again today.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <Moon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-semibold">No assigned session today</p>
              <p className="text-xs text-muted-foreground mt-1">
                Recover well, or start your own session.
              </p>
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full h-11" onClick={startEmpty} disabled={starting}>
          <Plus className="h-4 w-4 mr-1.5" /> Start empty session
        </Button>
      </section>

      {/* History */}
      <section className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Recent sessions
        </p>
        {history.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground">No completed sessions yet.</p>
        ) : (
          <div className="space-y-1.5">
            {history.map((w) => (
              <button
                key={w.id}
                onClick={() => setOpenWorkoutId(w.id)}
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{w.workout_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {format(new Date(w.date), "EEE d MMM yyyy")}
                    {w.total_volume ? ` · ${Math.round(w.total_volume)} vol` : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
