import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";

interface TodayReadiness {
  score: number;
  sleep: number;
  stress: number;
  energy: number;
  drive: number;
  hasCheckin: boolean;
}

interface TodayTraining {
  hasWorkout: boolean;
  workoutName: string | null;
  totalVolume: number;
  lastWorkoutDate: string | null;
}

interface TodayBodyComp {
  latestWeight: number | null;
  previousWeight: number | null;
  usesImperial: boolean;
}

interface WeeklyData {
  workoutsCompleted: number;
  totalVolume: number;
  newPRs: number;
  avgReadiness: number;
  readinessTrend: "up" | "down" | "stable";
  lowestReadinessDay: string | null;
  weightStart: number | null;
  weightEnd: number | null;
  usesImperial: boolean;
}

interface DashboardState {
  todayReadiness: TodayReadiness;
  todayTraining: TodayTraining;
  todayBodyComp: TodayBodyComp;
  weeklyData: WeeklyData;
  isLoading: boolean;
  fetchAll: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  todayReadiness: { score: 0, sleep: 0, stress: 0, energy: 0, drive: 0, hasCheckin: false },
  todayTraining: { hasWorkout: false, workoutName: null, totalVolume: 0, lastWorkoutDate: null },
  todayBodyComp: { latestWeight: null, previousWeight: null, usesImperial: false },
  weeklyData: {
    workoutsCompleted: 0, totalVolume: 0, newPRs: 0,
    avgReadiness: 0, readinessTrend: "stable", lowestReadinessDay: null,
    weightStart: null, weightEnd: null, usesImperial: false,
  },
  isLoading: true,

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), "yyyy-MM-dd");
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const twoWeeksAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");

      // Parallel fetches
      const [
        checkinRes,
        weekCheckinsRes,
        prevWeekCheckinsRes,
        todayWorkoutRes,
        lastWorkoutRes,
        weekWorkoutsRes,
        weekPRsRes,
        bodyEntriesRes,
        todayCalendarRes,
      ] = await Promise.all([
        supabase.from("user_daily_checkins").select("*").eq("user_id", user.id).eq("check_date", today).maybeSingle(),
        supabase.from("user_daily_checkins").select("*").eq("user_id", user.id).gte("check_date", weekAgo).order("check_date"),
        supabase.from("user_daily_checkins").select("*").eq("user_id", user.id).gte("check_date", twoWeeksAgo).lt("check_date", weekAgo).order("check_date"),
        supabase.from("workouts").select("*").eq("user_id", user.id).eq("date", today).eq("is_completed", true).limit(1).maybeSingle(),
        supabase.from("workouts").select("date, workout_name, total_volume").eq("user_id", user.id).eq("is_completed", true).order("date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("workouts").select("*").eq("user_id", user.id).eq("is_completed", true).gte("date", weekAgo),
        supabase.from("personal_records").select("id").eq("user_id", user.id).gte("achieved_at", weekAgo),
        supabase.from("user_body_entries").select("weight_kg, entry_date, uses_imperial").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(10),
        supabase.from("user_calendar_workouts").select("*, program_workout:program_workouts(workout_name, program:programs(name))").eq("user_id", user.id).eq("scheduled_date", today).eq("is_completed", false).limit(1).maybeSingle(),
      ]);

      // Today's readiness
      const c = checkinRes.data;
      const todayReadiness: TodayReadiness = c
        ? {
            score: Math.round(((c.sleep_score + c.stress_score + c.energy_score + c.drive_score) / 20) * 100),
            sleep: c.sleep_score, stress: c.stress_score, energy: c.energy_score, drive: c.drive_score,
            hasCheckin: true,
          }
        : { score: 0, sleep: 0, stress: 0, energy: 0, drive: 0, hasCheckin: false };

      // Today's training — check completed workout first, then scheduled program session
      const tw = todayWorkoutRes.data;
      const lw = lastWorkoutRes.data;
      const calEntry = todayCalendarRes.data as any;
      
      // Derive a friendly name: completed workout > scheduled program session > null
      const scheduledName = calEntry
        ? `${calEntry.program_workout?.program?.name || ''} — ${calEntry.program_workout?.workout_name || 'Workout'}`.trim()
        : null;

      const todayTraining: TodayTraining = {
        hasWorkout: !!tw || !!calEntry,
        workoutName: tw?.workout_name || scheduledName,
        totalVolume: tw?.total_volume || 0,
        lastWorkoutDate: !tw && !calEntry && lw ? lw.date : null,
      };

      // Body comp
      const entries = bodyEntriesRes.data || [];
      const latest = entries[0];
      const previous = entries[1];
      const todayBodyComp: TodayBodyComp = {
        latestWeight: latest?.weight_kg || null,
        previousWeight: previous?.weight_kg || null,
        usesImperial: latest?.uses_imperial || false,
      };

      // Weekly data
      const weekCheckins = weekCheckinsRes.data || [];
      const prevWeekCheckins = prevWeekCheckinsRes.data || [];
      const weekWorkouts = weekWorkoutsRes.data || [];

      const readinessScores = weekCheckins.map(ch =>
        Math.round(((ch.sleep_score + ch.stress_score + ch.energy_score + ch.drive_score) / 20) * 100)
      );
      const avgReadiness = readinessScores.length > 0
        ? Math.round(readinessScores.reduce((s, v) => s + v, 0) / readinessScores.length)
        : 0;

      const prevAvg = prevWeekCheckins.length > 0
        ? prevWeekCheckins.reduce((s, ch) => s + ((ch.sleep_score + ch.stress_score + ch.energy_score + ch.drive_score) / 20) * 100, 0) / prevWeekCheckins.length
        : avgReadiness;

      let lowestDay: string | null = null;
      if (readinessScores.length > 0) {
        const minIdx = readinessScores.indexOf(Math.min(...readinessScores));
        lowestDay = weekCheckins[minIdx]?.check_date || null;
      }

      // Weekly body comp
      const weekEntries = entries.filter(e => e.entry_date >= weekAgo);
      const sortedWeekEntries = [...weekEntries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));

      const weeklyData: WeeklyData = {
        workoutsCompleted: weekWorkouts.length,
        totalVolume: weekWorkouts.reduce((s, w) => s + (Number(w.total_volume) || 0), 0),
        newPRs: weekPRsRes.data?.length || 0,
        avgReadiness,
        readinessTrend: avgReadiness > prevAvg + 3 ? "up" : avgReadiness < prevAvg - 3 ? "down" : "stable",
        lowestReadinessDay: lowestDay ? format(new Date(lowestDay + "T12:00:00"), "EEEE") : null,
        weightStart: sortedWeekEntries.length > 0 ? sortedWeekEntries[0].weight_kg : null,
        weightEnd: sortedWeekEntries.length > 1 ? sortedWeekEntries[sortedWeekEntries.length - 1].weight_kg : null,
        usesImperial: latest?.uses_imperial || false,
      };

      set({ todayReadiness, todayTraining, todayBodyComp, weeklyData, isLoading: false });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      set({ isLoading: false });
    }
  },
}));
