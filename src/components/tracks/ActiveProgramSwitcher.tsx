import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProgramStore, UserProgramEnrollment } from "@/stores/programStore";
import { DailyProgramWorkout } from "./DailyProgramWorkout";
import { Dumbbell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Progress ring SVG
function ProgressRing({ pct, size = 32, stroke = 3 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

// Single enrollment progress stats
function useEnrollmentProgress(enrollmentId: string) {
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase
      .from("user_calendar_workouts")
      .select("is_completed", { count: "exact" })
      .eq("enrollment_id", enrollmentId)
      .then(({ data, count }) => {
        setTotal(count ?? 0);
        setCompleted((data ?? []).filter((w) => w.is_completed).length);
      });
  }, [enrollmentId]);

  return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

interface TabLabelProps {
  enrollment: UserProgramEnrollment;
}

function EnrollmentTabLabel({ enrollment }: TabLabelProps) {
  const { completed, total, pct } = useEnrollmentProgress(enrollment.id);
  return (
    <div className="flex items-center gap-2">
      <ProgressRing pct={pct} />
      <div className="text-left">
        <p className="text-xs font-semibold leading-tight line-clamp-1">{enrollment.program?.name}</p>
        <p className="text-[10px] text-muted-foreground">{completed}/{total} done</p>
      </div>
    </div>
  );
}

export function ActiveProgramSwitcher() {
  const { enrollments, todaysWorkouts, activeProgramId, setActiveProgram, fetchEnrollments, fetchTodaysWorkouts, unenrollFromProgram } = useProgramStore();
  const [unenrollTarget, setUnenrollTarget] = useState<UserProgramEnrollment | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  useEffect(() => {
    fetchEnrollments();
    fetchTodaysWorkouts();
  }, [fetchEnrollments, fetchTodaysWorkouts]);

  if (enrollments.length === 0) return null;

  const activeId = activeProgramId ?? enrollments[0]?.program_id;

  const getTodaysWorkoutForEnrollment = (enrollmentId: string) =>
    todaysWorkouts.find(w => w.enrollment_id === enrollmentId);

  const handleUnenroll = async () => {
    if (!unenrollTarget) return;
    setIsUnenrolling(true);
    await unenrollFromProgram(unenrollTarget.id);
    setUnenrollTarget(null);
    setIsUnenrolling(false);
  };

  const UnenrollDialog = () => (
    <AlertDialog open={!!unenrollTarget} onOpenChange={open => !open && setUnenrollTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unenroll from {unenrollTarget?.program?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Your scheduled workouts will be removed from the calendar. Your logged weights and history are preserved. You can re-enroll anytime from the Tracks tab.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Program</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnenroll}
            disabled={isUnenrolling}
            className="bg-destructive text-destructive-foreground"
          >
            {isUnenrolling ? "Removing…" : "Unenroll"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Single program — compact card view
  if (enrollments.length === 1) {
    const enrollment = enrollments[0];
    const cw = getTodaysWorkoutForEnrollment(enrollment.id);
    return (
      <>
        <Card variant="data" className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{enrollment.program?.name}</span>
              <Badge variant="secondary" className="text-xs ml-auto">Today</Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => setUnenrollTarget(enrollment)}
                title="Unenroll from program"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
            <DailyProgramWorkout
              calendarWorkout={cw}
              programStyle={enrollment.program?.program_style}
              onRescheduled={fetchTodaysWorkouts}
            />
          </CardContent>
        </Card>
        <UnenrollDialog />
      </>
    );
  }

  // Multiple programs — tab switcher
  return (
    <>
      <Card variant="data" className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Program Switcher</span>
            <Badge variant="secondary" className="text-xs ml-auto">{enrollments.length} active</Badge>
          </div>

          <Tabs
            value={activeId ?? enrollments[0].program_id}
            onValueChange={(val) => setActiveProgram(val)}
          >
            <TabsList className="h-auto p-1 flex flex-wrap gap-1 mb-3">
              {enrollments.map(enrollment => (
                <TabsTrigger
                  key={enrollment.program_id}
                  value={enrollment.program_id}
                  className="data-[state=active]:bg-background py-2 px-3"
                >
                  <EnrollmentTabLabel enrollment={enrollment} />
                </TabsTrigger>
              ))}
            </TabsList>

            {enrollments.map(enrollment => {
              const cw = getTodaysWorkoutForEnrollment(enrollment.id);
              return (
                <TabsContent key={enrollment.program_id} value={enrollment.program_id}>
                  <div className="flex justify-end mb-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setUnenrollTarget(enrollment)}
                    >
                      <LogOut className="w-3 h-3 mr-1" />
                      Unenroll
                    </Button>
                  </div>
                  <DailyProgramWorkout
                    calendarWorkout={cw}
                    programStyle={enrollment.program?.program_style}
                    onRescheduled={fetchTodaysWorkouts}
                  />
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
      <UnenrollDialog />
    </>
  );
}
