import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { format } from "date-fns";
import { Shield, Dumbbell, CheckCircle2, Clock, ChevronRight, Calendar } from "lucide-react";

export function PrivateCoachingPanel() {
  const { user } = useAuthStore();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [workoutNames, setWorkoutNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      setLoading(true);
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("private_coaching_enabled")
        .eq("id", user!.id)
        .single();

      if (!profile?.private_coaching_enabled) {
        setEnabled(false);
        setLoading(false);
        return;
      }

      setEnabled(true);

      const [pkgRes, sessRes] = await Promise.all([
        supabase.from("pt_packages").select("*").eq("client_user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("pt_sessions").select("*").eq("client_user_id", user!.id).order("session_date", { ascending: false }),
      ]);

      if (pkgRes.data) setPackages(pkgRes.data);
      if (sessRes.data) {
        setSessions(sessRes.data);
        // Fetch workout names for sessions that have workout_id
        const workoutIds = sessRes.data
          .map((s: any) => s.workout_id)
          .filter(Boolean) as string[];
        if (workoutIds.length > 0) {
          const { data: workouts } = await supabase
            .from("workouts")
            .select("id, workout_name")
            .in("id", workoutIds);
          if (workouts) {
            const map: Record<string, string> = {};
            workouts.forEach((w: any) => { map[w.id] = w.workout_name; });
            setWorkoutNames(map);
          }
        }
      }
      setLoading(false);
    }

    load();
  }, [user?.id]);

  if (loading || enabled === null || !enabled) return null;

  const activePackage = packages.find((p) => p.status === "active");
  const remaining = activePackage ? activePackage.sessions_purchased - activePackage.sessions_used : 0;
  const progressPct = activePackage ? (activePackage.sessions_used / activePackage.sessions_purchased) * 100 : 0;
  const completedSessions = sessions.length;

  const packageSessions = activePackage
    ? sessions.filter((s) => s.package_id === activePackage.id)
    : [];

  return (
    <div className="space-y-4">
      {/* Premium Header */}
      <div className="flex items-center gap-2">
        <Badge variant="elite" className="gap-1">
          <Shield className="h-3 w-3" />
          PRIVATE COACHING
        </Badge>
      </div>

      {/* Active Package Card — Tappable */}
      {activePackage ? (
        <Card
          className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent shadow-glow cursor-pointer transition-all hover:border-accent/50 hover:shadow-lg active:scale-[0.98]"
          onClick={() => setDrawerOpen(true)}
        >
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{activePackage.package_name}</p>
                <p className="text-xs text-muted-foreground">
                  Started {format(new Date(activePackage.purchase_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="text-4xl font-bold font-mono text-accent">{remaining}</p>
                  <p className="text-xs text-muted-foreground">sessions left</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {activePackage.sessions_used} completed
                </span>
                <span>{activePackage.sessions_purchased} total</span>
              </div>
              <Progress value={progressPct} className="h-2.5" />
            </div>
            <p className="text-[11px] text-muted-foreground/60 text-center">
              Tap to view session history
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground/50" />
            No active coaching package at the moment.
          </CardContent>
        </Card>
      )}

      {/* Session Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Dumbbell className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold font-mono">{completedSessions}</p>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold font-mono">{packages.filter(p => p.status === "completed").length}</p>
            <p className="text-xs text-muted-foreground">Packages Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 10).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">
                      {format(new Date(s.session_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {s.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Session Breakdown Drawer */}
      {activePackage && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-base">{activePackage.package_name}</DrawerTitle>
              <p className="text-xs text-muted-foreground">
                Started {format(new Date(activePackage.purchase_date), "MMM d, yyyy")}
              </p>
            </DrawerHeader>

            <div className="px-4 pb-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{activePackage.sessions_used} of {activePackage.sessions_purchased} sessions used</span>
                <span>{remaining} remaining</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>

            <div className="px-4 pb-6 overflow-y-auto flex-1">
              {packageSessions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No sessions logged yet</p>
                  <p className="text-xs mt-1">Sessions with your coach will appear here.</p>
                </div>
              ) : (
                <div className="relative mt-4">
                  {/* Timeline connector */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-4">
                    {packageSessions.map((s, i) => (
                      <div key={s.id} className="relative pl-6">
                        {/* Dot */}
                        <div className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-accent bg-background" />

                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            {format(new Date(s.session_date), "EEEE, MMM d yyyy")}
                          </p>
                          {s.workout_id && workoutNames[s.workout_id] && (
                            <p className="text-xs text-accent flex items-center gap-1">
                              <Dumbbell className="h-3 w-3" />
                              {workoutNames[s.workout_id]}
                            </p>
                          )}
                          {s.notes && (
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                              {s.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
