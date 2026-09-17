import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Trophy, Loader2 } from "lucide-react";
import type { SetUnit } from "@/types/workout";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
}

interface HistorySet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  rir: number | null;
  unit: SetUnit;
  estimated_1rm: number | null;
  is_pr: boolean;
}

interface HistorySession {
  workout_id: string;
  date: string;
  sets: HistorySet[];
}

export function MovementHistorySheet({ open, onOpenChange, exerciseName }: Props) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<HistorySession[]>([]);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: exData }, { data: prData }] = await Promise.all([
        supabase
          .from("workout_exercises")
          .select(
            `id, workout_id, workouts!inner(id, date, user_id),
             exercise_sets(id, set_number, weight, reps, rpe, rir, unit, estimated_1rm, is_completed, set_type)`
          )
          .ilike("exercise_name", exerciseName)
          .eq("workouts.user_id", user.id),
        supabase
          .from("personal_records")
          .select("set_id")
          .eq("user_id", user.id)
          .ilike("exercise_name", exerciseName),
      ]);

      const prIds = new Set((prData ?? []).map((r: any) => r.set_id).filter(Boolean));
      const grouped: HistorySession[] = (exData ?? [])
        .map((row: any) => ({
          workout_id: row.workout_id,
          date: row.workouts.date as string,
          sets: (row.exercise_sets ?? [])
            .filter((s: any) => s.is_completed)
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((s: any) => ({ ...s, unit: s.unit ?? "lb", is_pr: prIds.has(s.id) })),
        }))
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

  const bestE1rm = useMemo(
    () =>
      sessions.reduce(
        (m, s) => s.sets.reduce((mm, x) => (x.estimated_1rm && x.estimated_1rm > mm ? x.estimated_1rm : mm), m),
        0
      ),
    [sessions]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[82vh] rounded-t-2xl bg-background border-t border-border p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest text-left">
            Movement history
          </p>
          <SheetTitle className="text-left text-base font-semibold uppercase tracking-wide">
            {exerciseName}
          </SheetTitle>
          {bestE1rm > 0 && (
            <p className="text-left font-mono text-[10px] text-accent">Best e1RM {bestE1rm}</p>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-3 pb-10">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                No logged history for this movement yet.
              </p>
            ) : (
              sessions.map((session) => (
                <div key={session.workout_id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-xs font-semibold">
                      {new Date(session.date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {session.sets.some((s) => s.is_pr) && (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent">
                        <Trophy className="h-3 w-3" /> PR
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1 font-mono text-[8px] uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/60">
                    <span>Set</span>
                    <span>Reps</span>
                    <span>Load</span>
                    <span>RPE</span>
                    <span>e1RM</span>
                  </div>
                  {session.sets.map((s) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-5 gap-1 font-mono text-[10px] py-1 border-b border-border/30 last:border-0"
                    >
                      <span>{s.set_number}</span>
                      <span>{s.reps ?? "—"}</span>
                      <span className={cn(s.is_pr && "text-accent font-bold")}>
                        {s.weight !== null ? `${s.weight}${s.unit}` : "—"}
                      </span>
                      <span>{s.rpe ?? (s.rir !== null ? `${s.rir} RIR` : "—")}</span>
                      <span>{s.estimated_1rm ?? "—"}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
