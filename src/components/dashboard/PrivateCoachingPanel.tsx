import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Shield, Dumbbell, CheckCircle2, Clock } from "lucide-react";

export function PrivateCoachingPanel() {
  const { user } = useAuthStore();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      setLoading(true);
      // Check if private coaching is enabled
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

      // Fetch PT data
      const [pkgRes, sessRes] = await Promise.all([
        supabase.from("pt_packages").select("*").eq("client_user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("pt_sessions").select("*").eq("client_user_id", user!.id).order("session_date", { ascending: false }),
      ]);

      if (pkgRes.data) setPackages(pkgRes.data);
      if (sessRes.data) setSessions(sessRes.data);
      setLoading(false);
    }

    load();
  }, [user?.id]);

  // Don't render anything if not enabled or loading
  if (loading || enabled === null || !enabled) return null;

  const activePackage = packages.find((p) => p.status === "active");
  const remaining = activePackage ? activePackage.sessions_purchased - activePackage.sessions_used : 0;
  const progressPct = activePackage ? (activePackage.sessions_used / activePackage.sessions_purchased) * 100 : 0;
  const completedSessions = sessions.length;

  return (
    <div className="space-y-4">
      {/* Premium Header */}
      <div className="flex items-center gap-2">
        <Badge variant="elite" className="gap-1">
          <Shield className="h-3 w-3" />
          PRIVATE COACHING
        </Badge>
      </div>

      {/* Active Package Card */}
      {activePackage ? (
        <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent shadow-glow">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{activePackage.package_name}</p>
                <p className="text-xs text-muted-foreground">
                  Started {format(new Date(activePackage.purchase_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold font-mono text-accent">{remaining}</p>
                <p className="text-xs text-muted-foreground">sessions left</p>
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
    </div>
  );
}
