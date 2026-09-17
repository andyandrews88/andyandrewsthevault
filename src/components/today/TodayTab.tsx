import { useCallback, useEffect, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  ChevronRight,
  Dumbbell,
  Loader2,
  MessageSquare,
  Moon,
  Scale,
  UtensilsCrossed,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { sumMacros, type FoodEntry } from "@/stores/nutritionLogStore";

interface Props {
  onNavigate: (tab: string) => void;
}

interface TodayData {
  sessionName: string | null;
  sessionInProgress: boolean;
  sessionDone: boolean;
  calories: number;
  targetCalories: number | null;
  protein: number;
  targetProtein: number | null;
  loggedMeals: number;
  daysSinceWeigh: number | null;
  unread: number;
}

export function TodayTab({ onNavigate }: Props) {
  const { user } = useAuthStore();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [workouts, calendar, food, targets, body, unread] = await Promise.all([
      supabase
        .from("workouts")
        .select("workout_name, is_completed")
        .eq("user_id", user.id)
        .eq("date", today),
      supabase
        .from("user_calendar_workouts")
        .select("is_completed, program_workouts(workout_name)")
        .eq("user_id", user.id)
        .eq("scheduled_date", today)
        .limit(1),
      supabase
        .from("user_food_diary")
        .select("calculated_macros, is_confirmed")
        .eq("user_id", user.id)
        .eq("entry_date", today),
      supabase
        .from("nutrition_targets")
        .select("calories, protein_g")
        .eq("user_id", user.id)
        .lte("effective_from", today)
        .order("effective_from", { ascending: false })
        .limit(1),
      supabase
        .from("user_body_entries")
        .select("entry_date")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(1),
      supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("to_user_id", user.id)
        .eq("is_read", false),
    ]);

    const sessions = workouts.data ?? [];
    const inProgress = sessions.find((w) => !w.is_completed);
    const assigned = (calendar.data ?? [])[0] as
      | { is_completed: boolean; program_workouts?: { workout_name?: string } }
      | undefined;

    const totals = sumMacros((food.data ?? []) as unknown as FoodEntry[], false);
    const target = (targets.data ?? [])[0];
    const lastWeigh = (body.data ?? [])[0]?.entry_date as string | undefined;

    setData({
      sessionName:
        inProgress?.workout_name ??
        assigned?.program_workouts?.workout_name ??
        (sessions.length > 0 ? sessions[0].workout_name : null),
      sessionInProgress: !!inProgress,
      sessionDone: sessions.length > 0 && sessions.every((w) => w.is_completed),
      calories: totals.calories,
      targetCalories: target?.calories ? Number(target.calories) : null,
      protein: totals.protein,
      targetProtein: target?.protein_g ? Number(target.protein_g) : null,
      loggedMeals: (food.data ?? []).length,
      daysSinceWeigh: lastWeigh
        ? differenceInCalendarDays(new Date(), parseISO(lastWeigh))
        : null,
      unread: unread.count ?? 0,
    });
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const weighDue = data.daysSinceWeigh === null || data.daysSinceWeigh >= 7;

  return (
    <div className="space-y-4 pb-24">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {format(new Date(), "EEEE d MMMM")}
        </p>
        <h2 className="text-xl font-semibold">Today</h2>
      </div>

      {/* Training */}
      <button
        onClick={() => onNavigate("workouts")}
        className="w-full rounded-xl border border-border bg-card p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Training</p>
            {data.sessionDone ? (
              <p className="text-base font-semibold mt-1">Session complete</p>
            ) : data.sessionName ? (
              <p className="text-base font-semibold mt-1 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{data.sessionName}</span>
              </p>
            ) : (
              <p className="text-base font-semibold mt-1 flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" /> Rest day
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {data.sessionDone
                ? "Nice work today."
                : data.sessionInProgress
                  ? "Continue where you left off"
                  : data.sessionName
                    ? "Tap to start logging"
                    : "Nothing assigned — start your own session any time"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </button>

      {/* Nutrition */}
      <button
        onClick={() => onNavigate("nutrition")}
        className="w-full rounded-xl border border-border bg-card p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Nutrition</p>
            <p className="text-base font-semibold mt-1 flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              {Math.round(data.calories)}
              {data.targetCalories ? ` / ${Math.round(data.targetCalories)}` : ""} kcal
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.loggedMeals === 0
                ? "Nothing logged yet today"
                : `${data.loggedMeals} entr${data.loggedMeals === 1 ? "y" : "ies"} · protein ${Math.round(data.protein)}${
                    data.targetProtein ? ` / ${Math.round(data.targetProtein)}` : ""
                  }g`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </button>

      {/* Body check-in — only when due */}
      {weighDue && (
        <button
          onClick={() => onNavigate("progress")}
          className="w-full rounded-xl border border-accent/40 bg-accent/5 p-4 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Check-in</p>
              <p className="text-base font-semibold mt-1 flex items-center gap-2">
                <Scale className="h-4 w-4 text-accent" /> Log your weigh-in
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.daysSinceWeigh === null
                  ? "No entries yet"
                  : `Last entry ${data.daysSinceWeigh} days ago`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          </div>
        </button>
      )}

      {/* Coach */}
      <button
        onClick={() => onNavigate("coach")}
        className="w-full rounded-xl border border-border bg-card p-4 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">
              {data.unread > 0
                ? `${data.unread} new message${data.unread === 1 ? "" : "s"} from your coach`
                : "Message your coach"}
            </p>
          </div>
          {data.unread > 0 && (
            <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
          )}
        </div>
      </button>
    </div>
  );
}
