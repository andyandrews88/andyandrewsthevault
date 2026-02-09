import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkoutDay } from "@/types/workout";

interface WeekStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  workoutDays: WorkoutDay[];
  onMonthClick: () => void;
}

export function WeekStrip({ 
  selectedDate, 
  onDateSelect, 
  workoutDays,
  onMonthClick 
}: WeekStripProps) {
  // Get the week containing the selected date (start from Monday)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Check if a date has workouts
  const hasWorkout = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return workoutDays.some(w => w.date === dateStr);
  };

  return (
    <div className="space-y-2">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between px-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onMonthClick}
          className="font-semibold text-base"
        >
          {format(selectedDate, "MMMM yyyy").toUpperCase()}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onDateSelect(new Date())}
          className="text-xs"
        >
          TODAY
        </Button>
      </div>
      
      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasWorkoutOnDay = hasWorkout(day);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded-lg transition-colors",
                isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                isTodayDate && !isSelected && "ring-1 ring-primary"
              )}
            >
              <span className="text-xs text-muted-foreground mb-1">
                {format(day, "EEE").slice(0, 3)}
              </span>
              <span className={cn(
                "text-lg font-semibold",
                isSelected && "text-primary-foreground"
              )}>
                {format(day, "d")}
              </span>
              
              {/* Workout Indicator */}
              <div className="h-1.5 mt-1">
                {hasWorkoutOnDay && (
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  )} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
