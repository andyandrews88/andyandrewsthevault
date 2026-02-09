import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ConditioningSet } from "@/types/workout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConditioningSetRowProps {
  set: ConditioningSet;
  onUpdate: (data: Partial<ConditioningSet>) => void;
  onComplete: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function ConditioningSetRow({
  set,
  onUpdate,
  onComplete,
  onRemove,
  disabled
}: ConditioningSetRowProps) {
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [distance, setDistance] = useState(set.distance?.toString() || '');
  const [calories, setCalories] = useState(set.calories?.toString() || '');

  useEffect(() => {
    if (set.duration_seconds) {
      setMinutes(Math.floor(set.duration_seconds / 60).toString());
      setSeconds((set.duration_seconds % 60).toString().padStart(2, '0'));
    }
    setDistance(set.distance?.toString() || '');
    setCalories(set.calories?.toString() || '');
  }, [set.duration_seconds, set.distance, set.calories]);

  const handleDurationChange = () => {
    const mins = parseInt(minutes) || 0;
    const secs = parseInt(seconds) || 0;
    const totalSeconds = mins * 60 + secs;
    if (totalSeconds > 0) {
      onUpdate({ duration_seconds: totalSeconds });
    }
  };

  const handleDistanceChange = (value: string) => {
    setDistance(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdate({ distance: num });
    }
  };

  const handleCaloriesChange = (value: string) => {
    setCalories(value);
    const num = parseInt(value);
    if (!isNaN(num)) {
      onUpdate({ calories: num });
    }
  };

  const handleComplete = (checked: boolean) => {
    if (checked) {
      onComplete();
    } else {
      onUpdate({ is_completed: false });
    }
  };

  const hasData = (minutes && seconds) || distance || calories;

  return (
    <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px_32px] gap-2 items-center py-2 border-b border-border/50 last:border-0">
      {/* Set Number */}
      <span className="text-center text-sm font-medium text-muted-foreground">
        {set.set_number}
      </span>
      
      {/* Duration (MM:SS) */}
      <div className="flex items-center gap-1">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="min"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          onBlur={handleDurationChange}
          disabled={set.is_completed || disabled}
          className="h-9 text-center text-sm w-12"
        />
        <span className="text-muted-foreground">:</span>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="sec"
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          onBlur={handleDurationChange}
          disabled={set.is_completed || disabled}
          className="h-9 text-center text-sm w-12"
        />
      </div>
      
      {/* Distance */}
      <div className="flex items-center gap-1">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="dist"
          value={distance}
          onChange={(e) => handleDistanceChange(e.target.value)}
          disabled={set.is_completed || disabled}
          className="h-9 text-center text-sm flex-1"
        />
        <Select 
          value={set.distance_unit} 
          onValueChange={(v) => onUpdate({ distance_unit: v as 'miles' | 'km' | 'meters' })}
          disabled={set.is_completed || disabled}
        >
          <SelectTrigger className="h-9 w-14 px-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="miles">mi</SelectItem>
            <SelectItem value="km">km</SelectItem>
            <SelectItem value="meters">m</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Calories */}
      <Input
        type="number"
        inputMode="numeric"
        placeholder="cals"
        value={calories}
        onChange={(e) => handleCaloriesChange(e.target.value)}
        disabled={set.is_completed || disabled}
        className="h-9 text-center text-sm"
      />
      
      {/* Complete Checkbox */}
      <div className="flex justify-center">
        <Checkbox
          checked={set.is_completed}
          onCheckedChange={handleComplete}
          disabled={!hasData || disabled}
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
