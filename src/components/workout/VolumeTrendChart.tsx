import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { WeeklyVolume } from "@/types/workout";

export function VolumeTrendChart() {
  const { fetchWeeklyVolume } = useWorkoutStore();
  const [data, setData] = useState<WeeklyVolume[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const volumeData = await fetchWeeklyVolume(4);
      setData(volumeData);
      setIsLoading(false);
    };
    loadData();
  }, [fetchWeeklyVolume]);

  const chartData = data.map(d => ({
    week: d.week_label.replace('Week of ', ''),
    volume: d.total_volume,
  }));

  const currentWeekVolume = data[data.length - 1]?.total_volume || 0;
  const lastWeekVolume = data[data.length - 2]?.total_volume || 0;
  const percentChange = lastWeekVolume 
    ? Math.round(((currentWeekVolume - lastWeekVolume) / lastWeekVolume) * 100)
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
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Weekly Training Volume
        </CardTitle>
        <CardDescription>Total weight × reps for completed sets</CardDescription>
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
                    formatter={(value: number) => [`${value.toLocaleString()} lbs`, 'Volume']}
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
                <p className="text-2xl font-bold">{currentWeekVolume.toLocaleString()} lbs</p>
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
