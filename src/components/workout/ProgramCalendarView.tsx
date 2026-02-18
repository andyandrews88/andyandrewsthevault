import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Dumbbell, Moon, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserCalendarWorkout, useProgramStore } from "@/stores/programStore";
import { DailyProgramWorkout } from "@/components/tracks/DailyProgramWorkout";
import { useWorkoutStore } from "@/stores/workoutStore";
import { cn } from "@/lib/utils";

interface CalendarWorkoutMap {
  [dateStr: string]: UserCalendarWorkout[];
}

interface ProgramCalendarViewProps {
  onSwitchToLogger?: () => void;
}

export function ProgramCalendarView({ onSwitchToLogger }: ProgramCalendarViewProps) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [workoutMap, setWorkoutMap] = useState<CalendarWorkoutMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const { enrollments, fetchEnrollments } = useProgramStore();
  const { fetchActiveWorkout, fetchWorkoutDays } = useWorkoutStore();

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  useEffect(() => {
    fetchMonthWorkouts(viewMonth);
  }, [viewMonth]);

  const fetchMonthWorkouts = async (month: Date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsLoading(true);
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('user_calendar_workouts')
      .select(`
        *,
        program_workout:program_workouts(*),
        enrollment:user_program_enrollments(*, program:programs(*))
      `)
      .eq('user_id', user.id)
      .gte('scheduled_date', start)
      .lte('scheduled_date', end);

    const map: CalendarWorkoutMap = {};
    for (const cw of (data || []) as unknown as UserCalendarWorkout[]) {
      const dateStr = cw.scheduled_date;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(cw);
    }
    setWorkoutMap(map);
    setIsLoading(false);
  };

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedWorkouts = selectedDateStr ? (workoutMap[selectedDateStr] || []) : [];

  const handleStartLogging = async () => {
    await fetchActiveWorkout();
    await fetchWorkoutDays(12);
    fetchMonthWorkouts(viewMonth);
    // Close the detail dialog and switch to the Log Workout tab
    setSelectedDate(null);
    onSwitchToLogger?.();
  };

  const handleComplete = () => {
    fetchMonthWorkouts(viewMonth);
  };

  if (enrollments.length === 0) {
    return (
      <Card variant="data">
        <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">No Programs Enrolled</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enroll in a program from the Tracks tab to see your scheduled workouts here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          Scheduled
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-chart-2" />
          Completed
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          Missed
        </div>
      </div>

      {/* Calendar */}
      <Card variant="data">
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMonth(m => {
                const prev = new Date(m);
                prev.setMonth(prev.getMonth() - 1);
                return prev;
              })}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm">{format(viewMonth, 'MMMM yyyy')}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMonth(m => {
                const next = new Date(m);
                next.setMonth(next.getMonth() + 1);
                return next;
              })}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(date) => setSelectedDate(date ?? null)}
            month={viewMonth}
            onMonthChange={setViewMonth}
            className={cn("p-0 pointer-events-auto w-full")}
            classNames={{
              months: "flex flex-col w-full",
              month: "space-y-3 w-full",
              caption: "hidden",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground flex-1 font-normal text-[0.75rem] text-center py-1",
              row: "flex w-full mt-1",
              cell: "flex-1 text-center text-sm p-0 relative",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 mx-auto rounded-full hover:bg-muted transition-colors",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-40",
              day_disabled: "text-muted-foreground opacity-50",
            }}
            components={{
              DayContent: ({ date }) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayWorkouts = workoutMap[dateStr] || [];
                const hasWorkout = dayWorkouts.length > 0;
                const allCompleted = hasWorkout && dayWorkouts.every(w => w.is_completed);
                const today = new Date();
                const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isMissed = hasWorkout && !allCompleted && isPast && !isSameDay(date, today);

                return (
                  <div className="relative flex flex-col items-center justify-center h-9 w-9">
                    <span className="text-sm leading-none">{date.getDate()}</span>
                    {hasWorkout && (
                      <div className={cn(
                        "absolute bottom-0.5 w-1.5 h-1.5 rounded-full",
                        allCompleted ? "bg-chart-2" : isMissed ? "bg-destructive/60" : "bg-primary"
                      )} />
                    )}
                    {allCompleted && (
                      <CheckCircle2 className="absolute top-0 right-0 w-3 h-3 text-chart-2" />
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Detail drawer for selected date */}
      <Dialog open={!!selectedDate && selectedWorkouts.length >= 0} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : ''}
            </DialogTitle>
          </DialogHeader>

          {selectedWorkouts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Moon className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-semibold">Rest Day</p>
                <p className="text-sm text-muted-foreground mt-1">No program workouts scheduled for this day.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedWorkouts.map(cw => (
                <DailyProgramWorkout
                  key={cw.id}
                  calendarWorkout={cw}
                  programStyle={(cw as any).enrollment?.program?.program_style}
                  date={selectedDate!}
                  onComplete={handleComplete}
                  onStartLogging={handleStartLogging}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
