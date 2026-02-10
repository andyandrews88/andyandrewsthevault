import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, addDays, format } from "date-fns";

export interface Goal {
  id: string;
  user_id: string;
  goal_type: "strength" | "body_weight" | "conditioning";
  title: string;
  exercise_name: string | null;
  target_value: number;
  start_value: number;
  current_value: number;
  target_date: string;
  unit: string;
  status: string;
  created_at: string;
  achieved_at: string | null;
}

export interface GoalProjection {
  projectedDate: Date | null;
  status: "ahead" | "on_track" | "behind" | "achieved" | "no_data";
  weeklyRate: number;
  percentComplete: number;
  daysRemaining: number;
}

function computeProjection(goal: Goal): GoalProjection {
  const now = new Date();
  const targetDate = new Date(goal.target_date + "T12:00:00");
  const daysRemaining = Math.max(0, differenceInDays(targetDate, now));

  if (goal.status === "achieved") {
    return { projectedDate: null, status: "achieved", weeklyRate: 0, percentComplete: 100, daysRemaining };
  }

  const totalRange = Math.abs(goal.target_value - goal.start_value);
  if (totalRange === 0) {
    return { projectedDate: null, status: "achieved", weeklyRate: 0, percentComplete: 100, daysRemaining };
  }

  const progressMade = Math.abs(goal.current_value - goal.start_value);
  const percentComplete = Math.min(100, Math.round((progressMade / totalRange) * 100));

  const daysSinceStart = Math.max(1, differenceInDays(now, new Date(goal.created_at)));
  const dailyRate = progressMade / daysSinceStart;
  const weeklyRate = Math.round(dailyRate * 7 * 100) / 100;

  if (dailyRate <= 0) {
    return { projectedDate: null, status: "no_data", weeklyRate: 0, percentComplete, daysRemaining };
  }

  const remaining = totalRange - progressMade;
  const daysToComplete = Math.ceil(remaining / dailyRate);
  const projectedDate = addDays(now, daysToComplete);

  const diffFromTarget = differenceInDays(projectedDate, targetDate);
  let status: GoalProjection["status"];
  if (diffFromTarget < -7) status = "ahead";
  else if (diffFromTarget <= 7) status = "on_track";
  else status = "behind";

  return { projectedDate, status, weeklyRate, percentComplete, daysRemaining };
}

interface GoalState {
  goals: Goal[];
  projections: Record<string, GoalProjection>;
  isLoading: boolean;
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, "id" | "user_id" | "created_at" | "achieved_at" | "status">) => Promise<void>;
  updateGoalProgress: (goalId: string, currentValue: number) => Promise<void>;
  cancelGoal: (goalId: string) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  syncGoalsAfterPR: (exerciseName: string, newWeight: number) => Promise<void>;
  syncGoalsAfterBodyEntry: (weightKg: number) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  projections: {},
  isLoading: false,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_goals" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const goals = (data || []) as unknown as Goal[];
      const projections: Record<string, GoalProjection> = {};
      goals.forEach(g => { projections[g.id] = computeProjection(g); });

      set({ goals, projections, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      set({ isLoading: false });
    }
  },

  addGoal: async (goal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("user_goals" as any)
        .insert({ ...goal, user_id: user.id, status: "active" } as any);

      if (error) throw error;
      await get().fetchGoals();
    } catch (err) {
      console.error("Failed to add goal:", err);
      throw err;
    }
  },

  updateGoalProgress: async (goalId, currentValue) => {
    try {
      const goal = get().goals.find(g => g.id === goalId);
      if (!goal) return;

      const isAchieved = goal.goal_type === "conditioning"
        ? currentValue <= goal.target_value
        : currentValue >= goal.target_value;

      const updates: any = { current_value: currentValue };
      if (isAchieved) {
        updates.status = "achieved";
        updates.achieved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("user_goals" as any)
        .update(updates)
        .eq("id", goalId);

      if (error) throw error;
      await get().fetchGoals();
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  },

  cancelGoal: async (goalId) => {
    try {
      const { error } = await supabase
        .from("user_goals" as any)
        .update({ status: "cancelled" } as any)
        .eq("id", goalId);
      if (error) throw error;
      await get().fetchGoals();
    } catch (err) {
      console.error("Failed to cancel goal:", err);
    }
  },

  deleteGoal: async (goalId) => {
    try {
      const { error } = await supabase
        .from("user_goals" as any)
        .delete()
        .eq("id", goalId);
      if (error) throw error;
      await get().fetchGoals();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  },

  syncGoalsAfterPR: async (exerciseName: string, newWeight: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: matching } = await supabase
        .from("user_goals" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("goal_type", "strength")
        .ilike("exercise_name", exerciseName);

      const goals = (matching || []) as unknown as Goal[];
      for (const goal of goals) {
        if (newWeight > goal.current_value) {
          await get().updateGoalProgress(goal.id, newWeight);
        }
      }
      await get().fetchGoals();
    } catch (err) {
      console.error("Failed to sync goals after PR:", err);
    }
  },

  syncGoalsAfterBodyEntry: async (weightKg: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: matching } = await supabase
        .from("user_goals" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("goal_type", "body_weight");

      const goals = (matching || []) as unknown as Goal[];
      for (const goal of goals) {
        await get().updateGoalProgress(goal.id, weightKg);
      }
      await get().fetchGoals();
    } catch (err) {
      console.error("Failed to sync goals after body entry:", err);
    }
  },
}));
