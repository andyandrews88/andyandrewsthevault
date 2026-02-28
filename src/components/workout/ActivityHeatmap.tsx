import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { WorkoutDay } from "@/types/workout";
import { format, subDays, startOfWeek, addDays, differenceInDays, isToday, isSameDay } from "date-fns";
import { DateRangeSelector, computeRange } from "@/components/ui/DateRangeSelector";

export function ActivityHeatmap() {
  const { fetchWorkoutDays } = useWorkoutStore();
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [weeksToShow, setWeeksToShow] = useState(12);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const loadData = useCallback(async (from: Date, to: Date) => {
    setIsLoading(true);
    const weeks = Math.max(1, Math.ceil(differenceInDays(to, from) / 7));
    setWeeksToShow(weeks);
    const data = await fetchWorkoutDays(weeks);
    setWorkoutDays(data);
    setIsLoading(false);
  }, [fetchWorkoutDays]);

  useEffect(() => {
    const { from, to } = computeRange("3M");
    loadData(from, to);
  }, [loadData]);

  // Create the calendar grid
  const today = new Date();
  const startDate = startOfWeek(subDays(today, weeksToShow * 7), { weekStartsOn: 1 });
  
  const workoutDaySet = new Set(workoutDays.map(d => d.date));
  
  // Calculate current streak
  let currentStreak = 0;
  let checkDate = today;
  while (workoutDaySet.has(format(checkDate, 'yyyy-MM-dd')) || isToday(checkDate)) {
    if (workoutDaySet.has(format(checkDate, 'yyyy-MM-dd'))) {
      currentStreak++;
    }
    if (!isToday(checkDate) && !workoutDaySet.has(format(checkDate, 'yyyy-MM-dd'))) {
      break;
    }
    checkDate = subDays(checkDate, 1);
  }

  // Generate weeks array
  const weeks: Date[][] = [];
  let currentWeekStart = startDate;
  
  for (let w = 0; w < weeksToShow; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(currentWeekStart, d));
    }
    weeks.push(week);
    currentWeekStart = addDays(currentWeekStart, 7);
  }

  const getCellColor = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasWorkout = workoutDaySet.has(dateStr);
    const isFuture = date > today;
    
    if (isFuture) return 'bg-muted/20';
    if (hasWorkout) return 'bg-primary';
    return 'bg-muted/50';
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                Training Consistency
              </CardTitle>
              <CardDescription>Last {weeksToShow} weeks of activity</CardDescription>
            </div>
            {currentStreak > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{currentStreak}</p>
                <p className="text-xs text-muted-foreground">day streak</p>
              </div>
            )}
          </div>
          <DateRangeSelector defaultPreset="3M" onRangeChange={loadData} />
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="space-y-2">
            {/* Grid */}
            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
                {days.map(day => (
                  <div key={day} className="h-3 flex items-center">
                    {['Mon', 'Wed', 'Fri'].includes(day) ? day : ''}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="flex gap-1 overflow-x-auto">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((date, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 rounded-sm ${getCellColor(date)} transition-colors`}
                        title={`${format(date, 'MMM d, yyyy')}${workoutDaySet.has(format(date, 'yyyy-MM-dd')) ? ' - Workout logged' : ''}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/50" />
                <span>No workout</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>Workout logged</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
                <p className="text-xl font-bold">{workoutDays.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Avg per Week</p>
                <p className="text-xl font-bold">
                  {(workoutDays.length / weeksToShow).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
