import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Dumbbell, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isAfter, isBefore } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface CalendarWorkout {
  id: string;
  workout_name: string;
  date: string;
  is_completed: boolean;
  total_volume: number;
}

export default function AdminClientCalendar() {
  const { userId } = useParams<{ userId: string }>();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientName = searchParams.get("client") || "Client";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workouts, setWorkouts] = useState<CalendarWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = async (date: Date) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "get_client_calendar", userId, month: date.getMonth() + 1, year: date.getFullYear() },
      });
      if (error) throw error;
      setWorkouts(typeof data === "string" ? JSON.parse(data) : data || []);
    } catch { setWorkouts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) { navigate("/"); return; }
    fetchCalendar(currentMonth);
  }, [isAdmin, adminLoading, currentMonth, userId]);

  const handlePrev = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNext = () => setCurrentMonth(prev => addMonths(prev, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0=Sun

  const today = new Date();

  const getWorkoutsForDate = (date: Date) =>
    workouts.filter(w => isSameDay(new Date(w.date + "T12:00:00"), date));

  const getStatusColor = (w: CalendarWorkout) => {
    if (w.is_completed) return "bg-green-600/80";
    const wDate = new Date(w.date + "T12:00:00");
    if (isBefore(wDate, today) && !w.is_completed) return "bg-red-500/80";
    return "bg-blue-500/80";
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayWorkouts = getWorkoutsForDate(date);
    if (dayWorkouts.length > 0) {
      // Navigate to first workout
      const w = dayWorkouts[0];
      navigate(`/admin/user/${userId}/build-workout?edit=${w.id}&name=${encodeURIComponent(w.workout_name)}&client=${encodeURIComponent(clientName)}`);
    } else {
      // Quick-add - navigate to build workout with date pre-set
      navigate(`/admin/user/${userId}/build-workout?name=New+Workout&date=${dateStr}&client=${encodeURIComponent(clientName)}`);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/user/${userId}`)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{clientName}'s Calendar</h1>
            <p className="text-xs text-muted-foreground">Click a date to add or edit workouts</p>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrev}><ChevronLeft className="h-5 w-5" /></Button>
          <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
          <Button variant="ghost" size="icon" onClick={handleNext}><ChevronRight className="h-5 w-5" /></Button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
          {/* Padding for start of month */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[80px]" />
          ))}
          {days.map(day => {
            const dayWorkouts = getWorkoutsForDate(day);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] border border-border/30 rounded-md p-1 cursor-pointer hover:bg-muted/30 transition-colors ${isToday ? "ring-1 ring-primary" : ""}`}
                onClick={() => handleDateClick(day)}
              >
                <span className={`text-xs ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </span>
                <div className="space-y-0.5 mt-0.5">
                  {dayWorkouts.map(w => (
                    <div key={w.id} className={`text-[9px] px-1 py-0.5 rounded text-white truncate ${getStatusColor(w)}`}>
                      {w.workout_name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-600/80" /> Completed</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500/80" /> Upcoming</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/80" /> Missed</span>
        </div>
      </main>
    </div>
  );
}
