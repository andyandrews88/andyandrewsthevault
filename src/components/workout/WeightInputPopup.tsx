import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown, Delete } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { convertWeight, WeightUnit } from "@/lib/weightConversion";

interface WeightInputPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWeight: string;
  previousWeight?: number | null;
  onLog: (weight: number) => void;
  onAutofill: () => void;
}

export function WeightInputPopup({
  open,
  onOpenChange,
  currentWeight,
  previousWeight,
  onLog,
  onAutofill,
}: WeightInputPopupProps) {
  const { preferredUnit, setPreferredUnit } = useWorkoutStore();
  const [displayValue, setDisplayValue] = useState(currentWeight || "");
  const [inputUnit, setInputUnit] = useState<WeightUnit>(preferredUnit);

  useEffect(() => {
    if (open) {
      setDisplayValue(currentWeight || "");
      setInputUnit(preferredUnit);
    }
  }, [open, currentWeight, preferredUnit]);

  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      setDisplayValue(prev => prev.slice(0, -1));
    } else if (key === ".") {
      if (!displayValue.includes(".")) {
        setDisplayValue(prev => prev + ".");
      }
    } else {
      setDisplayValue(prev => prev + key);
    }
  };

  const handleLog = () => {
    const value = parseFloat(displayValue);
    if (!isNaN(value) && value > 0) {
      // Convert to lbs for storage if user entered in kg
      const storedValue = inputUnit === 'kg' ? convertWeight(value, 'kg', 'lbs') : value;
      onLog(storedValue);
      onOpenChange(false);
    }
  };

  const handleAutofill = () => {
    onAutofill();
    onOpenChange(false);
  };

  const toggleUnit = (unit: WeightUnit) => {
    if (unit !== inputUnit) {
      // Convert the current display value to the new unit
      const currentValue = parseFloat(displayValue);
      if (!isNaN(currentValue)) {
        const converted = convertWeight(currentValue, inputUnit, unit);
        setDisplayValue(converted.toString());
      }
      setInputUnit(unit);
      setPreferredUnit(unit);
    }
  };

  const numpadKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"],
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>Enter Weight</SheetTitle>
        </SheetHeader>
        
        <div className="pb-6 pt-2">
          {/* Dismiss Handle */}
          <div className="flex justify-center mb-4">
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          </div>
          
          {/* Weight Display */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex-1">
              <div className="text-4xl font-bold tracking-tight">
                {displayValue || "0"}
              </div>
            </div>
            
            {/* Unit Toggle */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={inputUnit === 'kg' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => toggleUnit('kg')}
                className="px-3 h-8"
              >
                Kg
              </Button>
              <Button
                variant={inputUnit === 'lbs' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => toggleUnit('lbs')}
                className="px-3 h-8"
              >
                Lb
              </Button>
            </div>
          </div>
          
          {/* Keypad Grid */}
          <div className="grid grid-cols-4 gap-3">
            {/* Number Keys */}
            <div className="col-span-3 grid grid-cols-3 gap-3">
              {numpadKeys.map((row, rowIndex) => (
                row.map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="lg"
                    onClick={() => handleKeyPress(key)}
                    className="h-14 text-xl font-semibold rounded-full"
                  >
                    {key === "backspace" ? <Delete className="h-5 w-5" /> : key}
                  </Button>
                ))
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                variant="hero"
                size="lg"
                onClick={handleLog}
                disabled={!displayValue || parseFloat(displayValue) <= 0}
                className="h-14 font-semibold"
              >
                Log
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                onClick={handleAutofill}
                disabled={!previousWeight}
                className="h-14 font-semibold text-xs"
              >
                Autofill
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onOpenChange(false)}
                className="h-14 font-semibold text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
          
          {/* Previous Weight Hint */}
          {previousWeight && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Previous: {preferredUnit === 'kg' ? convertWeight(previousWeight, 'lbs', 'kg') : previousWeight} {preferredUnit}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
