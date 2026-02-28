import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { ALL_EXERCISES, ExerciseHistory } from "@/types/workout";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { convertWeight } from "@/lib/weightConversion";
import { DateRangeSelector, computeRange } from "@/components/ui/DateRangeSelector";

export function StrengthTrendChart() {
  const { fetchExerciseHistory, personalRecords, preferredUnit } = useWorkoutStore();
  const [selectedExercise, setSelectedExercise] = useState("back squat (high bar)");
  const [history, setHistory] = useState<ExerciseHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState(() => computeRange("3M"));

  const userExercises = personalRecords.map(pr => pr.exercise_name);
  const exerciseOptions = [...new Set([
    ...userExercises,
    ...ALL_EXERCISES.map(e => e.toLowerCase())
  ])].sort();

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const data = await fetchExerciseHistory(selectedExercise);
      setHistory(data);
      setIsLoading(false);
    };
    loadHistory();
  }, [selectedExercise, fetchExerciseHistory]);

  const handleRangeChange = useCallback((from: Date, to: Date) => {
    setDateRange({ from, to });
  }, []);

  const filteredHistory = history.filter(h => {
    const d = parseISO(h.date);
    return !isBefore(d, dateRange.from) && !isAfter(d, dateRange.to);
  });

  const chartData = filteredHistory.map(h => ({
    date: format(new Date(h.date), 'MMM d'),
    weight: preferredUnit === 'kg' ? convertWeight(h.max_weight, 'lbs', 'kg') : h.max_weight,
  }));

  const currentPR = personalRecords.find(pr => pr.exercise_name === selectedExercise.toLowerCase());
  const firstWeight = history[0]?.max_weight;
  const percentageGain = firstWeight && currentPR 
    ? Math.round(((currentPR.max_weight - firstWeight) / firstWeight) * 100)
    : 0;
  
  const displayCurrentMax = currentPR 
    ? preferredUnit === 'kg' 
      ? convertWeight(currentPR.max_weight, 'lbs', 'kg') 
      : currentPR.max_weight
    : null;

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Strength Progress
              </CardTitle>
              <CardDescription>Track your max weight over time</CardDescription>
            </div>
            
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {exerciseOptions.map(exercise => (
                  <SelectItem key={exercise} value={exercise}>
                    {exercise.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DateRangeSelector defaultPreset="3M" onRangeChange={handleRangeChange} />
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p>No data for this exercise yet</p>
            <p className="text-sm">Complete some sets to see your progress</p>
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} ${preferredUnit}`, 'Max Weight']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Current Max</p>
                <p className="text-2xl font-bold">{displayCurrentMax || '—'} {preferredUnit}</p>
              </div>
              {percentageGain !== 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Since Start</p>
                  <p className={`text-lg font-semibold ${percentageGain > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {percentageGain > 0 ? '+' : ''}{percentageGain}%
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
