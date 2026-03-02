import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ExerciseSet } from "@/types/workout";
import { useState, useEffect } from "react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { convertWeight } from "@/lib/weightConversion";
import { WeightInputPopup } from "./WeightInputPopup";
import { cn } from "@/lib/utils";

interface SetRowProps {
  set: ExerciseSet;
  previousData?: { weight: number; reps: number } | null;
  onUpdate: (data: Partial<ExerciseSet>) => void;
  onComplete: (weight: number, reps: number, rir?: number | null) => void;
  onRemove: () => void;
  disabled?: boolean;
  isTimed?: boolean;
  isBodyweight?: boolean;
  isPlyometric?: boolean;
  side?: 'left' | 'right' | null;
}

export function SetRow({ 
  set, 
  previousData, 
  onUpdate, 
  onComplete, 
  onRemove,
  disabled,
  isTimed = false,
  isBodyweight = false,
  isPlyometric = false,
  side = null,
}: SetRowProps) {
  const { preferredUnit } = useWorkoutStore();
  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps, setReps] = useState(set.reps?.toString() || '');
  const [duration, setDuration] = useState(set.duration_seconds?.toString() || '');
  const [rir, setRir] = useState(set.rir?.toString() || '');
  const [heightCm, setHeightCm] = useState((set as any).height_cm?.toString() || '');
  const [distanceM, setDistanceM] = useState((set as any).distance_m?.toString() || '');
  const [speedMps, setSpeedMps] = useState((set as any).speed_mps?.toString() || '');
  const [showWeightPopup, setShowWeightPopup] = useState(false);

  const isWarmup = set.set_type === 'warmup';

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
    setDuration(set.duration_seconds?.toString() || '');
    setRir(set.rir?.toString() || '');
    setHeightCm((set as any).height_cm?.toString() || '');
    setDistanceM((set as any).distance_m?.toString() || '');
    setSpeedMps((set as any).speed_mps?.toString() || '');
  }, [set.weight, set.reps, set.rir, set.duration_seconds, (set as any).height_cm, (set as any).distance_m, (set as any).speed_mps, preferredUnit]);

  const handleRepsChange = (value: string) => {
    setReps(value);
    const num = parseInt(value);
    if (!isNaN(num)) {
      onUpdate({ reps: num });
    }
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    const num = parseInt(value);
    if (!isNaN(num)) {
      onUpdate({ duration_seconds: num } as any);
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

  const handleRirChange = (value: string) => {
    setRir(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0 && num <= 5) {
      onUpdate({ rir: num });
    } else if (value === '') {
      onUpdate({ rir: null });
    }
  };

  const handleHeightChange = (value: string) => {
    setHeightCm(value);
    const num = parseFloat(value);
    if (!isNaN(num)) onUpdate({ height_cm: num } as any);
  };

  const handleDistanceChange = (value: string) => {
    setDistanceM(value);
    const num = parseFloat(value);
    if (!isNaN(num)) onUpdate({ distance_m: num } as any);
  };

  const handleSpeedChange = (value: string) => {
    setSpeedMps(value);
    const num = parseFloat(value);
    if (!isNaN(num)) onUpdate({ speed_mps: num } as any);
  };

  const handleComplete = (checked: boolean) => {
    if (isPlyometric) {
      if (checked && !!reps) {
        const repsVal = parseInt(reps);
        onComplete(0, repsVal, null);
        // Persist plyo metrics
        onUpdate({
          height_cm: heightCm ? parseFloat(heightCm) : null,
          distance_m: distanceM ? parseFloat(distanceM) : null,
          speed_mps: speedMps ? parseFloat(speedMps) : null,
        } as any);
      } else if (!checked) {
        onUpdate({ is_completed: false });
      }
      return;
    }
    const hasValue = isTimed ? !!duration : !!reps;
    const hasWeight = isBodyweight ? true : !!weight;
    if (checked && hasWeight && hasValue) {
      const displayWeight = weight ? parseFloat(weight) : 0;
      const storedWeight = isBodyweight && !weight
        ? 0
        : preferredUnit === 'kg' 
          ? convertWeight(displayWeight, 'kg', 'lbs') 
          : displayWeight;
      const rirVal = rir ? parseInt(rir) : null;
      const repsVal = isTimed ? (parseInt(duration) || 0) : parseInt(reps);
      onComplete(storedWeight, repsVal, rirVal);
      // For timed sets, also persist duration_seconds
      if (isTimed) {
        onUpdate({ duration_seconds: parseInt(duration) || 0 } as any);
      }
    } else if (!checked) {
      onUpdate({ is_completed: false });
    }
  };

  const toggleSetType = () => {
    if (set.is_completed || disabled) return;
    const newType = isWarmup ? 'working' : 'warmup';
    onUpdate({ set_type: newType } as any);
  };

  const displayPrevious = previousData 
    ? preferredUnit === 'kg'
      ? `${convertWeight(previousData.weight, 'lbs', 'kg')}×${previousData.reps}`
      : `${previousData.weight}×${previousData.reps}`
    : null;

  return (
    <>
      {isPlyometric ? (
        /* ── Plyometric Grid: Set | Reps | Height | Distance | Speed | ✓ | × ── */
        <div className={cn(
          "grid grid-cols-[28px_1fr_1fr_1fr_1fr_36px_24px] gap-1 sm:gap-1.5 items-center py-2 border-b border-border/50 last:border-0",
          isWarmup && "opacity-60 bg-muted/20"
        )}>
          <button
            onClick={toggleSetType}
            disabled={set.is_completed || disabled}
            className={cn(
              "text-center text-sm font-medium cursor-pointer select-none rounded",
              isWarmup ? "text-warning font-bold" : "text-muted-foreground"
            )}
          >
            {isWarmup ? 'W' : set.set_number}
          </button>
          <input
            type="number" inputMode="numeric" placeholder="reps"
            value={reps}
            onChange={(e) => handleRepsChange(e.target.value)}
            disabled={set.is_completed || disabled}
            className="h-9 w-full text-center text-sm rounded-md border border-input bg-background px-1"
          />
          <input
            type="number" inputMode="decimal" placeholder="ht"
            value={heightCm}
            onChange={(e) => handleHeightChange(e.target.value)}
            disabled={set.is_completed || disabled}
            className="h-9 w-full text-center text-sm rounded-md border border-input bg-background px-1"
          />
          <input
            type="number" inputMode="decimal" placeholder="dist"
            value={distanceM}
            onChange={(e) => handleDistanceChange(e.target.value)}
            disabled={set.is_completed || disabled}
            className="h-9 w-full text-center text-sm rounded-md border border-input bg-background px-1"
          />
          <input
            type="number" inputMode="decimal" placeholder="m/s"
            value={speedMps}
            onChange={(e) => handleSpeedChange(e.target.value)}
            disabled={set.is_completed || disabled}
            className="h-9 w-full text-center text-sm rounded-md border border-input bg-background px-1"
          />
          <div className="flex justify-center">
            <Checkbox
              checked={set.is_completed}
              onCheckedChange={handleComplete}
              disabled={!reps || disabled}
              className="h-6 w-6"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} disabled={disabled} className="h-7 w-7 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        /* ── Standard Grid ── */
        <div className={cn(
          "grid grid-cols-[28px_1fr_1fr_1fr_44px_36px_24px] gap-1 sm:gap-1.5 items-center py-2 border-b border-border/50 last:border-0",
          isWarmup && "opacity-60 bg-muted/20"
        )}>
          <button
            onClick={toggleSetType}
            disabled={set.is_completed || disabled}
            className={cn(
              "text-center text-sm font-medium cursor-pointer select-none rounded flex items-center justify-center gap-0.5",
              isWarmup ? "text-warning font-bold" : "text-muted-foreground"
            )}
            title={isWarmup ? "Warmup set (tap to make working)" : "Working set (tap to make warmup)"}
          >
            {isWarmup ? 'W' : set.set_number}
            {side === 'left' && <span className="text-[9px] font-bold text-blue-400">L</span>}
            {side === 'right' && <span className="text-[9px] font-bold text-green-400">R</span>}
          </button>
          <div className="text-center text-xs text-muted-foreground">
            {displayPrevious ? <span>{displayPrevious}</span> : <span>—</span>}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowWeightPopup(true)} disabled={set.is_completed || disabled} className="h-9 text-center text-sm font-normal">
            {weight ? `${weight}` : isBodyweight ? 'BW' : preferredUnit}
          </Button>
          {isTimed ? (
            <input type="number" inputMode="numeric" placeholder="sec" value={duration} onChange={(e) => handleDurationChange(e.target.value)} disabled={set.is_completed || disabled} className="h-9 w-full text-center text-sm rounded-md border border-input bg-background px-2" />
          ) : (
            <input type="number" inputMode="numeric" placeholder="reps" value={reps} onChange={(e) => handleRepsChange(e.target.value)} disabled={set.is_completed || disabled} className="h-9 w-full text-center text-sm rounded-md border border-input bg-background px-2" />
          )}
          <input type="number" inputMode="numeric" min="0" max="5" placeholder="RIR" value={rir} onChange={(e) => handleRirChange(e.target.value)} disabled={set.is_completed || disabled} className="h-9 w-full text-center text-xs rounded-md border border-input bg-background px-1" />
          <div className="flex justify-center">
            <Checkbox checked={set.is_completed} onCheckedChange={handleComplete} disabled={((!isBodyweight && !weight) || !(isTimed ? duration : reps)) || disabled} className="h-6 w-6" />
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} disabled={disabled} className="h-7 w-7 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {!isPlyometric && (
        <WeightInputPopup
          open={showWeightPopup}
          onOpenChange={setShowWeightPopup}
          currentWeight={weight}
          previousWeight={previousData?.weight}
          onLog={handleWeightLog}
          onAutofill={handleAutofill}
          isBodyweight={isBodyweight}
        />
      )}
    </>
  );
}
