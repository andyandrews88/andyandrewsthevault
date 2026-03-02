import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, addDays, eachDayOfInterval } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { WeeklyCalendarGrid } from "@/components/admin/WeeklyCalendarGrid";
import { CalendarWorkoutDrawer } from "@/components/admin/CalendarWorkoutDrawer";
import type { WorkoutWithExercises } from "@/components/admin/CalendarWorkoutCard";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminClientCalendar() {
  const { userId } = useParams<{ userId: string }>();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientName = searchParams.get("client") || "Client";
  const isMobile = useIsMobile();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithExercises | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [mobileDay, setMobileDay] = useState(0);

  // 2 weeks of days (Mon-Sun × 2)
  const days = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 13),
  });

  const fetchWeek = useCallback(async (start: Date) => {
    if (!userId) return;
    setLoading(true);
    try {
      const startDate = format(start, "yyyy-MM-dd");
      const endDate = format(addDays(start, 13), "yyyy-MM-dd");
      const { data, error } = await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "get_client_week", userId, startDate, endDate },
      });
      if (error) throw error;
      const parsed = typeof data === "string" ? JSON.parse(data) : data || [];
      setWorkouts(parsed);
    } catch {
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) { navigate("/"); return; }
    fetchWeek(weekStart);
  }, [isAdmin, adminLoading, weekStart, userId, fetchWeek]);

  const handlePrev = () => setWeekStart((prev) => subWeeks(prev, 1));
  const handleNext = () => setWeekStart((prev) => addWeeks(prev, 1));
  const handleToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Group workouts by date
  const workoutsByDate = new Map<string, WorkoutWithExercises[]>();
  for (const w of workouts) {
    const key = w.date;
    if (!workoutsByDate.has(key)) workoutsByDate.set(key, []);
    workoutsByDate.get(key)!.push(w);
  }

  const handleAddNew = (date: Date) => {
    setSelectedWorkout(null);
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setDrawerOpen(true);
  };

  const handleCardClick = (workout: WorkoutWithExercises) => {
    setSelectedWorkout(workout);
    setSelectedDate(workout.date);
    setDrawerOpen(true);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "delete_workout", workoutId },
      });
      toast({ title: "Workout deleted" });
      fetchWeek(weekStart);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24"><Skeleton className="h-96" /></main>
      </div>
    );
  }

  const mobileWeekDays = days.slice(0, 7);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-2 sm:px-4 pt-20 pb-12 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/user/${userId}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{clientName}'s Calendar</h1>
          </div>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {format(weekStart, "MMM d")} – {format(addDays(weekStart, 13), "MMM d, yyyy")}
            </span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleToday}>
              <CalendarIcon className="h-3 w-3 mr-1" /> Today
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px] rounded-md" />
            ))}
          </div>
        ) : isMobile ? (
          /* Mobile: week strip + day detail */
          <div className="space-y-3">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {mobileWeekDays.map((d, i) => {
                const key = format(d, "yyyy-MM-dd");
                const count = workoutsByDate.get(key)?.length || 0;
                return (
                  <button
                    key={key}
                    onClick={() => setMobileDay(i)}
                    className={`flex-shrink-0 w-12 rounded-lg py-2 text-center border transition-colors ${
                      mobileDay === i
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground"
                    }`}
                  >
                    <div className="text-[10px] font-medium">{format(d, "EEE")}</div>
                    <div className="text-sm font-bold">{format(d, "d")}</div>
                    {count > 0 && (
                      <div className="mx-auto mt-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day workouts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {format(mobileWeekDays[mobileDay], "EEEE, MMM d")}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleAddNew(mobileWeekDays[mobileDay])}
                >
                  <CalendarIcon className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {(workoutsByDate.get(format(mobileWeekDays[mobileDay], "yyyy-MM-dd")) || []).map((w) => (
                <div key={w.id} className="relative group">
                  <div onClick={() => handleCardClick(w)}>
                    <div className="border border-border rounded-lg p-3 bg-card space-y-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${w.is_completed ? "bg-green-500" : "bg-blue-500"}`} />
                        <span className="font-semibold text-sm">{w.workout_name}</span>
                      </div>
                      {w.exercises.map((ex, i) => (
                        <div key={ex.id} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70">{String.fromCharCode(65 + i)})</span>{" "}
                          {ex.exercise_name}
                          {ex.sets.length > 0 && (
                            <span className="ml-1 text-muted-foreground/60">
                              {ex.sets.length}×{ex.sets[0]?.reps || "—"}
                              {ex.sets[0]?.weight ? ` @${ex.sets[0].weight}` : ""}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 opacity-60"
                    onClick={() => handleDeleteWorkout(w.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
              {!(workoutsByDate.get(format(mobileWeekDays[mobileDay], "yyyy-MM-dd")) || []).length && (
                <p className="text-xs text-muted-foreground text-center py-8 italic">Rest day</p>
              )}
            </div>
          </div>
        ) : (
          <WeeklyCalendarGrid
            days={days}
            workoutsByDate={workoutsByDate}
            onAddNew={handleAddNew}
            onCardClick={handleCardClick}
            onDeleteWorkout={handleDeleteWorkout}
          />
        )}

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Completed</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Upcoming</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Missed</span>
        </div>
      </main>

      <CalendarWorkoutDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        workout={selectedWorkout}
        userId={userId || ""}
        date={selectedDate}
        onSaved={() => fetchWeek(weekStart)}
      />
    </div>
  );
}
