import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useAuthStore } from "@/stores/authStore";

/**
 * Subscribes to realtime changes on workouts, workout_exercises, and exercise_sets
 * so that admin-side changes reflect instantly on the client without refresh.
 */
export function useWorkoutRealtime() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel("workout-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workouts", filter: `user_id=eq.${user.id}` },
        () => {
          // Refetch active workout and history
          useWorkoutStore.getState().fetchActiveWorkout();
          useWorkoutStore.getState().fetchWorkoutHistory();
          useWorkoutStore.getState().fetchWorkoutDays();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workout_exercises" },
        () => {
          useWorkoutStore.getState().fetchActiveWorkout();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exercise_sets" },
        () => {
          useWorkoutStore.getState().fetchActiveWorkout();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthenticated]);
}
