import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { TrendingUp, Award, Heart, Scale } from "lucide-react";
import { format } from "date-fns";

interface ReportData {
  weeklyVolume: { week: string; volume: number; workouts: number }[];
  weeklyReadiness: { week: string; sleep: number; energy: number; stress: number; drive: number }[];
  prTimeline: { exercise: string; weight: number; reps: number | null; date: string }[];
  bodyComposition: { date: string; weight: number | null; bodyFat: number | null; usesImperial: boolean }[];
  compliance: number;
  totalWorkouts: number;
  completedWorkouts: number;
}

export function ClientPerformanceReport({ userId }: { userId: string }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState("8");

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const { data: result } = await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "get_client_report", userId, weeks: parseInt(weeks) },
        });
        if (result) setData(result);
      } catch {} finally {
        setLoading(false);
      }
    }
    fetch();
  }, [userId, weeks]);

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;
  if (!data) return <p className="text-sm text-muted-foreground">No report data available.</p>;

  const formatWeek = (w: string) => {
    try { return format(new Date(w + "T12:00:00"), "MMM d"); } catch { return w; }
  };

  const volumeConfig = { volume: { label: "Volume (kg)", color: "hsl(var(--primary))" } };
  const readinessConfig = {
    sleep: { label: "Sleep", color: "hsl(210, 70%, 55%)" },
    energy: { label: "Energy", color: "hsl(45, 80%, 55%)" },
    stress: { label: "Stress", color: "hsl(0, 70%, 55%)" },
    drive: { label: "Drive", color: "hsl(140, 60%, 45%)" },
  };
  const bodyConfig = {
    weight: { label: "Weight", color: "hsl(var(--primary))" },
    bodyFat: { label: "Body Fat %", color: "hsl(30, 80%, 55%)" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">PERFORMANCE REPORT</Badge>
        <Select value={weeks} onValueChange={setWeeks}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 weeks</SelectItem>
            <SelectItem value="8">8 weeks</SelectItem>
            <SelectItem value="12">12 weeks</SelectItem>
            <SelectItem value="24">24 weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Compliance Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{data.compliance}%</p>
            <p className="text-xs text-muted-foreground">Compliance</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{data.completedWorkouts}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{data.totalWorkouts - data.completedWorkouts}</p>
            <p className="text-xs text-muted-foreground">Incomplete</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Volume Trend */}
      {data.weeklyVolume.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Weekly Training Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={volumeConfig} className="h-[200px] w-full">
              <BarChart data={data.weeklyVolume}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="week" tickFormatter={formatWeek} className="text-[10px]" />
                <YAxis className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Readiness Trends */}
      {data.weeklyReadiness.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" /> Weekly Readiness Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={readinessConfig} className="h-[200px] w-full">
              <LineChart data={data.weeklyReadiness}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="week" tickFormatter={formatWeek} className="text-[10px]" />
                <YAxis domain={[0, 10]} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="sleep" stroke="hsl(210, 70%, 55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="energy" stroke="hsl(45, 80%, 55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stress" stroke="hsl(0, 70%, 55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="drive" stroke="hsl(140, 60%, 45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* PR Timeline */}
      {data.prTimeline.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> PR Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {data.prTimeline.map((pr, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-border/30 pb-1.5">
                  <div>
                    <span className="font-medium">{pr.exercise}</span>
                    <span className="text-muted-foreground ml-2">{pr.weight}kg × {pr.reps || 1}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(pr.date), "MMM d, yyyy")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Body Composition */}
      {data.bodyComposition.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" /> Body Composition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bodyConfig} className="h-[200px] w-full">
              <AreaChart data={data.bodyComposition}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tickFormatter={(d) => { try { return format(new Date(d + "T12:00:00"), "MMM d"); } catch { return d; } }} className="text-[10px]" />
                <YAxis className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                {data.bodyComposition.some(e => e.bodyFat) && (
                  <Area type="monotone" dataKey="bodyFat" stroke="hsl(30, 80%, 55%)" fill="hsl(30, 80%, 55%, 0.1)" strokeWidth={2} />
                )}
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
