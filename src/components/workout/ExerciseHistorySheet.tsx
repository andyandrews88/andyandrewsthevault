import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Trophy, Loader2 } from "lucide-react";

interface ExerciseHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
}

interface HistorySet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  is_pr: boolean;
}

interface HistorySession {
  workout_id: string;
  date: string;
  sets: HistorySet[];
}

const ALL_TIME = "__ALL__";

function formatMonthKey(d: Date) {
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ExerciseHistorySheet({ open, onOpenChange, exerciseName }: ExerciseHistorySheetProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [filter, setFilter] = useState<string>(ALL_TIME);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);

      // Fetch all completed workouts containing this exercise for the user
      const { data: exData } = await supabase
        .from("workout_exercises")
        .select(`
          id,
          workout_id,
          workouts!inner(id, date, user_id, is_completed),
          exercise_sets(id, set_number, weight, reps, rir, is_completed, set_type)
        `)
        .ilike("exercise_name", exerciseName)
        .eq("workouts.user_id", user.id)
        .eq("workouts.is_completed", true);

      // Fetch PR set ids for this exercise
      const { data: prData } = await supabase
        .from("personal_records")
        .select("set_id")
        .eq("user_id", user.id)
        .ilike("exercise_name", exerciseName);

      const prSetIds = new Set((prData ?? []).map((r: any) => r.set_id).filter(Boolean));

      const grouped: HistorySession[] = (exData ?? [])
        .map((row: any) => {
          const sets: HistorySet[] = (row.exercise_sets ?? [])
            .filter((s: any) => s.is_completed && s.set_type !== "warmup")
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((s: any) => ({
              id: s.id,
              set_number: s.set_number,
              weight: s.weight,
              reps: s.reps,
              rir: s.rir,
              is_pr: prSetIds.has(s.id),
            }));
          return {
            workout_id: row.workout_id,
            date: row.workouts.date,
            sets,
          };
        })
        .filter((s) => s.sets.length > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1));

      if (!cancelled) {
        setSessions(grouped);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user, exerciseName]);

  const months = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    sessions.forEach((s) => {
      const key = formatMonthKey(new Date(s.date));
      if (!seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    });
    return out;
  }, [sessions]);

  const filtered = useMemo(() => {
    if (filter === ALL_TIME) return sessions;
    return sessions.filter((s) => formatMonthKey(new Date(s.date)) === filter);
  }, [sessions, filter]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[82vh] rounded-t-2xl bg-background border-t border-border-elevated p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest text-left">
            Exercise History
          </p>
          <SheetTitle className="text-left text-base font-semibold uppercase tracking-wide">
            {exerciseName}
          </SheetTitle>
        </SheetHeader>

        {/* Month filter pills */}
        <div className="px-4 py-3 border-b border-border overflow-x-auto">
          <div className="flex gap-2 w-max">
            {[ALL_TIME, ...months].map((m) => {
              const active = filter === m;
              const label = m === ALL_TIME ? "All Time" : m;
              return (
                <button
                  key={m}
                  onClick={() => setFilter(m)}
                  className={cn(
                    "font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-card border border-border text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions list */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-3 pb-8">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                No logged history for this exercise.
              </p>
            ) : (
              filtered.map((session) => {
                const setsCount = session.sets.length;
                const totalVol = session.sets.reduce(
                  (acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0),
                  0
                );
                const topWeight = session.sets.reduce(
                  (m, s) => Math.max(m, s.weight ?? 0),
                  0
                );
                const hasPR = session.sets.some((s) => s.is_pr);

                return (
                  <div
                    key={session.workout_id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-mono text-xs font-semibold">
                        {formatDate(new Date(session.date))}
                      </p>
                      {hasPR && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-accent">
                          <Trophy className="h-3 w-3" /> PR
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground mb-2">
                      {setsCount} sets · {Math.round(totalVol)}kg total vol · top {topWeight}kg
                    </p>

                    <div className="grid grid-cols-4 gap-1 font-mono text-[8px] text-muted-foreground uppercase tracking-wider pb-1 border-b border-border/60">
                      <span>Set</span>
                      <span>Kg</span>
                      <span>Reps</span>
                      <span>RIR</span>
                    </div>
                    {session.sets.map((s) => (
                      <div
                        key={s.id}
                        className="grid grid-cols-4 gap-1 font-mono text-[10px] py-1 border-b border-border/30 last:border-0"
                      >
                        <span>{s.set_number}</span>
                        <span className={cn(s.is_pr && "text-accent font-bold")}>
                          {s.weight ?? "—"}
                        </span>
                        <span>{s.reps ?? "—"}</span>
                        <span>{s.rir ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
