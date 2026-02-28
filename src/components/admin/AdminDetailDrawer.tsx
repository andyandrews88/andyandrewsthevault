import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  Users, Activity, TrendingUp, CalendarCheck, Maximize2, Minimize2,
  MoreVertical, Ban, UserX, Trash2, ShieldOff, RotateCcw
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Section = "users" | "training" | "nutrition" | "lifestyle" | "community" | "content";
type UserFilter = "all" | "active" | "inactive" | "has_program" | "no_nutrition" | "suspended";

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function DateBadge({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-muted-foreground">—</span>;
  const days = differenceInDays(new Date(), new Date(date));
  const variant = days <= 3 ? "success" : days <= 7 ? "warning" : "destructive";
  return (
    <Badge variant={variant} className="text-[10px] font-normal">
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </Badge>
  );
}

function ComplianceText({ scheduled, completed }: { scheduled: number; completed: number }) {
  if (!scheduled || scheduled === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const pct = Math.round(((completed || 0) / scheduled) * 100);
  const color = pct >= 80 ? "text-green-500" : pct >= 50 ? "text-yellow-500" : "text-red-500";
  return <span className={`text-xs font-semibold ${color}`}>{pct}%</span>;
}

function UserStatCards({ users }: { users: any[] }) {
  const total = users.length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const activeThisWeek = users.filter(u => u.lastWorkoutDate && new Date(u.lastWorkoutDate) >= weekAgo).length;
  const usersWithCompliance = users.filter(u => u.scheduledWorkouts > 0);
  const avgCompliance = usersWithCompliance.length > 0
    ? Math.round(usersWithCompliance.reduce((sum, u) => sum + (u.completedWorkouts / u.scheduledWorkouts) * 100, 0) / usersWithCompliance.length)
    : 0;
  const avgStreak = total > 0
    ? Math.round(users.reduce((sum, u) => sum + (u.checkinStreak || 0), 0) / total * 10) / 10
    : 0;

  const stats = [
    { label: "Total Clients", value: total, icon: Users },
    { label: "Compliance", value: `${avgCompliance}%`, icon: TrendingUp },
    { label: "Active This Week", value: activeThisWeek, icon: Activity },
    { label: "Avg Streak", value: `${avgStreak}d`, icon: CalendarCheck },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
      {stats.map(s => (
        <Card key={s.label} className="bg-muted/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <s.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminDetailDrawer({
  section,
  open,
  onClose,
}: {
  section: Section | null;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const prevKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !section) return;
    const key = section;
    if (prevKeyRef.current === key && data) return;
    prevKeyRef.current = key;
    setData(null);
    setLoading(true);

    supabase.functions
      .invoke("admin-detail", { body: { section } })
      .then(({ data: result, error }) => {
        if (error) throw error;
        setData(result);
      })
      .catch(() => {
        toast({ title: "Failed to load details", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [open, section]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUserAction = async (action: string, targetUserId: string, userName: string) => {
    setActionLoading(targetUserId);
    try {
      const { data: result, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action, targetUserId },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      toast({ title: result.message || "Action completed" });
      // Refresh data
      prevKeyRef.current = null;
      setData(null);
      setLoading(true);
      const { data: refreshed } = await supabase.functions.invoke("admin-detail", { body: { section: "users" } });
      setData(refreshed);
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await handleUserAction("delete", deleteTarget.id, deleteTarget.name);
    setDeleteTarget(null);
    setDeleteConfirmText("");
  };

  const titles: Record<Section, string> = {
    users: "Client Directory",
    training: "Training Breakdown",
    nutrition: "Nutrition Overview",
    lifestyle: "Lifestyle & Goals",
    community: "Community Activity",
    content: "Content Library",
  };

  const filterUsers = (users: any[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    switch (userFilter) {
      case "active":
        return users.filter(u => u.lastActive && new Date(u.lastActive) >= weekAgo);
      case "inactive":
        return users.filter(u => !u.lastActive || new Date(u.lastActive) < weekAgo);
      case "has_program":
        return users.filter(u => u.programEnrolled);
      case "no_nutrition":
        return users.filter(u => !u.hasNutrition);
      case "suspended":
        return users.filter(u => u.status === "suspended" || u.status === "archived");
      default:
        return users;
    }
  };

  const renderContent = () => {
    if (loading) return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
    if (!data || !section) return null;

    if (section === "users") {
      const allUsers = data.users || [];
      const users = filterUsers(allUsers);

      const filters: { key: UserFilter; label: string }[] = [
        { key: "all", label: "All" },
        { key: "active", label: "Active" },
        { key: "inactive", label: "Inactive 7d+" },
        { key: "has_program", label: "Has Program" },
        { key: "no_nutrition", label: "No Nutrition" },
        { key: "suspended", label: "Suspended" },
      ];

      return (
        <div>
          <UserStatCards users={allUsers} />
          {/* Filter bar */}
          <div className="flex flex-wrap gap-1 mb-3">
            {filters.map(f => (
              <Button
                key={f.key}
                variant={userFilter === f.key ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setUserFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
            <Button
              variant={showExtraColumns ? "secondary" : "outline"}
              size="sm"
              className="text-xs h-7 ml-auto"
              onClick={() => setShowExtraColumns(!showExtraColumns)}
            >
              {showExtraColumns ? "Less Columns" : "More Columns"}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Last Workout</TableHead>
                <TableHead className="hidden md:table-cell">Last Check-in</TableHead>
                <TableHead className="hidden md:table-cell text-right">Compliance</TableHead>
                <TableHead className="text-right">Workouts</TableHead>
                {showExtraColumns && (
                  <>
                    <TableHead className="hidden lg:table-cell text-right">Avg Energy</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Weight</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Nutrition</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Program</TableHead>
                  </>
                )}
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => {
                const isArchived = u.displayName?.startsWith("[Archived]");
                const isSuspended = u.status === "suspended" || u.status === "archived";
                return (
                  <TableRow
                    key={u.id}
                    className={`cursor-pointer hover:bg-muted/50 ${isSuspended ? "opacity-50" : ""} ${isArchived ? "line-through" : ""}`}
                    onClick={() => { onClose(); navigate(`/admin/user/${u.id}`); }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(u.displayName || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.displayName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {u.lastActive ? `Active ${formatDistanceToNow(new Date(u.lastActive), { addSuffix: true })}` : "Never"}
                          </p>
                        </div>
                        {isSuspended && <Badge variant="destructive" className="text-[9px] h-4">Suspended</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><DateBadge date={u.lastWorkoutDate} /></TableCell>
                    <TableCell className="hidden md:table-cell"><DateBadge date={u.lastCheckinDate} /></TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      <ComplianceText scheduled={u.scheduledWorkouts} completed={u.completedWorkouts} />
                    </TableCell>
                    <TableCell className="text-right"><span className="text-sm">{u.workoutsCount}</span></TableCell>
                    {showExtraColumns && (
                      <>
                        <TableCell className="hidden lg:table-cell text-right text-sm">
                          {u.avgEnergy != null ? `${u.avgEnergy}/5` : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right text-sm">
                          {u.latestWeight != null ? `${u.latestWeight}kg` : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          {u.hasNutrition ? <Badge variant="secondary" className="text-[9px]">✓</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          {u.programEnrolled ? <Badge variant="secondary" className="text-[9px]">✓</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="w-10" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={actionLoading === u.id}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isSuspended ? (
                            <DropdownMenuItem onClick={() => handleUserAction("unsuspend", u.id, u.displayName)}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Unsuspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUserAction("suspend", u.id, u.displayName)}>
                              <Ban className="h-4 w-4 mr-2" /> Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleUserAction("archive", u.id, u.displayName)}>
                            <UserX className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction("remove_role", u.id, u.displayName)}>
                            <ShieldOff className="h-4 w-4 mr-2" /> Remove Roles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget({ id: u.id, name: u.displayName })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (section === "training") {
      return (
        <div className="space-y-6">
          {data.workoutsByDay?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Workouts by Day</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.workoutsByDay.reverse()}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => format(new Date(d), "MMM d")} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {data.prLeaderboard?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recent PRs</p>
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Exercise</TableHead><TableHead className="text-right">Weight</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.prLeaderboard.slice(0, 10).map((pr: any, i: number) => (
                    <TableRow key={i}><TableCell className="text-sm">{pr.userName}</TableCell><TableCell className="text-sm">{pr.exerciseName}</TableCell><TableCell className="text-right text-sm">{pr.maxWeight}kg × {pr.maxReps || 1}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {data.userFrequency?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Most Active Users</p>
              <div className="space-y-1">
                {data.userFrequency.slice(0, 10).map((u: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1"><span>{u.userName}</span><Badge variant="secondary">{u.workoutCount} workouts</Badge></div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (section === "nutrition") {
      return (
        <Table>
          <TableHeader><TableRow><TableHead>User</TableHead><TableHead className="text-center">Calculator</TableHead><TableHead className="text-center">Meals</TableHead><TableHead className="text-center">Audit</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data.users || []).map((u: any) => (
              <TableRow key={u.id}><TableCell className="text-sm font-medium">{u.displayName}</TableCell><TableCell className="text-center">{u.hasCalculator ? "✓" : "—"}</TableCell><TableCell className="text-center">{u.mealCount || "—"}</TableCell><TableCell className="text-center">{u.hasAudit ? "✓" : "—"}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (section === "lifestyle") {
      return (
        <div className="space-y-6">
          {data.checkinFrequency?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Check-in Leaders</p>
              <div className="space-y-1">
                {data.checkinFrequency.map((u: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1"><span>{u.userName}</span><Badge variant="secondary">{u.checkinCount} check-ins</Badge></div>
                ))}
              </div>
            </div>
          )}
          {data.goals?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">All Goals</p>
              <div className="space-y-2">
                {data.goals.slice(0, 20).map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between text-sm p-2 border rounded">
                    <div><span className="font-medium">{g.userName}: </span><span>{g.title}</span></div>
                    <Badge variant={g.status === "achieved" ? "default" : "secondary"} className="capitalize text-xs">{g.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (section === "community") {
      return (
        <div className="space-y-6">
          {data.topPosters?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Top Posters</p>
              <div className="space-y-1">
                {data.topPosters.map((u: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1"><span>{u.userName}</span><Badge variant="secondary">{u.postCount} posts</Badge></div>
                ))}
              </div>
            </div>
          )}
          {data.recentPosts?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recent Posts</p>
              <div className="space-y-2">
                {data.recentPosts.slice(0, 15).map((p: any) => (
                  <div key={p.id} className="p-2 border rounded text-sm">
                    <div className="flex justify-between mb-1"><span className="font-medium">{p.userName}</span><span className="text-xs text-muted-foreground">{p.likesCount} ❤️</span></div>
                    <p className="text-muted-foreground text-xs">{p.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (section === "content") {
      return (
        <div className="space-y-6">
          {data.resources?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Resources ({data.resources.length})</p>
              <div className="space-y-1">
                {data.resources.map((r: any) => (
                  <div key={r.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                    <span>{r.title}</span>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs capitalize">{r.category}</Badge>
                      {r.is_featured && <Badge className="text-xs">Featured</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.podcasts?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Podcasts ({data.podcasts.length})</p>
              <div className="space-y-1">
                {data.podcasts.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                    <span>{p.episode_number ? `#${p.episode_number} ` : ""}{p.title}</span>
                    {p.is_featured && <Badge className="text-xs">Featured</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) { prevKeyRef.current = null; setData(null); setIsMaximized(false); setUserFilter("all"); onClose(); } }}>
        <SheetContent className={`overflow-y-auto transition-all duration-200 ${isMaximized ? "w-full sm:max-w-[95vw]" : "w-full sm:max-w-2xl"}`}>
          <SheetHeader className="flex flex-row items-center justify-between pr-8">
            <SheetTitle>{section ? titles[section] : ""}</SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMaximized(!isMaximized)}>
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </SheetHeader>
          <div className="mt-4">
            {renderContent()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all their data. This action cannot be undone.
              <br /><br />
              Type <strong>{deleteTarget?.name}</strong> to confirm:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder="Type user name to confirm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== deleteTarget?.name}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
