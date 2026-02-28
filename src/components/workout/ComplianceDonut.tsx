import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { DateRangeSelector, computeRange } from "@/components/ui/DateRangeSelector";
import { format } from "date-fns";

export function ComplianceDonut() {
  const { user } = useAuthStore();
  const [compliance, setCompliance] = useState({ completed: 0, total: 0, incomplete: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async (from: Date, to: Date) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, is_completed")
        .eq("user_id", user.id)
        .gte("date", format(from, "yyyy-MM-dd"))
        .lte("date", format(to, "yyyy-MM-dd"));

      const total = workouts?.length || 0;
      const completed = workouts?.filter(w => w.is_completed).length || 0;
      setCompliance({
        completed,
        total,
        incomplete: total - completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
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

  const donutData = [
    { name: "Completed", value: compliance.completed },
    { name: "Incomplete", value: compliance.incomplete },
  ];
  const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Workout Compliance
            </CardTitle>
            <CardDescription>{compliance.completed}/{compliance.total} workouts completed</CardDescription>
          </div>
          <DateRangeSelector defaultPreset="1M" onRangeChange={loadData} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
        ) : compliance.total === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mb-4 opacity-50" />
            <p>No workouts in this range</p>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-2xl font-bold"
                >
                  {compliance.percentage}%
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
