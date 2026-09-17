import { useEffect, useState } from "react";
import { Camera, Mic, Trash2 } from "lucide-react";
import { useNutritionLogStore, type FoodEntry } from "@/stores/nutritionLogStore";

interface Props {
  entry: FoodEntry;
  onDelete?: (id: string) => void;
}

export function FoodEntryRow({ entry, onDelete }: Props) {
  const signPhoto = useNutritionLogStore((s) => s.signPhoto);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (entry.photo_path) {
      signPhoto(entry.photo_path).then((u) => active && setUrl(u));
    }
    return () => {
      active = false;
    };
  }, [entry.photo_path, signPhoto]);

  const m = entry.calculated_macros ?? {};

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
      {url ? (
        <img src={url} alt="Meal" className="h-12 w-12 rounded-md object-cover shrink-0" />
      ) : entry.photo_path ? (
        <div className="h-12 w-12 rounded-md bg-muted shrink-0" />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {entry.food_data?.description || "Meal"}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {Math.round(Number(m.calories ?? 0))} kcal · P {Math.round(Number(m.protein ?? 0))} · C{" "}
          {Math.round(Number(m.carbs ?? 0))} · F {Math.round(Number(m.fats ?? 0))}
        </p>
        {entry.coach_comment && (
          <p className="mt-1 text-[11px] text-accent">Coach: {entry.coach_comment}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
        {entry.source === "photo" && <Camera className="h-3.5 w-3.5" />}
        {entry.source === "voice" && <Mic className="h-3.5 w-3.5" />}
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            aria-label="Delete entry"
            className="p-2 -mr-1 rounded-md hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
