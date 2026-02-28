import { useMemo, useState, useCallback } from "react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type BodyEntry, kgToLbs } from "@/types/progress";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { DateRangeSelector, computeRange } from "@/components/ui/DateRangeSelector";

interface WeightChartProps {
  entries: BodyEntry[];
  usesImperial: boolean;
}

export function WeightChart({ entries, usesImperial }: WeightChartProps) {
  const [dateRange, setDateRange] = useState(() => computeRange("3M"));

  const handleRangeChange = useCallback((from: Date, to: Date) => {
    setDateRange({ from, to });
  }, []);

  const chartData = useMemo(() => {
    const weightEntries = entries
      .filter(e => {
        if (e.weight_kg === null) return false;
        const d = parseISO(e.entry_date);
        return !isBefore(d, dateRange.from) && !isAfter(d, dateRange.to);
      })
      .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());

    return weightEntries.map(entry => ({
      date: format(parseISO(entry.entry_date), "MMM d"),
      fullDate: entry.entry_date,
      weight: usesImperial && entry.weight_kg 
        ? kgToLbs(entry.weight_kg) 
        : entry.weight_kg,
      bmi: entry.bmi,
    }));
  }, [entries, usesImperial, dateRange]);

  // Calculate average for reference line
  const avgWeight = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, d) => acc + (d.weight || 0), 0);
    return Math.round((sum / chartData.length) * 10) / 10;
  }, [chartData]);

  // Calculate trend (simple linear regression)
  const trendData = useMemo(() => {
    if (chartData.length < 2) return null;

    const n = chartData.length;
    const weights = chartData.map(d => d.weight || 0);
    
    // Calculate slope and intercept
    const sumX = (n * (n - 1)) / 2;
    const sumY = weights.reduce((a, b) => a + b, 0);
    const sumXY = weights.reduce((acc, y, i) => acc + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      slope,
      direction: slope > 0.01 ? "up" : slope < -0.01 ? "down" : "stable"
    };
  }, [chartData]);

  const chartConfig = {
    weight: {
      label: `Weight (${usesImperial ? "lbs" : "kg"})`,
      color: "hsl(var(--primary))",
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No weight data to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DateRangeSelector defaultPreset="3M" onRangeChange={handleRangeChange} />
      {/* Trend indicator */}
      {trendData && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Trend:</span>
          <span className={
            trendData.direction === "down" 
              ? "text-green-500" 
              : trendData.direction === "up" 
                ? "text-amber-500" 
                : "text-muted-foreground"
          }>
            {trendData.direction === "down" && "↓ Decreasing"}
            {trendData.direction === "up" && "↑ Increasing"}
            {trendData.direction === "stable" && "→ Stable"}
          </span>
          <span className="text-muted-foreground">
            | Avg: {avgWeight} {usesImperial ? "lbs" : "kg"}
          </span>
        </div>
      )}

      <ChartContainer config={chartConfig} className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return format(parseISO(payload[0].payload.fullDate), "MMMM d, yyyy");
                    }
                    return value;
                  }}
                />
              }
            />
            <ReferenceLine 
              y={avgWeight} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
