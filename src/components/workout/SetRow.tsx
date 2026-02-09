import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ExerciseSet } from "@/types/workout";
import { useState, useEffect } from "react";

interface SetRowProps {
  set: ExerciseSet;
  previousData?: { weight: number; reps: number } | null;
  onUpdate: (data: Partial<ExerciseSet>) => void;
  onComplete: (weight: number, reps: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function SetRow({ 
  set, 
  previousData, 
  onUpdate, 
  onComplete, 
  onRemove,
  disabled 
}: SetRowProps) {
  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps, setReps] = useState(set.reps?.toString() || '');

  useEffect(() => {
    setWeight(set.weight?.toString() || '');
    setReps(set.reps?.toString() || '');
  }, [set.weight, set.reps]);

  const handleWeightChange = (value: string) => {
    setWeight(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdate({ weight: num });
    }
  };

  const handleRepsChange = (value: string) => {
    setReps(value);
    const num = parseInt(value);
    if (!isNaN(num)) {
      onUpdate({ reps: num });
    }
  };

  const handleComplete = (checked: boolean) => {
    if (checked && weight && reps) {
      onComplete(parseFloat(weight), parseInt(reps));
    } else if (!checked) {
      onUpdate({ is_completed: false });
    }
  };

  return (
    <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px_32px] gap-2 items-center py-2 border-b border-border/50 last:border-0">
      {/* Set Number */}
      <span className="text-center text-sm font-medium text-muted-foreground">
        {set.set_number}
      </span>
      
      {/* Previous Data */}
      <div className="text-center text-xs text-muted-foreground">
        {previousData ? (
          <span>{previousData.weight}×{previousData.reps}</span>
        ) : (
          <span>—</span>
        )}
      </div>
      
      {/* Weight Input */}
      <Input
        type="number"
        inputMode="decimal"
        placeholder="lbs"
        value={weight}
        onChange={(e) => handleWeightChange(e.target.value)}
        disabled={set.is_completed || disabled}
        className="h-9 text-center text-sm"
      />
      
      {/* Reps Input */}
      <Input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        onChange={(e) => handleRepsChange(e.target.value)}
        disabled={set.is_completed || disabled}
        className="h-9 text-center text-sm"
      />
      
      {/* Complete Checkbox */}
      <div className="flex justify-center">
        <Checkbox
          checked={set.is_completed}
          onCheckedChange={handleComplete}
          disabled={!weight || !reps || disabled}
          className="h-6 w-6"
        />
      </div>
      
      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
