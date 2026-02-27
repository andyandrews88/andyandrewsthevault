import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Legend,
} from "recharts";
import { Target, BarChart3, LayoutGrid, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek } from "date-fns";
import {
  classifyExercise, calculateSetVolume, normalizeVolume,
  ALL_PATTERNS, MOVEMENT_PATTERN_LABELS, MOVEMENT_PATTERN_SHORT,
  PATTERN_COLORS, DIFFICULTY_COEFFICIENTS,
  type MovementPattern, type PatternVolumeData, type WeeklyPatternVolume,
} from "@/lib/movementPatterns";
import { useWorkoutStore } from "@/stores/workoutStore";
import { convertWeight } from "@/lib/weightConversion";

type TimeRange = '1' | '4' | '12';

const TIME_LABELS: Record<TimeRange, string> = {
  '1': 'This Week',
  '4': '4 Weeks',
  '12': '12 Weeks',
};

export function MovementBalanceChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('4');
  const [view, setView] = useState<'radar' | 'bar' | 'cards'>('radar');
  const [patternData, setPatternData] = useState<Record<MovementPattern, PatternVolumeData>>({} as any);
  const [weeklyData, setWeeklyData] = useState<WeeklyPatternVolume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const preferredUnit = useWorkoutStore(s => s.preferredUnit);

  useEffect(() => {
    fetchData(parseInt(timeRange));
  }, [timeRange]);

  const fetchData = async (weeks: number) => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setIsLoading(false); return; }

    const fromDate = format(subDays(new Date(), weeks * 7), 'yyyy-MM-dd');

    // Fetch body weight
    const { data: bodyEntry } = await supabase
      .from('user_body_entries')
      .select('weight_kg')
      .eq('user_id', session.user.id)
      .not('weight_kg', 'is', null)
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const bodyWeightKg = bodyEntry?.weight_kg ?? null;

    // Fetch completed workouts with exercises and sets
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, date')
      .eq('user_id', session.user.id)
      .eq('is_completed', true)
      .gte('date', fromDate);

    if (!workouts?.length) {
      setPatternData({} as any);
      setWeeklyData([]);
      setIsLoading(false);
      return;
    }

    const workoutIds = workouts.map(w => w.id);
    const dateMap = new Map(workouts.map(w => [w.id, w.date]));

    const { data: exercises } = await supabase
      .from('workout_exercises')
      .select('id, workout_id, exercise_name, exercise_type')
      .in('workout_id', workoutIds);

    if (!exercises?.length) {
      setPatternData({} as any);
      setWeeklyData([]);
      setIsLoading(false);
      return;
    }

    const exerciseIds = exercises.filter(e => e.exercise_type !== 'conditioning').map(e => e.id);

    const { data: sets } = await supabase
      .from('exercise_sets')
      .select('exercise_id, weight, reps, is_completed')
      .in('exercise_id', exerciseIds)
      .eq('is_completed', true);

    // Build aggregation
    const totals: Record<MovementPattern, PatternVolumeData> = {} as any;
    for (const p of ALL_PATTERNS) {
      totals[p] = { pattern: p, rawVolume: 0, normalizedVolume: 0, sets: 0, exercises: new Set() };
    }

    const weeklyMap = new Map<string, Record<MovementPattern, number>>();

    const exerciseMap = new Map(exercises.map(e => [e.id, e]));

    for (const set of sets || []) {
      const ex = exerciseMap.get(set.exercise_id);
      if (!ex) continue;

      const pattern = classifyExercise(ex.exercise_name);
      const vol = calculateSetVolume(ex.exercise_name, set.weight, set.reps, bodyWeightKg);

      totals[pattern].rawVolume += vol;
      totals[pattern].normalizedVolume += normalizeVolume(vol, pattern);
      totals[pattern].sets += 1;
      totals[pattern].exercises.add(ex.exercise_name);

      // Weekly aggregation
      const workoutDate = dateMap.get(ex.workout_id);
      if (workoutDate) {
        const ws = format(startOfWeek(new Date(workoutDate + 'T12:00:00'), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        if (!weeklyMap.has(ws)) {
          const empty: Record<MovementPattern, number> = {} as any;
          ALL_PATTERNS.forEach(p => empty[p] = 0);
          weeklyMap.set(ws, empty);
        }
        weeklyMap.get(ws)![pattern] += vol;
      }
    }

    setPatternData(totals);

    const weekly = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ws, patterns]) => ({
        weekStart: ws,
        weekLabel: `W/O ${format(new Date(ws + 'T12:00:00'), 'MMM d')}`,
        patterns,
      }));
    setWeeklyData(weekly);
    setIsLoading(false);
  };

  const hasData = Object.values(patternData).some(p => p.rawVolume > 0);

  const convert = (val: number) =>
    preferredUnit === 'kg' ? convertWeight(val, 'lbs', 'kg') : val;

  // ─── Radar Data ───
  const radarData = useMemo(() =>
    ALL_PATTERNS.filter(p => p !== 'isolation').map(p => ({
      pattern: MOVEMENT_PATTERN_LABELS[p],
      short: MOVEMENT_PATTERN_SHORT[p],
      ntu: Math.round(patternData[p]?.normalizedVolume ?? 0),
      fullMark: Math.max(...ALL_PATTERNS.map(pp => patternData[pp]?.normalizedVolume ?? 0)) * 1.1 || 1000,
    })),
    [patternData]
  );

  // ─── Bar Data ───
  const barData = useMemo(() =>
    weeklyData.map(w => {
      const row: any = { week: w.weekLabel };
      ALL_PATTERNS.forEach(p => { row[p] = Math.round(convert(w.patterns[p])); });
      return row;
    }),
    [weeklyData, preferredUnit]
  );

  const chartConfig = useMemo(() => {
    const cfg: any = {};
    ALL_PATTERNS.forEach(p => {
      cfg[p] = { label: MOVEMENT_PATTERN_LABELS[p], color: PATTERN_COLORS[p] };
    });
    return cfg;
  }, []);

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardHeader><CardTitle className="text-base">Movement Balance</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card variant="elevated">
        <CardHeader><CardTitle className="text-base">Movement Balance</CardTitle></CardHeader>
        <CardContent className="text-center py-8">
          <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">Complete workouts to see your movement balance</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base">Movement Balance</CardTitle>
          <div className="flex items-center gap-2">
            {/* Time range */}
            <div className="flex rounded-md border border-border overflow-hidden">
              {(['1', '4', '12'] as TimeRange[]).map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    timeRange === r
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {TIME_LABELS[r]}
                </button>
              ))}
            </div>
            {/* View toggle */}
            <div className="flex rounded-md border border-border overflow-hidden">
              <button onClick={() => setView('radar')} className={`p-1.5 ${view === 'radar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Target className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView('bar')} className={`p-1.5 ${view === 'bar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView('cards')} className={`p-1.5 ${view === 'cards' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {view === 'radar' && (
          <div className="w-full aspect-square max-h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(215, 14%, 22%)" />
                <PolarAngleAxis
                  dataKey="short"
                  tick={{ fill: 'hsl(215, 14%, 50%)', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  name="NTU"
                  dataKey="ntu"
                  stroke="hsl(192, 91%, 54%)"
                  fill="hsl(192, 91%, 54%)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                        <p className="font-medium text-foreground">{d.pattern}</p>
                        <p className="text-muted-foreground">{Math.round(d.ntu).toLocaleString()} NTU</p>
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              Normalized Training Units — balanced athletes show an even polygon
            </p>
          </div>
        )}

        {view === 'bar' && (
          <div className="w-full h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 14%, 16%)" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(215, 14%, 50%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 14%, 50%)' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {ALL_PATTERNS.map(p => (
                  <Bar
                    key={p}
                    dataKey={p}
                    stackId="vol"
                    fill={PATTERN_COLORS[p]}
                    radius={p === 'isolation' ? [2, 2, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {view === 'cards' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_PATTERNS.map(p => {
              const d = patternData[p];
              if (!d || d.rawVolume === 0) return (
                <div key={p} className="rounded-lg border border-border bg-muted/30 p-3 opacity-50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PATTERN_COLORS[p] }} />
                    <span className="text-xs font-medium">{MOVEMENT_PATTERN_LABELS[p]}</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-muted-foreground">—</p>
                </div>
              );

              const vol = Math.round(convert(d.rawVolume));
              const exCount = d.exercises.size;

              return (
                <div key={p} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PATTERN_COLORS[p] }} />
                    <span className="text-xs font-medium">{MOVEMENT_PATTERN_LABELS[p]}</span>
                  </div>
                  <p className="text-lg font-bold font-mono">{vol.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {preferredUnit} · {d.sets} sets · {exCount} exercise{exCount !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
