import { useEffect, useState, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  ChevronLeft, User, Dumbbell, Award, Heart, Target, MessageSquare, Scale, Mail, Calendar, Send, Copy, ClipboardList,
  Moon, Zap, Brain, Flame, UtensilsCrossed, BookOpen, Settings2, RotateCcw, Trash2, Pencil, Shield,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useCommunityStore } from "@/stores/communityStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { AdminWorkoutBuilder } from "@/components/admin/AdminWorkoutBuilder";
import { CopyWorkoutDialog } from "@/components/admin/CopyWorkoutDialog";
import { AssignTemplateWizard } from "@/components/admin/AssignTemplateWizard";
import { TouchpointLog } from "@/components/admin/TouchpointLog";
import { ClientPerformanceReport } from "@/components/admin/ClientPerformanceReport";
import { CoachingAnalyticsDashboard } from "@/components/admin/CoachingAnalyticsDashboard";
import { ClientAIReport } from "@/components/admin/ClientAIReport";
import { PTSessionTracker } from "@/components/admin/PTSessionTracker";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { CollapsibleDashboardSection } from "@/components/ui/CollapsibleDashboardSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const DEFAULT_ORDER = [
  "stats", "readiness", "ai-report", "compliance", "training",
  "pt-tracker", "checkins", "goals", "nutrition", "community",
  "body-entries", "messages", "analytics", "performance", "notes",
];

const SECTION_META: Record<string, { title: string }> = {
  stats: { title: "Stats Summary" },
  readiness: { title: "Readiness & Lifestyle" },
  "ai-report": { title: "AI Client Report" },
  compliance: { title: "Program Compliance" },
  training: { title: "Training" },
  "pt-tracker": { title: "PT Session Tracker" },
  checkins: { title: "Check-in History" },
  goals: { title: "Goals" },
  nutrition: { title: "Nutrition" },
  community: { title: "Community" },
  "body-entries": { title: "Body Entries" },
  messages: { title: "Private Message" },
  analytics: { title: "Coaching Analytics" },
  performance: { title: "Performance Report" },
  notes: { title: "Coaching Notes" },
};

