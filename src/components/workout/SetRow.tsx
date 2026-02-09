import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ExerciseSet } from "@/types/workout";
import { useState, useEffect } from "react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { convertWeight } from "@/lib/weightConversion";
import { WeightInputPopup } from "./WeightInputPopup";

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
  const { preferredUnit } = useWorkoutStore();
  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps, setReps] = useState(set.reps?.toString() || '');
  const [showWeightPopup, setShowWeightPopup] = useState(false);

  useEffect(() => {
    if (set.weight) {
      const displayWeight = preferredUnit === 'kg' 
        ? convertWeight(set.weight, 'lbs', 'kg') 
        : set.weight;
      setWeight(displayWeight.toString());
    } else {
      setWeight('');
    }
    setReps(set.reps?.toString() || '');
  }, [set.weight, set.reps, preferredUnit]);

  const handleRepsChange = (value: string) => {
    setReps(value);
    const num = parseInt(value);
    if (!isNaN(num)) {
      onUpdate({ reps: num });
    }
  };

  const handleWeightLog = (storedWeight: number) => {
    const displayWeight = preferredUnit === 'kg' 
      ? convertWeight(storedWeight, 'lbs', 'kg') 
      : storedWeight;
    setWeight(displayWeight.toString());
    onUpdate({ weight: storedWeight });
  };

  const handleAutofill = () => {
    if (previousData) {
      const displayWeight = preferredUnit === 'kg' 
        ? convertWeight(previousData.weight, 'lbs', 'kg') 
        : previousData.weight;
      setWeight(displayWeight.toString());
      setReps(previousData.reps.toString());
      onUpdate({ weight: previousData.weight, reps: previousData.reps });
    }
  };

  const handleComplete = (checked: boolean) => {
    if (checked && weight && reps) {
      // Convert display weight to lbs for storage if needed
      const displayWeight = parseFloat(weight);
      const storedWeight = preferredUnit === 'kg' 
        ? convertWeight(displayWeight, 'kg', 'lbs') 
        : displayWeight;
      onComplete(storedWeight, parseInt(reps));
    } else if (!checked) {
      onUpdate({ is_completed: false });
    }
  };

  const displayPrevious = previousData 
    ? preferredUnit === 'kg'
      ? `${convertWeight(previousData.weight, 'lbs', 'kg')}×${previousData.reps}`
      : `${previousData.weight}×${previousData.reps}`
    : null;

  return (
    <>
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px_32px] gap-2 items-center py-2 border-b border-border/50 last:border-0">
        {/* Set Number */}
        <span className="text-center text-sm font-medium text-muted-foreground">
          {set.set_number}
        </span>
        
        {/* Previous Data */}
        <div className="text-center text-xs text-muted-foreground">
          {displayPrevious ? (
            <span>{displayPrevious}</span>
          ) : (
            <span>—</span>
          )}
        </div>
        
        {/* Weight Input - Tappable button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWeightPopup(true)}
          disabled={set.is_completed || disabled}
          className="h-9 text-center text-sm font-normal"
        >
          {weight ? `${weight}` : preferredUnit}
        </Button>
        
        {/* Reps Input */}
        <input
          type="number"
          inputMode="numeric"
          placeholder="reps"
          value={reps}
          onChange={(e) => handleRepsChange(e.target.value)}
          disabled={set.is_completed || disabled}
          className="h-9 w-full text-center text-sm rounded-md border border-input bg-background px-2"
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
      
      {/* Weight Input Popup */}
      <WeightInputPopup
        open={showWeightPopup}
        onOpenChange={setShowWeightPopup}
        currentWeight={weight}
        previousWeight={previousData?.weight}
        onLog={handleWeightLog}
        onAutofill={handleAutofill}
      />
    </>
  );
}
