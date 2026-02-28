import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
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

interface RegularWorkout {
  id: string;
  workout_name: string;
  date: string;
  is_completed: boolean | null;
  total_volume: number | null;
  notes: string | null;
}

interface RegularWorkoutMap {
  [dateStr: string]: RegularWorkout[];
}

interface ProgramCalendarViewProps {
  onSwitchToLogger?: () => void;
  onOpenWorkout?: (workoutId: string) => void;
}

export function ProgramCalendarView({ onSwitchToLogger, onOpenWorkout }: ProgramCalendarViewProps) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [workoutMap, setWorkoutMap] = useState<CalendarWorkoutMap>({});
  const [regularMap, setRegularMap] = useState<RegularWorkoutMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const { enrollments } = useProgramStore();
  const { fetchActiveWorkout, fetchWorkoutDays } = useWorkoutStore();

  useEffect(() => {
    fetchMonthData(viewMonth);
  }, [viewMonth]);

  const fetchMonthData = async (month: Date) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const userId = session.user.id;

    setIsLoading(true);
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');

    // Fetch both in parallel
    const [programResult, regularResult] = await Promise.all([
      supabase
        .from('user_calendar_workouts')
        .select(`
          *,
          program_workout:program_workouts(*),
          enrollment:user_program_enrollments!inner(*, program:programs(*))
        `)
        .eq('user_id', userId)
        .eq('enrollment.status', 'active')
        .gte('scheduled_date', start)
        .lte('scheduled_date', end),
      supabase
        .from('workouts')
        .select('id, workout_name, date, is_completed, total_volume, notes')
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end)
        .order('created_at', { ascending: true }),
    ]);

    // Build program map
    const pMap: CalendarWorkoutMap = {};
    for (const cw of (programResult.data || []) as unknown as UserCalendarWorkout[]) {
      const dateStr = cw.scheduled_date;
      if (!pMap[dateStr]) pMap[dateStr] = [];
      pMap[dateStr].push(cw);
    }
    setWorkoutMap(pMap);

    // Build regular workout map
    const rMap: RegularWorkoutMap = {};
    for (const w of (regularResult.data || []) as RegularWorkout[]) {
      const dateStr = w.date;
      if (!rMap[dateStr]) rMap[dateStr] = [];
      rMap[dateStr].push(w);
    }
    setRegularMap(rMap);

    setIsLoading(false);
  };

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedProgramWorkouts = selectedDateStr ? (workoutMap[selectedDateStr] || []) : [];
  const selectedRegularWorkouts = selectedDateStr ? (regularMap[selectedDateStr] || []) : [];

  const handleStartLogging = async () => {
    await fetchActiveWorkout();
    await fetchWorkoutDays(12);
    fetchMonthData(viewMonth);
    setSelectedDate(null);
    onSwitchToLogger?.();
  };

  const handleComplete = () => {
    fetchMonthData(viewMonth);
  };

  // Collect all dates that have any activity
  const allDatesWithActivity = new Set<string>();
  Object.keys(workoutMap).forEach(d => allDatesWithActivity.add(d));
  Object.keys(regularMap).forEach(d => allDatesWithActivity.add(d));

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
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-chart-4" />
          Logged Workout
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
                const dayProgramWorkouts = workoutMap[dateStr] || [];
                const dayRegularWorkouts = regularMap[dateStr] || [];
                const hasProgramWorkout = dayProgramWorkouts.length > 0;
                const hasRegularWorkout = dayRegularWorkouts.length > 0;
                const hasAny = hasProgramWorkout || hasRegularWorkout;

                const allProgramCompleted = hasProgramWorkout && dayProgramWorkouts.every(w => w.is_completed);
                const allRegularCompleted = hasRegularWorkout && dayRegularWorkouts.every(w => w.is_completed);
                const allCompleted = hasAny && (!hasProgramWorkout || allProgramCompleted) && (!hasRegularWorkout || allRegularCompleted);

                const today = new Date();
                const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isMissed = hasProgramWorkout && !allProgramCompleted && isPast && !isSameDay(date, today);

                return (
                  <div className="relative flex flex-col items-center justify-center h-9 w-9">
                    <span className="text-sm leading-none">{date.getDate()}</span>
                    <div className="absolute bottom-0.5 flex gap-0.5">
                      {hasProgramWorkout && (
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          allProgramCompleted ? "bg-chart-2" : isMissed ? "bg-destructive/60" : "bg-primary"
                        )} />
                      )}
                      {hasRegularWorkout && (
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          allRegularCompleted ? "bg-chart-2" : "bg-chart-4"
                        )} />
                      )}
                    </div>
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
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : ''}
            </DialogTitle>
          </DialogHeader>

          {selectedProgramWorkouts.length === 0 && selectedRegularWorkouts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Moon className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-semibold">Rest Day</p>
                <p className="text-sm text-muted-foreground mt-1">No workouts logged or scheduled for this day.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Program workouts */}
              {selectedProgramWorkouts.map(cw => (
                <DailyProgramWorkout
                  key={cw.id}
                  calendarWorkout={cw}
                  programStyle={(cw as any).enrollment?.program?.program_style}
                  date={selectedDate!}
                  onComplete={handleComplete}
                  onStartLogging={handleStartLogging}
                  onRescheduled={handleComplete}
                />
              ))}

              {/* Regular logged workouts */}
              {selectedRegularWorkouts.map(w => (
                <Card
                  key={w.id}
                  variant="elevated"
                  className="overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary/40 transition-all"
                  onClick={() => {
                    setSelectedDate(null);
                    onOpenWorkout?.(w.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-chart-4/15 flex items-center justify-center shrink-0">
                          <Dumbbell className="w-4 h-4 text-chart-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{w.workout_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {w.total_volume != null && w.total_volume > 0 && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {Math.round(w.total_volume).toLocaleString()} vol
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={w.is_completed ? "secondary" : "outline"} className="text-xs gap-1 shrink-0">
                        {w.is_completed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </>
                        ) : (
                          "In Progress"
                        )}
                      </Badge>
                    </div>
                    {w.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{w.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