export default function AdminUserProfile() {
  const isMobile = useIsMobile();
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);
  const { userId } = useParams<{ userId: string }>();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const { user: adminUser } = useAuthStore();
  const { sendDirectMessage, fetchDirectMessages, directMessages } = useCommunityStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dmContent, setDmContent] = useState('');
  const [dmSending, setDmSending] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyWorkout, setCopyWorkout] = useState<{ id: string; name: string } | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [privateCoaching, setPrivateCoaching] = useState(false);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);

  const { order, moveUp, moveDown, toggleCollapse, isCollapsed, resetLayout } = useDashboardLayout("admin-profile-layout", DEFAULT_ORDER);

  const dmHistory = directMessages.filter(
    dm => dm.to_user_id === userId || dm.from_user_id === userId
  );

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) { navigate("/"); return; }
    if (!userId) return;

    async function fetchProfile() {
      try {
        const { data: result, error } = await supabase.functions.invoke("admin-user-profile", {
          body: { userId },
        });
        if (error) throw error;
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [isAdmin, adminLoading, userId, navigate]);

  useEffect(() => {
    if (adminUser && isAdmin) {
      fetchDirectMessages(adminUser.id);
    }
  }, [adminUser, isAdmin, fetchDirectMessages]);

  // Sync private coaching state from profile data (must be before early returns)
  useEffect(() => {
    if (data?.profile?.private_coaching_enabled !== undefined) {
      setPrivateCoaching(!!data.profile.private_coaching_enabled);
    }
  }, [data?.profile?.private_coaching_enabled]);

  const handleSendDm = async () => {
    if (!dmContent.trim() || !adminUser || !userId) return;
    setDmSending(true);
    try {
      await sendDirectMessage(adminUser.id, userId, dmContent.trim());
      setDmContent('');
      toast({ title: 'Message sent', description: 'Your private message has been sent.' });
      fetchDirectMessages(adminUser.id);
    } catch (e) {
      toast({ title: 'Failed to send', description: 'Could not send message.', variant: 'destructive' });
    } finally {
      setDmSending(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-destructive">{error || "User not found"}</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/admin")}>Back to Admin</Button>
        </main>
      </div>
    );
  }

  const p = data.profile;
  const daysSince = data.joinDate ? Math.floor((Date.now() - new Date(data.joinDate).getTime()) / 86400000) : 0;

  const togglePrivateCoaching = async (checked: boolean) => {
    setPrivateCoaching(checked);
    try {
      const { data: result, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "toggle_coaching", targetUserId: userId, enabled: checked },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      // Sync local data state so re-renders don't revert the toggle
      setData((prev: any) => prev ? { ...prev, profile: { ...prev.profile, private_coaching_enabled: checked } } : prev);
      toast({ title: checked ? "Private coaching enabled" : "Private coaching disabled" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to update", variant: "destructive" });
      setPrivateCoaching(!checked);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Workout deleted" });
    // Re-fetch profile data
    try {
      const { data: result } = await supabase.functions.invoke("admin-user-profile", { body: { userId } });
      if (result) setData(result);
    } catch {}
    setDeleteWorkoutId(null);
  };

  // Section renderers
  const sections: Record<string, () => ReactNode> = {
    stats: () => (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="glass border-border/50"><CardContent className="p-3 text-center"><Dumbbell className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data.training.completedCount}</p><p className="text-xs text-muted-foreground">Workouts</p></CardContent></Card>
        <Card className="glass border-border/50"><CardContent className="p-3 text-center"><Award className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data.training.prs.length}</p><p className="text-xs text-muted-foreground">PRs</p></CardContent></Card>
        <Card className="glass border-border/50"><CardContent className="p-3 text-center"><Heart className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data.checkins.streak}</p><p className="text-xs text-muted-foreground">Day Streak</p></CardContent></Card>
        <Card className="glass border-border/50"><CardContent className="p-3 text-center"><Target className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data.goals.length}</p><p className="text-xs text-muted-foreground">Goals</p></CardContent></Card>
        <Card className="glass border-border/50"><CardContent className="p-3 text-center"><MessageSquare className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data.community.totalPosts}</p><p className="text-xs text-muted-foreground">Posts</p></CardContent></Card>
      </div>
    ),
    readiness: () => {
      if (!data.checkins.avgScores) return <p className="text-sm text-muted-foreground">No check-in data yet.</p>;
      return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {data.checkins.avgScores.avgSleepHours && (
            <Card className="glass border-border/50 border-l-4 border-l-purple-500"><CardContent className="p-3 text-center"><Moon className="h-4 w-4 mx-auto text-purple-500 mb-1" /><p className="text-xl font-bold">{data.checkins.avgScores.avgSleepHours}h</p><p className="text-xs text-muted-foreground">Avg Sleep</p></CardContent></Card>
          )}
          <Card className="glass border-border/50 border-l-4 border-l-blue-500"><CardContent className="p-3 text-center"><Moon className="h-4 w-4 mx-auto text-blue-500 mb-1" /><p className="text-xl font-bold">{data.checkins.avgScores.sleep}/5</p><p className="text-xs text-muted-foreground">Sleep Quality</p></CardContent></Card>
          <Card className="glass border-border/50 border-l-4 border-l-yellow-500"><CardContent className="p-3 text-center"><Zap className="h-4 w-4 mx-auto text-yellow-500 mb-1" /><p className="text-xl font-bold">{data.checkins.avgScores.energy}/5</p><p className="text-xs text-muted-foreground">Avg Energy</p></CardContent></Card>
          <Card className="glass border-border/50 border-l-4 border-l-red-500"><CardContent className="p-3 text-center"><Brain className="h-4 w-4 mx-auto text-red-500 mb-1" /><p className="text-xl font-bold">{data.checkins.avgScores.stress}/5</p><p className="text-xs text-muted-foreground">Avg Stress</p></CardContent></Card>
          <Card className="glass border-border/50 border-l-4 border-l-orange-500"><CardContent className="p-3 text-center"><Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" /><p className="text-xl font-bold">{data.checkins.avgScores.drive}/5</p><p className="text-xs text-muted-foreground">Avg Drive</p></CardContent></Card>
        </div>
      );
    },
    "ai-report": () => <ClientAIReport userId={userId!} displayName={p?.display_name || "User"} />,
    compliance: () => {
      if (!data.programCompliance?.length) return <p className="text-sm text-muted-foreground">No program enrollments.</p>;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.programCompliance.map((pc: any) => (
            <Card key={pc.enrollmentId} className="glass border-border/50">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{pc.programName}</p>
                  <p className="text-xs text-muted-foreground">{pc.completed}/{pc.scheduled} workouts · Started {pc.startDate ? format(new Date(pc.startDate), "MMM d") : "—"}</p>
                </div>
                <div className="text-right">
                  <Badge variant={pc.status === "active" ? "default" : "secondary"} className="capitalize text-[10px]">{pc.status}</Badge>
                  {pc.compliancePct !== null && (
                    <p className={`text-lg font-mono font-bold mt-1 ${pc.compliancePct >= 80 ? "text-green-500" : pc.compliancePct >= 50 ? "text-yellow-500" : "text-red-500"}`}>{pc.compliancePct}%</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    },
    training: () => (
      <section className="space-y-3">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/admin/user/${userId}/calendar?client=${encodeURIComponent(p?.display_name || 'User')}`)}>
            <Calendar className="h-3.5 w-3.5" />Calendar
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setAssignOpen(true)}>
            <ClipboardList className="h-3.5 w-3.5" />Assign Program
          </Button>
          <AdminWorkoutBuilder userId={userId!} displayName={p?.display_name || "User"} onWorkoutSaved={async () => {
            try {
              const { data: result } = await supabase.functions.invoke("admin-user-profile", { body: { userId } });
              if (result) setData(result);
            } catch {}
          }} />
        </div>
        {data.training.workouts.length > 0 && (
          <Card className="glass border-border/50">
            {isMobile ? (
              /* Mobile: card layout for workouts */
              <CardContent className="p-3 space-y-2">
                {data.training.workouts.slice(0, 15).map((w: any) => (
                  <div key={w.id} className="p-3 rounded-lg border border-border/50 space-y-1.5"
                    onClick={() => navigate(`/admin/user/${userId}/build-workout?edit=${w.id}&name=${encodeURIComponent(w.workout_name)}&client=${encodeURIComponent(p?.display_name || 'User')}`)}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate flex-1">{w.workout_name}</p>
                      <Badge variant={w.is_completed ? "default" : "secondary"} className={`text-[10px] shrink-0 ${w.is_completed ? 'bg-green-600/80' : 'bg-amber-500/80'}`}>{w.is_completed ? "Done" : "Active"}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(w.date), "MMM d, yyyy")}</span>
                      <span>{Number(w.total_volume || 0).toLocaleString()} kg</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); navigate(`/admin/user/${userId}/build-workout?edit=${w.id}&name=${encodeURIComponent(w.workout_name)}&client=${encodeURIComponent(p?.display_name || 'User')}`); }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setCopyWorkout({ id: w.id, name: w.workout_name }); setCopyDialogOpen(true); }}><Copy className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60" onClick={(e) => { e.stopPropagation(); setDeleteWorkoutId(w.id); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            ) : (
              /* Desktop: table layout */
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workout</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Volume</TableHead><TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.training.workouts.slice(0, 15).map((w: any) => (
                      <TableRow key={w.id} className="cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => navigate(`/admin/user/${userId}/build-workout?edit=${w.id}&name=${encodeURIComponent(w.workout_name)}&client=${encodeURIComponent(p?.display_name || 'User')}`)}>
                        <TableCell className="text-sm font-medium">{w.workout_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(w.date), "MMM d, yyyy")}</TableCell>
                        <TableCell><Badge variant={w.is_completed ? "default" : "secondary"} className={`text-[10px] ${w.is_completed ? 'bg-green-600/80' : 'bg-amber-500/80'}`}>{w.is_completed ? "Completed" : "In Progress"}</Badge></TableCell>
                        <TableCell className="text-right text-sm">{Number(w.total_volume || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); navigate(`/admin/user/${userId}/build-workout?edit=${w.id}&name=${encodeURIComponent(w.workout_name)}&client=${encodeURIComponent(p?.display_name || 'User')}`); }} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setCopyWorkout({ id: w.id, name: w.workout_name }); setCopyDialogOpen(true); }} title="Copy"><Copy className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteWorkoutId(w.id); }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        )}
        {data.training.prs.length > 0 && (
          <Card className="glass border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Personal Records</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {data.training.prs.map((pr: any) => (
                  <div key={pr.id} className="flex justify-between text-sm"><span>{pr.exercise_name}</span><span className="text-muted-foreground">{pr.max_weight}kg × {pr.max_reps || 1} — {format(new Date(pr.achieved_at), "MMM d")}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    ),
    "pt-tracker": () => <PTSessionTracker clientUserId={userId!} clientDisplayName={p?.display_name || "User"} />,
    checkins: () => {
      if (!data.checkins.totalCount) return <p className="text-sm text-muted-foreground">No check-ins recorded.</p>;
      return (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{data.checkins.totalCount} check-ins · {data.checkins.streak} day streak</CardTitle></CardHeader>
          {isMobile ? (
            /* Mobile: compact cards for check-ins */
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-2">
                {data.checkins.entries.slice(0, 14).map((c: any) => (
                  <div key={c.id} className="p-2.5 rounded-lg border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{format(new Date(c.check_date), "MMM d")}</p>
                    <div className="grid grid-cols-5 gap-1 text-center">
                      <div><p className="text-xs text-muted-foreground">Sleep</p><p className="text-sm font-semibold">{c.sleep_hours ? `${c.sleep_hours}h` : "—"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Quality</p><p className="text-sm font-semibold">{c.sleep_score}</p></div>
                      <div><p className="text-xs text-muted-foreground">Energy</p><p className="text-sm font-semibold">{c.energy_score}</p></div>
                      <div><p className="text-xs text-muted-foreground">Stress</p><p className="text-sm font-semibold">{c.stress_score}</p></div>
                      <div><p className="text-xs text-muted-foreground">Drive</p><p className="text-sm font-semibold">{c.drive_score}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-center">Sleep Hrs</TableHead><TableHead className="text-center">Sleep Q</TableHead><TableHead className="text-center">Energy</TableHead><TableHead className="text-center">Stress</TableHead><TableHead className="text-center">Drive</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.checkins.entries.slice(0, 14).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{format(new Date(c.check_date), "MMM d")}</TableCell>
                      <TableCell className="text-center text-sm">{c.sleep_hours ? `${c.sleep_hours}h` : "—"}</TableCell>
                      <TableCell className="text-center text-sm">{c.sleep_score}</TableCell>
                    <TableCell className="text-center text-sm">{c.energy_score}</TableCell>
                    <TableCell className="text-center text-sm">{c.stress_score}</TableCell>
                    <TableCell className="text-center text-sm">{c.drive_score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
          )}
        </Card>
      );
    },
    goals: () => {
      if (!data.goals.length) return <p className="text-sm text-muted-foreground">No goals set.</p>;
      return (
        <div className="space-y-2">
          {data.goals.map((g: any) => (
            <Card key={g.id} className="glass border-border/50">
              <CardContent className="p-3 flex items-center justify-between">
                <div><p className="text-sm font-medium">{g.title}</p><p className="text-xs text-muted-foreground">{g.current_value}/{g.target_value} {g.unit} · Due {format(new Date(g.target_date), "MMM d, yyyy")}</p></div>
                <Badge variant={g.status === "achieved" ? "default" : "secondary"} className="capitalize">{g.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    },
    nutrition: () => (
      <Card className="glass border-border/50">
        <CardContent className="p-4 text-sm space-y-2">
          <div className="flex items-center gap-2"><UtensilsCrossed className="h-4 w-4 text-primary" /><span>Calculator: {data.nutrition.calculatorData ? "✓ Set up" : "✗ Not set up"}</span></div>
          <p>Saved Meals: {data.nutrition.meals.length}</p>
          <p>Food Diary Entries: {data.foodDiary?.length || 0}</p>
          <p>Audit: {data.nutrition.auditData ? "✓ Completed" : "✗ Not done"}</p>
        </CardContent>
      </Card>
    ),
    community: () => {
      if (!data.community.messages.length) return <p className="text-sm text-muted-foreground">No community posts.</p>;
      return (
        <div className="space-y-2">
          {data.community.messages.filter((m: any) => m.is_thread_root).slice(0, 10).map((m: any) => (
            <Card key={m.id} className="glass border-border/50">
              <CardContent className="p-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{format(new Date(m.created_at), "MMM d, yyyy")}</span><span>{m.likes_count} ❤️</span></div>
                <p className="text-sm">{m.content.slice(0, 200)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    },
    "body-entries": () => {
      if (!data.bodyEntries.length) return <p className="text-sm text-muted-foreground">No body entries recorded.</p>;
      return (
        <Card className="glass border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Weight</TableHead><TableHead className="text-right">Body Fat</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.bodyEntries.slice(0, 15).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">{format(new Date(e.entry_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right text-sm">{e.weight_kg ? (e.uses_imperial ? `${Math.round(e.weight_kg * 2.20462 * 10) / 10} lbs` : `${e.weight_kg} kg`) : "—"}</TableCell>
                    <TableCell className="text-right text-sm">{e.body_fat_percent ? `${e.body_fat_percent}%` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    },
    messages: () => (
      <Card className="glass border-border/50 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4 text-primary" />Send Private Message to {p?.display_name || 'this user'}</CardTitle>
          <p className="text-xs text-muted-foreground">Only you and this user can see this message.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Textarea value={dmContent} onChange={(e) => setDmContent(e.target.value)} placeholder={`Write a private note for ${p?.display_name || 'this user'}...`} className="flex-1 min-h-[80px] resize-none text-sm" disabled={dmSending} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendDm(); }} />
            <Button onClick={handleSendDm} disabled={!dmContent.trim() || dmSending} className="self-end"><Send className="h-4 w-4 mr-2" />Send</Button>
          </div>
          {dmHistory.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message History</p>
              {dmHistory.slice(-10).map((dm) => (
                <div key={dm.id} className={`flex items-start gap-2 ${dm.from_user_id === adminUser?.id ? '' : 'flex-row-reverse'}`}>
                  <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${dm.from_user_id === adminUser?.id ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50 border border-border'}`}>
                    <p>{dm.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(dm.created_at), "MMM d, h:mm a")}{dm.is_read && dm.from_user_id === adminUser?.id && ' · Read'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),
    analytics: () => <CoachingAnalyticsDashboard userId={userId!} displayName={p?.display_name} />,
    performance: () => <ClientPerformanceReport userId={userId!} />,
    notes: () => <TouchpointLog clientUserId={userId!} />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarImage src={p?.avatar_url} />
            <AvatarFallback className="text-xl bg-primary/20 text-primary">
              {((p?.first_name?.[0] || '') + (p?.last_name?.[0] || '')).toUpperCase() || (p?.display_name?.[0] || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {p?.display_name || "Unknown User"}
              {privateCoaching && <Badge variant="elite" className="gap-1 text-[10px]"><Shield className="h-3 w-3" />Private Coaching</Badge>}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
              {data.email && !isMobile && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{data.email}</span>}
              {p?.sex && <Badge variant="outline" className="text-[10px] capitalize">{p.sex}</Badge>}
              {p?.birthday && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{(() => { const b = new Date(p.birthday); const age = new Date().getFullYear() - b.getFullYear(); return `${age} yrs`; })()}</span>}
              {!isMobile && (
                <>
                  {p?.height_cm && <span>{p.height_cm} cm</span>}
                  {p?.weight_kg && <span className="flex items-center gap-1"><Scale className="h-3.5 w-3.5" />{p.weight_kg} kg</span>}
                  {p?.location && <span>{p.location}</span>}
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {data.joinDate ? formatDistanceToNow(new Date(data.joinDate), { addSuffix: true }) : "unknown"}</span>
                  <span>{daysSince} days on platform</span>
                </>
              )}
            </div>
            {isMobile && (
              <Collapsible open={moreInfoOpen} onOpenChange={setMoreInfoOpen}>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary mt-1">
                  More info <ChevronDown className={`h-3 w-3 transition-transform ${moreInfoOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                    {data.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{data.email}</span>}
                    {p?.height_cm && <span>{p.height_cm} cm</span>}
                    {p?.weight_kg && <span className="flex items-center gap-1"><Scale className="h-3 w-3" />{p.weight_kg} kg</span>}
                    {p?.location && <span>{p.location}</span>}
                    <span>Joined {data.joinDate ? formatDistanceToNow(new Date(data.joinDate), { addSuffix: true }) : "unknown"}</span>
                    <span>{daysSince}d on platform</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant={editMode ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setEditMode(!editMode)} title={editMode ? "Done editing" : "Edit layout"}>
              <Settings2 className="h-4 w-4" />
            </Button>
            {editMode && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetLayout} title="Reset layout">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Private Coaching Toggle Card */}
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold">Private Coaching Access</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable 1-on-1 coaching dashboard, session tracking & direct messaging for this client
              </p>
            </div>
            <Switch checked={privateCoaching} onCheckedChange={togglePrivateCoaching} />
          </CardContent>
        </Card>

        {/* Reorderable sections */}
        {order.map((id, idx) => {
          const meta = SECTION_META[id];
          const render = sections[id];
          if (!meta || !render) return null;
          return (
            <CollapsibleDashboardSection
              key={id}
              id={id}
              title={meta.title}
              isOpen={!isCollapsed(id)}
              onToggle={() => toggleCollapse(id)}
              onMoveUp={() => moveUp(id)}
              onMoveDown={() => moveDown(id)}
              isFirst={idx === 0}
              isLast={idx === order.length - 1}
              editMode={editMode}
            >
              {render()}
            </CollapsibleDashboardSection>
          );
        })}
      </main>

      {copyWorkout && (
        <CopyWorkoutDialog open={copyDialogOpen} onOpenChange={(open) => { setCopyDialogOpen(open); if (!open) setCopyWorkout(null); }} sourceWorkoutId={copyWorkout.id} sourceWorkoutName={copyWorkout.name} excludeUserId={userId} />
      )}
      <AssignTemplateWizard open={assignOpen} onOpenChange={setAssignOpen} targetUserId={userId!} targetDisplayName={p?.display_name || "User"} />

      {/* Delete Workout Confirmation */}
      <AlertDialog open={!!deleteWorkoutId} onOpenChange={(open) => { if (!open) setDeleteWorkoutId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this workout and all its exercises and sets. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteWorkoutId && handleDeleteWorkout(deleteWorkoutId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
