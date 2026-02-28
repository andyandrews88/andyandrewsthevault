import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { DateRangeSelector, computeRange } from "@/components/ui/DateRangeSelector";
import { format, subMonths, differenceInDays } from "date-fns";

export function IntensityTrendChart() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async (from: Date, to: Date) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: rirData } = await supabase
        .from("weekly_rir_summary" as any)
        .select("*")
        .eq("user_id", user.id)
        .gte("week_start", format(from, "yyyy-MM-dd"))
        .lte("week_start", format(to, "yyyy-MM-dd"))
        .order("week_start", { ascending: true });
      setData((rirData as any[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const { from, to } = computeRange("1M");
    loadData(from, to);
  }, [loadData]);

  const chartData = data.map((d: any) => ({
    week: format(new Date(d.week_start), "MMM d"),
    rir: Number(d.avg_rir),
  }));

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Proximity to Failure
            </CardTitle>
            <CardDescription>Average RIR per week (lower = harder training)</CardDescription>
          </div>
          <DateRangeSelector defaultPreset="1M" onRangeChange={loadData} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p>No RIR data yet</p>
            <p className="text-sm">Log RIR values during your sets to track intensity</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} reversed domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number) => [`${v} RIR`, "Avg RIR"]}
                />
                <Line type="monotone" dataKey="rir" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
