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

interface ProgressMap {
  [enrollmentId: string]: { completed: number; total: number };
}

interface TabLabelProps {
  enrollment: UserProgramEnrollment;
  progress: ProgressMap;
}

// Moved outside component so it's never re-created on each render
function EnrollmentTabLabel({ enrollment, progress }: TabLabelProps) {
  const prog = progress[enrollment.id] ?? { completed: 0, total: 0 };
  const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <ProgressRing pct={pct} />
      <div className="text-left">
        <p className="text-xs font-semibold leading-tight line-clamp-1">{enrollment.program?.name}</p>
        <p className="text-[10px] text-muted-foreground">{prog.completed}/{prog.total} done</p>
      </div>
    </div>
  );
}

// Moved outside ActiveProgramSwitcher to prevent remount on every render
interface UnenrollDialogProps {
  target: UserProgramEnrollment | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function UnenrollDialog({ target, isLoading, onConfirm, onClose }: UnenrollDialogProps) {
  return (
    <AlertDialog open={!!target} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unenroll from {target?.program?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Your scheduled workouts will be removed from the calendar. Your logged weights and history are preserved. You can re-enroll anytime from the Tracks tab.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Program</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground"
          >
            {isLoading ? "Removing…" : "Unenroll"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ActiveProgramSwitcher() {
  const {
    enrollments,
    todaysWorkouts,
    activeProgramId,
    setActiveProgram,
    fetchEnrollments,
    fetchTodaysWorkouts,
    unenrollFromProgram,
  } = useProgramStore();

  const [unenrollTarget, setUnenrollTarget] = useState<UserProgramEnrollment | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  // Single batched progress map instead of N+1 hooks
  const [progressMap, setProgressMap] = useState<ProgressMap>({});

  useEffect(() => {
    fetchEnrollments();
    fetchTodaysWorkouts();
  }, [fetchEnrollments, fetchTodaysWorkouts]);

  // Batch-fetch all enrollment progress in a single query
  useEffect(() => {
    if (enrollments.length === 0) return;

    const ids = enrollments.map(e => e.id);
    supabase
      .from("user_calendar_workouts")
      .select("enrollment_id, is_completed")
      .in("enrollment_id", ids)
      .then(({ data }) => {
        if (!data) return;
        const map: ProgressMap = {};
        for (const row of data) {
          if (!map[row.enrollment_id]) {
            map[row.enrollment_id] = { completed: 0, total: 0 };
          }
          map[row.enrollment_id].total += 1;
          if (row.is_completed) map[row.enrollment_id].completed += 1;
        }
        setProgressMap(map);
      });
  }, [enrollments]);

  if (enrollments.length === 0) return null;

  // Ensure the active tab value always corresponds to a valid enrollment
  const activeId = (activeProgramId && enrollments.some(e => e.program_id === activeProgramId))
    ? activeProgramId
    : enrollments[0]?.program_id;

  const getTodaysWorkoutForEnrollment = (enrollmentId: string) =>
    todaysWorkouts.find(w => w.enrollment_id === enrollmentId);

  const handleUnenroll = async () => {
    if (!unenrollTarget) return;
    setIsUnenrolling(true);
    await unenrollFromProgram(unenrollTarget.id);
    setUnenrollTarget(null);
    setIsUnenrolling(false);
  };

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
        <UnenrollDialog
          target={unenrollTarget}
          isLoading={isUnenrolling}
          onConfirm={handleUnenroll}
          onClose={() => setUnenrollTarget(null)}
        />
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
            value={activeId}
            onValueChange={(val) => setActiveProgram(val)}
          >
            <TabsList className="h-auto p-1 flex flex-wrap gap-1 mb-3">
              {enrollments.map(enrollment => (
                <TabsTrigger
                  key={enrollment.program_id}
                  value={enrollment.program_id}
                  className="data-[state=active]:bg-background py-2 px-3"
                >
                  <EnrollmentTabLabel enrollment={enrollment} progress={progressMap} />
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
      <UnenrollDialog
        target={unenrollTarget}
        isLoading={isUnenrolling}
        onConfirm={handleUnenroll}
        onClose={() => setUnenrollTarget(null)}
      />
    </>
  );
}
