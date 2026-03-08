import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Activity, CheckCircle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DateRangeSelector, computeRange } from "@/components/ui/DateRangeSelector";
import { format } from "date-fns";
import { MOVEMENT_PATTERN_LABELS, PATTERN_COLORS, type MovementPattern } from "@/lib/movementPatterns";

interface Props {
  userId: string;
  displayName?: string;
}

export function CoachingAnalyticsDashboard({ userId, displayName }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchData = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("admin-workout-builder", {
        body: {
          action: "get_coaching_dashboard",
          userId,
          fromDate: format(from, "yyyy-MM-dd"),
          toDate: format(to, "yyyy-MM-dd"),
        },
      });
      if (error) throw error;
      setData(result);
    } catch (e) {
      console.error("Coaching dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const { from, to } = computeRange("3M");
    fetchData(from, to);
  }, [fetchData]);

  const volumeChartData = (data?.weeklyVolume || []).map((d: any) => ({
    week: format(new Date(d.week_start), "MMM d"),
    volume: Math.round(Number(d.total_tonnage)),
    workouts: Number(d.workout_count),
  }));

  const rirChartData = (data?.weeklyRir || []).map((d: any) => ({
    week: format(new Date(d.week_start), "MMM d"),
    rir: Number(d.avg_rir),
    sets: Number(d.sets_with_rir),
  }));

  const compliance = data?.compliance || { completed: 0, total: 0, incomplete: 0, percentage: 0 };
  const donutData = [
    { name: "Completed", value: compliance.completed },
    { name: "Incomplete", value: compliance.incomplete },
  ];
  const DONUT_COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

  const patternData = (data?.patternVolume || []).map((m: any) => ({
    name: MOVEMENT_PATTERN_LABELS[m.pattern as MovementPattern] || m.pattern,
    pattern: m.pattern,
    volume: m.total_volume,
    sets: m.total_sets,
    exercises: m.exercises?.length || 0,
  }));

  const formatVolume = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">COACHING ANALYTICS</Badge>
        <DateRangeSelector
          defaultPreset="3M"
          presets={["1M", "3M", "6M", "1Y"]}
          onRangeChange={fetchData}
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Volume Trend */}
            <Card className="glass border-border/50 md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Volume Trend
                </CardTitle>
                <CardDescription className="text-xs">Weekly tonnage (weight × reps)</CardDescription>
              </CardHeader>
              <CardContent>
                {volumeChartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No data</div>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={volumeChartData}>
                        <defs>
                          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={formatVolume} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(v: number) => [`${v.toLocaleString()} lbs`, "Volume"]}
                        />
                        <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" fill="url(#volGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RIR / Proximity to Failure */}
            <Card className="glass border-border/50 md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Proximity to Failure
                </CardTitle>
                <CardDescription className="text-xs">Avg RIR per week (lower = harder)</CardDescription>
              </CardHeader>
              <CardContent>
                {rirChartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No RIR data recorded</div>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rirChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} reversed domain={[0, "auto"]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(v: number, name: string) => {
                            if (name === "rir") return [`${v} RIR`, "Avg RIR"];
                            return [v, name];
                          }}
                        />
                        <Line type="monotone" dataKey="rir" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Donut */}
            <Card className="glass border-border/50 md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Compliance
                </CardTitle>
                <CardDescription className="text-xs">{compliance.completed}/{compliance.total} workouts completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  {compliance.total === 0 ? (
                    <span className="text-xs text-muted-foreground">No workouts in range</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {donutData.map((_, i) => (
                            <Cell key={i} fill={DONUT_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-foreground text-xl font-bold"
                        >
                          {compliance.percentage}%
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volume by Movement Pattern */}
          {patternData.length > 0 && (
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Volume by Movement Pattern
                </CardTitle>
                <CardDescription className="text-xs">Total volume per pattern in period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={patternData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatVolume} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(v: number, _: string, entry: any) => [
                          `${v.toLocaleString()} lbs · ${entry.payload.sets} sets · ${entry.payload.exercises} exercises`,
                          entry.payload.name,
                        ]}
                      />
                      <Bar
                        dataKey="volume"
                        radius={[0, 4, 4, 0]}
                        shape={(props: any) => {
                          const pattern = props?.payload?.pattern as MovementPattern;
                          const color = PATTERN_COLORS[pattern] || "hsl(var(--primary))";
                          return <rect {...props} fill={color} />;
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
