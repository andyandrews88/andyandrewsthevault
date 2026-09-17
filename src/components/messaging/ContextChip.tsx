import { useEffect, useState } from "react";
import { Dumbbell, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { MessageContextType } from "@/stores/conversationStore";

interface Props {
  type: MessageContextType;
  id: string;
  mine: boolean;
}

/**
 * Shows what a message is about when it was sent from a workout or a confirmed meal.
 * Only reads the label — permissions on the underlying rows are unchanged.
 */
export function ContextChip({ type, id, mine }: Props) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (type === "workout") {
        const { data } = await supabase
          .from("workouts")
          .select("workout_name, date")
          .eq("id", id)
          .maybeSingle();
        if (!cancelled) {
          setLabel(data ? `${data.workout_name} · ${data.date}` : "Workout");
        }
      } else {
        const { data } = await supabase
          .from("user_food_diary")
          .select("meal_slot, entry_date, food_data")
          .eq("id", id)
          .maybeSingle();
        if (!cancelled) {
          const food = data?.food_data as { name?: string } | null;
          setLabel(
            data ? `${food?.name ?? data.meal_slot} · ${data.entry_date}` : "Meal"
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  const Icon = type === "workout" ? Dumbbell : UtensilsCrossed;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 mb-1.5 text-[11px] ${
        mine ? "bg-background/20" : "bg-background/60 border border-border"
      }`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate">{label ?? "Loading…"}</span>
    </div>
  );
}
