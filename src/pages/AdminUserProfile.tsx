import { useEffect, useState } from "react";
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
import {
  ChevronLeft, User, Dumbbell, Award, Heart, Target, MessageSquare, Scale, Mail, Calendar, Send, Copy, ClipboardList,
  Moon, Zap, Brain, Flame, UtensilsCrossed, BookOpen,
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

export default function AdminUserProfile() {
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

  // DMs sent to this specific user
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

  // Load DM history
  useEffect(() => {
    if (adminUser && isAdmin) {
      fetchDirectMessages(adminUser.id);
    }
  }, [adminUser, isAdmin, fetchDirectMessages]);

  const handleSendDm = async () => {
    if (!dmContent.trim() || !adminUser || !userId) return;
    setDmSending(true);
    try {
      await sendDirectMessage(adminUser.id, userId, dmContent.trim());
      setDmContent('');
      toast({ title: 'Message sent', description: 'Your private message has been sent.' });
      // Refresh DMs
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
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {p?.display_name || "Unknown User"}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
              {data.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{data.email}</span>}
              {p?.sex && <Badge variant="outline" className="text-[10px] capitalize">{p.sex}</Badge>}
              {p?.birthday && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{(() => { const b = new Date(p.birthday); const age = new Date().getFullYear() - b.getFullYear(); return `${age} yrs`; })()}</span>}
              {p?.height_cm && <span>{p.height_cm} cm</span>}
              {p?.weight_kg && <span className="flex items-center gap-1"><Scale className="h-3.5 w-3.5" />{p.weight_kg} kg</span>}
              {p?.location && <span>{p.location}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {data.joinDate ? formatDistanceToNow(new Date(data.joinDate), { addSuffix: true }) : "unknown"}</span>
              <span>{daysSince} days on platform</span>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="glass border-border/50">
            <CardContent className="p-3 text-center">
              <Dumbbell className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{data.training.completedCount}</p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-3 text-center">
              <Award className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{data.training.prs.length}</p>
              <p className="text-xs text-muted-foreground">PRs</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-3 text-center">
              <Heart className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{data.checkins.streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-3 text-center">
              <Target className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{data.goals.length}</p>
              <p className="text-xs text-muted-foreground">Goals</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-3 text-center">
              <MessageSquare className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{data.community.totalPosts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
        </div>

        {/* Readiness / Lifestyle Summary */}
        {data.checkins.avgScores && (
          <section className="space-y-3">
            <Badge variant="outline" className="text-xs">READINESS & LIFESTYLE</Badge>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {data.checkins.avgScores.avgSleepHours && (
                <Card className="glass border-border/50 border-l-4 border-l-purple-500">
                  <CardContent className="p-3 text-center">
                    <Moon className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                    <p className="text-xl font-bold">{data.checkins.avgScores.avgSleepHours}h</p>
                    <p className="text-xs text-muted-foreground">Avg Sleep</p>
                  </CardContent>
                </Card>
              )}
              <Card className="glass border-border/50 border-l-4 border-l-blue-500">
                <CardContent className="p-3 text-center">
                  <Moon className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-xl font-bold">{data.checkins.avgScores.sleep}/5</p>
                  <p className="text-xs text-muted-foreground">Sleep Quality</p>
                </CardContent>
              </Card>
              <Card className="glass border-border/50 border-l-4 border-l-yellow-500">
                <CardContent className="p-3 text-center">
                  <Zap className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
                  <p className="text-xl font-bold">{data.checkins.avgScores.energy}/5</p>
                  <p className="text-xs text-muted-foreground">Avg Energy</p>
                </CardContent>
              </Card>
              <Card className="glass border-border/50 border-l-4 border-l-red-500">
                <CardContent className="p-3 text-center">
                  <Brain className="h-4 w-4 mx-auto text-red-500 mb-1" />
                  <p className="text-xl font-bold">{data.checkins.avgScores.stress}/5</p>
                  <p className="text-xs text-muted-foreground">Avg Stress</p>
                </CardContent>
              </Card>
              <Card className="glass border-border/50 border-l-4 border-l-orange-500">
                <CardContent className="p-3 text-center">
                  <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                  <p className="text-xl font-bold">{data.checkins.avgScores.drive}/5</p>
                  <p className="text-xs text-muted-foreground">Avg Drive</p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* AI Client Report */}
        <ClientAIReport userId={userId!} displayName={p?.display_name || "User"} />

        {/* Program Compliance */}
        {data.programCompliance && data.programCompliance.length > 0 && (
          <section className="space-y-3">
            <Badge variant="outline" className="text-xs">PROGRAM COMPLIANCE</Badge>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.programCompliance.map((pc: any) => (
                <Card key={pc.enrollmentId} className="glass border-border/50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{pc.programName}</p>
                      <p className="text-xs text-muted-foreground">
                        {pc.completed}/{pc.scheduled} workouts · Started {pc.startDate ? format(new Date(pc.startDate), "MMM d") : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={pc.status === "active" ? "default" : "secondary"} className="capitalize text-[10px]">{pc.status}</Badge>
                      {pc.compliancePct !== null && (
                        <p className={`text-lg font-mono font-bold mt-1 ${pc.compliancePct >= 80 ? "text-green-500" : pc.compliancePct >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                          {pc.compliancePct}%
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Training */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">TRAINING</Badge>
            <div className="flex gap-2 flex-wrap">
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
          </div>
          {data.training.workouts.length > 0 && (
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Workouts (Total Volume: {data.training.totalVolume.toLocaleString()} kg)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                     <TableRow>
                       <TableHead>Workout</TableHead>
                       <TableHead>Date</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right">Volume</TableHead>
                       <TableHead className="w-10"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {data.training.workouts.slice(0, 15).map((w: any) => (
                       <TableRow
                         key={w.id}
                         className="cursor-pointer hover:bg-primary/5 transition-colors"
                         onClick={() => navigate(`/admin/user/${userId}/build-workout?edit=${w.id}&name=${encodeURIComponent(w.workout_name)}&client=${encodeURIComponent(p?.display_name || 'User')}`)}
                       >
                         <TableCell className="text-sm font-medium">{w.workout_name}</TableCell>
                         <TableCell className="text-sm text-muted-foreground">{format(new Date(w.date), "MMM d, yyyy")}</TableCell>
                         <TableCell>
                           <Badge variant={w.is_completed ? "default" : "secondary"} className={`text-[10px] ${w.is_completed ? 'bg-green-600/80' : 'bg-amber-500/80'}`}>
                             {w.is_completed ? "Completed" : "In Progress"}
                           </Badge>
                         </TableCell>
                          <TableCell className="text-right text-sm">{Number(w.total_volume || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setCopyWorkout({ id: w.id, name: w.workout_name }); setCopyDialogOpen(true); }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {data.training.prs.length > 0 && (
            <Card className="glass border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Personal Records</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {data.training.prs.map((pr: any) => (
                    <div key={pr.id} className="flex justify-between text-sm">
                      <span>{pr.exercise_name}</span>
                      <span className="text-muted-foreground">{pr.max_weight}kg × {pr.max_reps || 1} — {format(new Date(pr.achieved_at), "MMM d")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Check-ins */}
        {data.checkins.totalCount > 0 && (
          <section className="space-y-3">
            <Badge variant="outline" className="text-xs">CHECK-IN HISTORY</Badge>
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {data.checkins.totalCount} check-ins · {data.checkins.streak} day streak
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Sleep Hrs</TableHead>
                      <TableHead className="text-center">Sleep Q</TableHead>
                      <TableHead className="text-center">Energy</TableHead>
                      <TableHead className="text-center">Stress</TableHead>
                      <TableHead className="text-center">Drive</TableHead>
                    </TableRow>
                  </TableHeader>
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
            </Card>
          </section>
        )}

        {/* Goals */}
        {data.goals.length > 0 && (
          <section className="space-y-3">
            <Badge variant="outline" className="text-xs">GOALS</Badge>
            <div className="space-y-2">
              {data.goals.map((g: any) => (
                <Card key={g.id} className="glass border-border/50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{g.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.current_value}/{g.target_value} {g.unit} · Due {format(new Date(g.target_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant={g.status === "achieved" ? "default" : "secondary"} className="capitalize">{g.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Nutrition */}
        <section className="space-y-3">
          <Badge variant="outline" className="text-xs">NUTRITION</Badge>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                <span>Calculator: {data.nutrition.calculatorData ? "✓ Set up" : "✗ Not set up"}</span>
              </div>
              <p>Saved Meals: {data.nutrition.meals.length}</p>
              <p>Food Diary Entries: {data.foodDiary?.length || 0}</p>
              <p>Audit: {data.nutrition.auditData ? "✓ Completed" : "✗ Not done"}</p>
            </CardContent>
          </Card>
        </section>

        {/* Community */}
        {data.community.messages.length > 0 && (
          <section className="space-y-3">
            <Badge variant="outline" className="text-xs">COMMUNITY ({data.community.totalPosts} posts · {data.community.totalLikes} likes received)</Badge>
            <div className="space-y-2">
              {data.community.messages.filter((m: any) => m.is_thread_root).slice(0, 10).map((m: any) => (
                <Card key={m.id} className="glass border-border/50">
                  <CardContent className="p-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{format(new Date(m.created_at), "MMM d, yyyy")}</span>
                      <span>{m.likes_count} ❤️</span>
                    </div>
                    <p className="text-sm">{m.content.slice(0, 200)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Body Entries */}
        {data.bodyEntries.length > 0 && (
          <section className="space-y-3">
            <Badge variant="outline" className="text-xs">BODY ENTRIES</Badge>
            <Card className="glass border-border/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Body Fat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.bodyEntries.slice(0, 15).map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm">{format(new Date(e.entry_date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right text-sm">
                          {e.weight_kg ? (e.uses_imperial ? `${Math.round(e.weight_kg * 2.20462 * 10) / 10} lbs` : `${e.weight_kg} kg`) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm">{e.body_fat_percent ? `${e.body_fat_percent}%` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Private Message Section */}
        <section className="space-y-3">
          <Badge variant="data" className="text-xs">PRIVATE MESSAGE</Badge>
          <Card className="glass border-border/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Send Private Message to {p?.display_name || 'this user'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Only you and this user can see this message. It will appear in their private Coach Messages section.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={dmContent}
                  onChange={(e) => setDmContent(e.target.value)}
                  placeholder={`Write a private note for ${p?.display_name || 'this user'}...`}
                  className="flex-1 min-h-[80px] resize-none text-sm"
                  disabled={dmSending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendDm();
                  }}
                />
                <Button
                  onClick={handleSendDm}
                  disabled={!dmContent.trim() || dmSending}
                  className="self-end"
                >
                  <Send className="h-4 w-4 mr-2" />Send
                </Button>
              </div>

              {/* DM History */}
              {dmHistory.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message History</p>
                  {dmHistory.slice(-10).map((dm) => (
                    <div key={dm.id} className={`flex items-start gap-2 ${dm.from_user_id === adminUser?.id ? '' : 'flex-row-reverse'}`}>
                      <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                        dm.from_user_id === adminUser?.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-secondary/50 border border-border'
                      }`}>
                        <p>{dm.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(dm.created_at), "MMM d, h:mm a")}
                          {dm.is_read && dm.from_user_id === adminUser?.id && ' · Read'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Coaching Analytics Dashboard */}
        <CoachingAnalyticsDashboard userId={userId!} displayName={p?.display_name} />

        {/* Performance Report */}
        <section className="space-y-3">
          <ClientPerformanceReport userId={userId!} />
        </section>

        {/* Coaching Notes / Touchpoints */}
        <section className="space-y-3">
          <Badge variant="outline" className="text-xs">COACHING NOTES</Badge>
          <TouchpointLog clientUserId={userId!} />
        </section>
      </main>

      {/* Copy Workout Dialog */}
      {copyWorkout && (
        <CopyWorkoutDialog
          open={copyDialogOpen}
          onOpenChange={(open) => { setCopyDialogOpen(open); if (!open) setCopyWorkout(null); }}
          sourceWorkoutId={copyWorkout.id}
          sourceWorkoutName={copyWorkout.name}
          excludeUserId={userId}
        />
      )}

      {/* Assign Template Wizard */}
      <AssignTemplateWizard
        open={assignOpen}
        onOpenChange={setAssignOpen}
        targetUserId={userId!}
        targetDisplayName={p?.display_name || "User"}
      />
    </div>
  );
}
