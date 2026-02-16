import { format, addDays, subDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const hasWorkout = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return workoutDays.some(w => w.date === dateStr);
  };

  const goToPreviousWeek = () => onDateSelect(subDays(selectedDate, 7));
  const goToNextWeek = () => onDateSelect(addDays(selectedDate, 7));

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
      
      {/* Week Days with Navigation Arrows */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="grid grid-cols-7 gap-1 flex-1">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const hasWorkoutOnDay = hasWorkout(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "flex flex-col items-center justify-center min-h-[56px] py-2 px-1 rounded-lg transition-colors",
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
        
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={goToNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
