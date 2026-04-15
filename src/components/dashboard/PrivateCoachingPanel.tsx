import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Shield, Dumbbell, CheckCircle2, Clock, ChevronRight, Calendar, ExternalLink, FileText, Receipt } from "lucide-react";

interface WorkoutDetail {
  workout_name: string;
  date: string;
  total_volume: number | null;
  exercises: { name: string; sets: { weight: number | null; reps: number | null; set_number: number }[] }[];
}

export function PrivateCoachingPanel() {
  const { user } = useAuthStore();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [workoutNames, setWorkoutNames] = useState<Record<string, string>>({});
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [workoutDetail, setWorkoutDetail] = useState<WorkoutDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

      const [pkgRes, sessRes, invRes] = await Promise.all([
        supabase.from("pt_packages").select("*").eq("client_user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("pt_sessions").select("*").eq("client_user_id", user!.id).order("session_date", { ascending: false }),
        supabase.from("pt_invoices").select("*").eq("client_user_id", user!.id).order("invoice_date", { ascending: false }),
      ]);

      if (pkgRes.data) setPackages(pkgRes.data);
      if (invRes.data) setInvoices(invRes.data);
      if (sessRes.data) {
        setSessions(sessRes.data);
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

  async function openSessionDetail(session: any) {
    setSelectedSession(session);
    setWorkoutDetail(null);

    if (!session.workout_id) return;

    setDetailLoading(true);
    const { data: workout } = await supabase
      .from("workouts")
      .select("workout_name, date, total_volume")
      .eq("id", session.workout_id)
      .single();

    const { data: exercises } = await supabase
      .from("workout_exercises")
      .select("id, exercise_name, order_index")
      .eq("workout_id", session.workout_id)
      .order("order_index", { ascending: true });

    if (workout && exercises) {
      const exerciseIds = exercises.map((e: any) => e.id);
      const { data: sets } = exerciseIds.length > 0
        ? await supabase
            .from("exercise_sets")
            .select("exercise_id, set_number, weight, reps")
            .in("exercise_id", exerciseIds)
            .eq("set_type", "working")
            .eq("is_completed", true)
            .order("set_number", { ascending: true })
        : { data: [] };

      const setsMap: Record<string, any[]> = {};
      (sets || []).forEach((s: any) => {
        if (!setsMap[s.exercise_id]) setsMap[s.exercise_id] = [];
        setsMap[s.exercise_id].push(s);
      });

      setWorkoutDetail({
        workout_name: workout.workout_name,
        date: workout.date,
        total_volume: workout.total_volume,
        exercises: exercises.map((e: any) => ({
          name: e.exercise_name,
          sets: setsMap[e.id] || [],
        })),
      });
    }
    setDetailLoading(false);
  }

  if (loading || enabled === null || !enabled) return null;

  const activePackage = packages.find((p) => p.status === "active");
  const remaining = activePackage ? activePackage.sessions_purchased - activePackage.sessions_used : 0;
  const progressPct = activePackage ? (activePackage.sessions_used / activePackage.sessions_purchased) * 100 : 0;
  const completedSessions = sessions.length;

  const packageSessions = activePackage
    ? sessions.filter((s) => s.package_id === activePackage.id)
    : [];

  const packageInvoices = activePackage
    ? invoices.filter((inv) => inv.package_id === activePackage.id)
    : [];

  // Find invoice for a specific session's package
  const sessionInvoice = selectedSession
    ? invoices.find((inv) => inv.package_id === selectedSession.package_id)
    : null;

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
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{activePackage.package_name}</p>
                <p className="text-xs text-muted-foreground">
                  Started {format(new Date(activePackage.purchase_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="text-2xl font-bold font-mono text-accent">{remaining}</p>
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
            <p className="text-lg font-bold font-mono">{completedSessions}</p>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold font-mono">{packages.filter(p => p.status === "completed").length}</p>
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
                  <TableHead>Workout</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 10).map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => openSessionDetail(s)}>
                    <TableCell className="text-sm">
                      {format(new Date(s.session_date), "MMM d")}
                    </TableCell>
                    <TableCell className="text-sm text-accent">
                      {s.workout_id && workoutNames[s.workout_id] ? workoutNames[s.workout_id] : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[120px]">
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
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-4">
                    {packageSessions.map((s) => (
                      <div
                        key={s.id}
                        className="relative pl-6 cursor-pointer rounded-lg p-2 -ml-2 hover:bg-secondary/50 transition-colors"
                        onClick={() => openSessionDetail(s)}
                      >
                        <div className="absolute left-0 top-3.5 h-[15px] w-[15px] rounded-full border-2 border-accent bg-background" />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5 flex-1">
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
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices Section */}
              {packageInvoices.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Invoices</p>
                  </div>
                  <div className="space-y-2">
                    {packageInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div>
                          <p className="text-sm font-medium">
                            {inv.currency} {Number(inv.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(inv.invoice_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={inv.status === "paid" ? "success" : inv.status === "sent" ? "warning" : "outline"} className="text-[10px]">
                            {inv.status}
                          </Badge>
                          {inv.invoice_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(inv.invoice_url, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Button>
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

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-accent" />
              {selectedSession && format(new Date(selectedSession.session_date), "EEEE, MMM d yyyy")}
            </DialogTitle>
          </DialogHeader>

          {selectedSession?.notes && (
            <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Coach Notes</p>
              <p className="text-sm">{selectedSession.notes}</p>
            </div>
          )}

          {detailLoading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">Loading workout...</div>
          ) : workoutDetail ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{workoutDetail.workout_name}</p>
                {workoutDetail.total_volume != null && workoutDetail.total_volume > 0 && (
                  <Badge variant="data" className="text-[10px]">
                    {Math.round(workoutDetail.total_volume).toLocaleString()} kg vol
                  </Badge>
                )}
              </div>
              {workoutDetail.exercises.map((ex, i) => (
                <div key={i} className="border border-border/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">{ex.name}</p>
                  {ex.sets.length > 0 ? (
                    <div className="space-y-1">
                      {ex.sets.map((set, j) => (
                        <div key={j} className="flex justify-between text-xs text-muted-foreground font-mono">
                          <span>Set {set.set_number}</span>
                          <span>
                            {set.weight != null ? `${set.weight}kg` : "BW"} × {set.reps ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No sets recorded</p>
                  )}
                </div>
              ))}
            </div>
          ) : selectedSession?.workout_id ? (
            <p className="text-sm text-muted-foreground text-center py-4">Could not load workout details.</p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No linked workout for this session.</p>
          )}

          {/* Invoice link in dialog */}
          {sessionInvoice && sessionInvoice.invoice_url && (
            <div className="pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => window.open(sessionInvoice.invoice_url, "_blank")}
              >
                <FileText className="h-4 w-4" />
                View Invoice — {sessionInvoice.currency} {Number(sessionInvoice.amount).toFixed(2)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
