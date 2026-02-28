import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Dumbbell, Apple, Brain, Target, MessageSquare, BookOpen,
  TrendingUp, Award, Heart, Calendar, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AdminWeeklyReport } from "@/components/admin/AdminWeeklyReport";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";

interface Analytics {
  users: { total: number; newThisMonth: number; newThisWeek: number; recentSignups: { id: string; displayName: string; createdAt: string }[] };
  training: { totalWorkouts: number; workoutsThisWeek: number; activeUsersThisWeek: number; avgWorkoutsPerUser: number; totalVolume: number; totalPRs: number; topExercises: { name: string; count: number }[] };
  nutrition: { usersWithCalculator: number; totalSavedMeals: number; auditsCompleted: number };
  lifestyle: { totalCheckins: number; checkinsThisWeek: number; usersWhoCheckin: number; totalBodyEntries: number };
  goals: { totalGoals: number; achievedGoals: number };
  community: { totalPosts: number; postsThisWeek: number; totalLikes: number; avgLikesPerPost: number };
  content: { totalResources: number; totalPodcasts: number };
}

type Section = "users" | "training" | "nutrition" | "lifestyle" | "community" | "content";

function StatCard({ icon: Icon, label, value, sub, onClick }: { icon: React.ElementType; label: string; value: string | number; sub?: string; onClick?: () => void }) {
  return (
    <Card className={`glass border-border/50 ${onClick ? "cursor-pointer hover:bg-muted/30 transition-colors" : ""}`} onClick={onClick}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerSection, setDrawerSection] = useState<Section | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = (s: Section) => {
    setDrawerSection(s);
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) { navigate("/"); return; }

    async function fetchAnalytics() {
      try {
        const { data, error } = await supabase.functions.invoke("admin-analytics");
        if (error) throw error;
        setAnalytics(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [isAdmin, adminLoading, navigate]);

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </main>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-destructive">{error || "Failed to load"}</p>
        </main>
      </div>
    );
  }

  const a = analytics;
  const goalRate = a.goals.totalGoals > 0 ? Math.round((a.goals.achievedGoals / a.goals.totalGoals) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/vault")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Platform analytics overview</p>
            </div>
          </div>
          <Button variant="hero" onClick={() => navigate("/admin/templates")} className="gap-2">
            <Dumbbell className="h-4 w-4" />
            My Templates
          </Button>
        </div>

        {/* Users Overview */}
        <section className="space-y-3">
          <Badge variant="outline" className="text-xs">USERS</Badge>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Total Users" value={a.users.total} onClick={() => openDrawer("users")} />
            <StatCard icon={TrendingUp} label="New This Week" value={a.users.newThisWeek} onClick={() => openDrawer("users")} />
            <StatCard icon={TrendingUp} label="New This Month" value={a.users.newThisMonth} onClick={() => openDrawer("users")} />
            <StatCard icon={Users} label="Active (Training)" value={a.training.activeUsersThisWeek} sub="Last 7 days" onClick={() => openDrawer("users")} />
          </div>
        </section>

        {/* Training */}
        <section className="space-y-3">
          <Badge variant="outline" className="text-xs">TRAINING</Badge>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Dumbbell} label="Total Workouts" value={a.training.totalWorkouts} onClick={() => openDrawer("training")} />
            <StatCard icon={Calendar} label="This Week" value={a.training.workoutsThisWeek} onClick={() => openDrawer("training")} />
            <StatCard icon={Dumbbell} label="Avg/User" value={a.training.avgWorkoutsPerUser} onClick={() => openDrawer("training")} />
            <StatCard icon={Award} label="Total PRs" value={a.training.totalPRs} onClick={() => openDrawer("training")} />
          </div>
          {a.training.topExercises.length > 0 && (
            <Card className="glass border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Top Exercises</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {a.training.topExercises.map((ex, i) => (
                    <div key={ex.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground mr-2">{i + 1}.</span>
                        {ex.name}
                      </span>
                      <Badge variant="secondary">{ex.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Nutrition & Lifestyle */}
        <section className="space-y-3">
          <Badge variant="outline" className="text-xs">NUTRITION & LIFESTYLE</Badge>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Apple} label="Calculator Users" value={a.nutrition.usersWithCalculator} onClick={() => openDrawer("nutrition")} />
            <StatCard icon={Apple} label="Saved Meals" value={a.nutrition.totalSavedMeals} onClick={() => openDrawer("nutrition")} />
            <StatCard icon={Brain} label="Audits Done" value={a.nutrition.auditsCompleted} onClick={() => openDrawer("nutrition")} />
            <StatCard icon={Heart} label="Daily Check-ins" value={a.lifestyle.totalCheckins} sub={`${a.lifestyle.checkinsThisWeek} this week`} onClick={() => openDrawer("lifestyle")} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Users Who Check-in" value={a.lifestyle.usersWhoCheckin} onClick={() => openDrawer("lifestyle")} />
            <StatCard icon={TrendingUp} label="Body Entries" value={a.lifestyle.totalBodyEntries} onClick={() => openDrawer("lifestyle")} />
            <StatCard icon={Target} label="Goals Set" value={a.goals.totalGoals} onClick={() => openDrawer("lifestyle")} />
            <StatCard icon={Award} label="Goals Achieved" value={`${goalRate}%`} sub={`${a.goals.achievedGoals} of ${a.goals.totalGoals}`} onClick={() => openDrawer("lifestyle")} />
          </div>
        </section>

        {/* Community */}
        <section className="space-y-3">
          <Badge variant="outline" className="text-xs">COMMUNITY</Badge>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={MessageSquare} label="Total Posts" value={a.community.totalPosts} onClick={() => openDrawer("community")} />
            <StatCard icon={MessageSquare} label="Posts This Week" value={a.community.postsThisWeek} onClick={() => openDrawer("community")} />
            <StatCard icon={Heart} label="Total Likes" value={a.community.totalLikes} onClick={() => openDrawer("community")} />
            <StatCard icon={TrendingUp} label="Avg Likes/Post" value={a.community.avgLikesPerPost} onClick={() => openDrawer("community")} />
          </div>
        </section>

        {/* Content */}
        <section className="space-y-3">
          <Badge variant="outline" className="text-xs">KNOWLEDGE BANK</Badge>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={BookOpen} label="Resources" value={a.content.totalResources} onClick={() => openDrawer("content")} />
            <StatCard icon={BookOpen} label="Podcasts" value={a.content.totalPodcasts} onClick={() => openDrawer("content")} />
          </div>
        </section>

        {/* Announcements */}
        <section className="space-y-3">
          <Badge variant="outline" className="text-xs">ANNOUNCEMENTS</Badge>
          <AnnouncementManager />
        </section>

        {/* Recent Signups */}
        {a.users.recentSignups.length > 0 && (
          <section className="space-y-3">
            <Badge variant="outline" className="text-xs">RECENT SIGNUPS</Badge>
            <Card className="glass border-border/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {a.users.recentSignups.map((u) => (
                      <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/user/${u.id}`)}>
                        <TableCell className="font-medium">{u.displayName}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <AdminDetailDrawer
        section={drawerSection}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerSection(null); }}
      />
    </div>
  );
}
