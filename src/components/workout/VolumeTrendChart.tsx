import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { WeeklyVolume } from "@/types/workout";
import { convertWeight } from "@/lib/weightConversion";
import { DateRangeSelector, computeRange } from "@/components/ui/DateRangeSelector";
import { differenceInDays } from "date-fns";

export function VolumeTrendChart() {
  const { fetchWeeklyVolume, preferredUnit } = useWorkoutStore();
  const [data, setData] = useState<WeeklyVolume[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async (from: Date, to: Date) => {
    setIsLoading(true);
    const weeks = Math.max(1, Math.ceil(differenceInDays(to, from) / 7));
    const volumeData = await fetchWeeklyVolume(weeks);
    setData(volumeData);
    setIsLoading(false);
  }, [fetchWeeklyVolume]);

  useEffect(() => {
    const { from, to } = computeRange("1M");
    loadData(from, to);
  }, [loadData]);

  const chartData = data.map(d => ({
    week: d.week_label.replace('Week of ', ''),
    volume: preferredUnit === 'kg' ? convertWeight(d.total_volume, 'lbs', 'kg') : d.total_volume,
  }));

  const rawCurrentWeekVolume = data[data.length - 1]?.total_volume || 0;
  const rawLastWeekVolume = data[data.length - 2]?.total_volume || 0;
  const currentWeekVolume = preferredUnit === 'kg' 
    ? convertWeight(rawCurrentWeekVolume, 'lbs', 'kg') 
    : rawCurrentWeekVolume;
  const percentChange = rawLastWeekVolume 
    ? Math.round(((rawCurrentWeekVolume - rawLastWeekVolume) / rawLastWeekVolume) * 100)
    : 0;

  const formatVolume = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Training Volume
            </CardTitle>
            <CardDescription>Total weight × reps for completed sets</CardDescription>
          </div>
          <DateRangeSelector defaultPreset="1M" onRangeChange={loadData} />
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p>No workout data yet</p>
            <p className="text-sm">Complete some workouts to see your volume trends</p>
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={formatVolume}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} ${preferredUnit}`, 'Volume']}
                  />
                  <Bar 
                    dataKey="volume" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{currentWeekVolume.toLocaleString()} {preferredUnit}</p>
              </div>
              {percentChange !== 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">vs Last Week</p>
                  <p className={`text-lg font-semibold ${percentChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {percentChange > 0 ? '↑' : '↓'} {Math.abs(percentChange)}%
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
