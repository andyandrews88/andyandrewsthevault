import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

type Section = "users" | "training" | "nutrition" | "lifestyle" | "community" | "content";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const prevKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !section) return;

    // Avoid refetching for the same section when already loaded
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

  const titles: Record<Section, string> = {
    users: "User Directory",
    training: "Training Breakdown",
    nutrition: "Nutrition Overview",
    lifestyle: "Lifestyle & Goals",
    community: "Community Activity",
    content: "Content Library",
  };

  const renderContent = () => {
    if (loading) return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
    if (!data || !section) return null;

    if (section === "users") {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Workouts</TableHead>
              <TableHead className="text-right">Streak</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data.users || []).map((u: any) => (
              <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { onClose(); navigate(`/admin/user/${u.id}`); }}>
                <TableCell className="font-medium">{u.displayName}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</TableCell>
                <TableCell className="text-right">{u.workoutsCount}</TableCell>
                <TableCell className="text-right">{u.checkinStreak > 0 ? `${u.checkinStreak}d` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Exercise</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.prLeaderboard.slice(0, 10).map((pr: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{pr.userName}</TableCell>
                      <TableCell className="text-sm">{pr.exerciseName}</TableCell>
                      <TableCell className="text-right text-sm">{pr.maxWeight}kg × {pr.maxReps || 1}</TableCell>
                    </TableRow>
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
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{u.userName}</span>
                    <Badge variant="secondary">{u.workoutCount} workouts</Badge>
                  </div>
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
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-center">Calculator</TableHead>
              <TableHead className="text-center">Meals</TableHead>
              <TableHead className="text-center">Audit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data.users || []).map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="text-sm font-medium">{u.displayName}</TableCell>
                <TableCell className="text-center">{u.hasCalculator ? "✓" : "—"}</TableCell>
                <TableCell className="text-center">{u.mealCount || "—"}</TableCell>
                <TableCell className="text-center">{u.hasAudit ? "✓" : "—"}</TableCell>
              </TableRow>
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
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{u.userName}</span>
                    <Badge variant="secondary">{u.checkinCount} check-ins</Badge>
                  </div>
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
                    <div>
                      <span className="font-medium">{g.userName}: </span>
                      <span>{g.title}</span>
                    </div>
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
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{u.userName}</span>
                    <Badge variant="secondary">{u.postCount} posts</Badge>
                  </div>
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
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{p.userName}</span>
                      <span className="text-xs text-muted-foreground">{p.likesCount} ❤️</span>
                    </div>
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
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) { prevKeyRef.current = null; setData(null); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{section ? titles[section] : ""}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
