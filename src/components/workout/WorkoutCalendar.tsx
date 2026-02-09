import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { WorkoutDay } from "@/types/workout";

interface WorkoutCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  workoutDays: WorkoutDay[];
}

export function WorkoutCalendar({
  open,
  onOpenChange,
  selectedDate,
  onDateSelect,
  workoutDays,
}: WorkoutCalendarProps) {
  const [viewMonth, setViewMonth] = useState(selectedDate);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      onOpenChange(false);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setViewMonth(today);
    onDateSelect(today);
    onOpenChange(false);
  };

  // Create a set of workout dates for quick lookup
  const workoutDatesSet = new Set(workoutDays.map(w => w.date));

  // Custom modifiers for days with workouts
  const modifiers = {
    hasWorkout: (date: Date) => {
      return workoutDatesSet.has(format(date, 'yyyy-MM-dd'));
    },
  };

  const modifiersStyles = {
    hasWorkout: {
      position: 'relative' as const,
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <DialogTitle className="text-center font-semibold">
              SELECT DATE
            </DialogTitle>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleToday}
            >
              TODAY
            </Button>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={viewMonth}
            onMonthChange={setViewMonth}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border-0 p-0"
            classNames={{
              months: "flex flex-col",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center mb-4",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] flex-1 text-center",
              row: "flex w-full mt-2",
              cell: "flex-1 text-center text-sm p-0 relative",
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 mx-auto rounded-full hover:bg-muted",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
            components={{
              DayContent: ({ date }) => {
                const hasWorkout = workoutDatesSet.has(format(date, 'yyyy-MM-dd'));
                return (
                  <div className="relative flex flex-col items-center">
                    <span>{date.getDate()}</span>
                    {hasWorkout && (
                      <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                );
              },
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
