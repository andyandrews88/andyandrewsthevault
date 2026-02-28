import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRangeSelector, computeRange } from "@/components/ui/DateRangeSelector";

interface ChartPoint {
  date: string;
  label: string;
  readiness: number;
  sleep: number;
  stress: number;
  energy: number;
  drive: number;
}

export function ReadinessChart() {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (from: Date, to: Date) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = format(from, "yyyy-MM-dd");
      const endDate = format(to, "yyyy-MM-dd");

      const { data: checkins } = await supabase
        .from("user_daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .gte("check_date", startDate)
        .lte("check_date", endDate)
        .order("check_date", { ascending: true });

      const points: ChartPoint[] = (checkins || []).map(c => ({
        date: c.check_date,
        label: format(new Date(c.check_date + "T12:00:00"), "MMM d"),
        readiness: Math.round(((c.sleep_score + c.stress_score + c.energy_score + c.drive_score) / 20) * 100),
        sleep: c.sleep_score,
        stress: c.stress_score,
        energy: c.energy_score,
        drive: c.drive_score,
      }));

      setData(points);
    } catch (err) {
      console.error("Error fetching readiness data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { from, to } = computeRange("1W");
    fetchData(from, to);
  }, [fetchData]);

  const avgReadiness = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.readiness, 0) / data.length)
    : 0;

  return (
    <Card variant="data">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Readiness Trend</CardTitle>
            {data.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Avg: <span className="font-mono text-primary">{avgReadiness}%</span> over {data.length} days
              </p>
            )}
          </div>
          <DateRangeSelector defaultPreset="1W" onRangeChange={fetchData} presets={["1W", "2W", "1M", "3M"]} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No check-in data yet. Submit your first check-in above.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="readinessGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(192, 91%, 54%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(192, 91%, 54%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 14%, 16%)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(215, 14%, 50%)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "hsl(215, 14%, 50%)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 16%, 9%)",
                  border: "1px solid hsl(215, 14%, 22%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(210, 20%, 95%)" }}
                formatter={(value: number, name: string) => {
                  if (name === "readiness") return [`${value}%`, "Readiness"];
                  return [value, name];
                }}
              />
              <Area
                type="monotone"
                dataKey="readiness"
                stroke="hsl(192, 91%, 54%)"
                strokeWidth={2}
                fill="url(#readinessGradient)"
                dot={{ r: 3, fill: "hsl(192, 91%, 54%)" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
