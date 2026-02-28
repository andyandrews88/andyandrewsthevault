import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Legend,
} from "recharts";
import { Target, BarChart3, LayoutGrid } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek } from "date-fns";
import {
  classifyExercise, classifyExerciseWithDb, calculateSetVolume, normalizeVolume,
  ALL_PATTERNS, MOVEMENT_PATTERN_LABELS, MOVEMENT_PATTERN_SHORT,
  PATTERN_COLORS, DIFFICULTY_COEFFICIENTS,
  type MovementPattern, type PatternVolumeData, type WeeklyPatternVolume,
} from "@/lib/movementPatterns";
import { useWorkoutStore } from "@/stores/workoutStore";
import { convertWeight } from "@/lib/weightConversion";

type TimeRange = '1' | '4' | '12';

type ExerciseBreakdown = { name: string; volume: number; sets: number };

type ExtendedPatternData = PatternVolumeData & {
  exerciseBreakdown: ExerciseBreakdown[];
};

const TIME_LABELS: Record<TimeRange, string> = {
  '1': 'This Week',
  '4': '4 Weeks',
  '12': '12 Weeks',
};

export function MovementBalanceChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('4');
  const [view, setView] = useState<'radar' | 'bar' | 'cards'>('radar');
  const [patternData, setPatternData] = useState<Record<MovementPattern, ExtendedPatternData>>({} as any);
  const [weeklyData, setWeeklyData] = useState<WeeklyPatternVolume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<MovementPattern | null>(null);
  const preferredUnit = useWorkoutStore(s => s.preferredUnit);

  useEffect(() => {
    fetchData(parseInt(timeRange));
  }, [timeRange]);

  const fetchData = async (weeks: number) => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setIsLoading(false); return; }

    const fromDate = format(subDays(new Date(), weeks * 7), 'yyyy-MM-dd');

    const { data: bodyEntry } = await supabase
      .from('user_body_entries')
      .select('weight_kg')
      .eq('user_id', session.user.id)
      .not('weight_kg', 'is', null)
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const bodyWeightKg = bodyEntry?.weight_kg ?? null;

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

    // Fetch exercise_library entries for DB-stored patterns/equipment
    const uniqueNames = [...new Set(exercises.map(e => e.exercise_name))];
    const { data: libEntries } = await supabase
      .from('exercise_library' as any)
      .select('name, movement_pattern, equipment_type')
      .in('name', uniqueNames);

    const libMap = new Map<string, { movement_pattern?: string | null; equipment_type?: string | null }>();
    for (const entry of (libEntries || []) as any[]) {
      libMap.set(entry.name?.toLowerCase(), { movement_pattern: entry.movement_pattern, equipment_type: entry.equipment_type });
    }

    // Build aggregation
    const totals: Record<MovementPattern, ExtendedPatternData> = {} as any;
    for (const p of ALL_PATTERNS) {
      totals[p] = { pattern: p, rawVolume: 0, normalizedVolume: 0, sets: 0, exercises: new Set(), exerciseBreakdown: [] };
    }

    // Track per-exercise volume
    const exerciseVolMap = new Map<string, Map<string, { volume: number; sets: number }>>();
    for (const p of ALL_PATTERNS) exerciseVolMap.set(p, new Map());

    const weeklyMap = new Map<string, Record<MovementPattern, number>>();
    const exerciseMap = new Map(exercises.map(e => [e.id, e]));

    for (const set of sets || []) {
      const ex = exerciseMap.get(set.exercise_id);
      if (!ex) continue;

      const lib = libMap.get(ex.exercise_name.toLowerCase());
      const pattern = classifyExerciseWithDb(ex.exercise_name, lib?.movement_pattern);
      const vol = calculateSetVolume(ex.exercise_name, set.weight, set.reps, bodyWeightKg);

      totals[pattern].rawVolume += vol;
      totals[pattern].normalizedVolume += normalizeVolume(vol, pattern, ex.exercise_name, lib?.equipment_type);
      totals[pattern].sets += 1;
      totals[pattern].exercises.add(ex.exercise_name);

      // Per-exercise breakdown
      const patternExMap = exerciseVolMap.get(pattern)!;
      const existing = patternExMap.get(ex.exercise_name) || { volume: 0, sets: 0 };
      existing.volume += vol;
      existing.sets += 1;
      patternExMap.set(ex.exercise_name, existing);

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

    // Build exercise breakdowns
    for (const p of ALL_PATTERNS) {
      const exMap = exerciseVolMap.get(p)!;
      totals[p].exerciseBreakdown = Array.from(exMap.entries())
        .map(([name, d]) => ({ name, volume: d.volume, sets: d.sets }))
        .sort((a, b) => b.volume - a.volume);
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
      key: p,
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

  // ─── Selected pattern data for drawer ───
  const selectedData = selectedPattern ? patternData[selectedPattern] : null;
  const selectedWeeklyTrend = useMemo(() => {
    if (!selectedPattern) return [];
    return weeklyData.map(w => ({
      week: w.weekLabel,
      volume: Math.round(convert(w.patterns[selectedPattern])),
    }));
  }, [selectedPattern, weeklyData, preferredUnit]);

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
    <>
      <Card variant="elevated">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base">Movement Balance</CardTitle>
            <div className="flex items-center gap-2">
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
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="60%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="pattern"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar
                    name="NTU"
                    dataKey="ntu"
                    stroke="hsl(192, 91%, 54%)"
                    fill="hsl(192, 91%, 54%)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    onClick={(e: any) => {
                      if (e?.activeTooltipIndex != null) {
                        const d = radarData[e.activeTooltipIndex];
                        if (d) setSelectedPattern(d.key as MovementPattern);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                          <p className="font-medium text-foreground">{d.pattern}</p>
                          <p className="text-muted-foreground">{Math.round(d.ntu).toLocaleString()} NTU</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Tap for breakdown</p>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {ALL_PATTERNS.map(p => (
                    <Bar
                      key={p}
                      dataKey={p}
                      stackId="vol"
                      fill={PATTERN_COLORS[p]}
                      radius={p === 'isolation' ? [2, 2, 0, 0] : undefined}
                      onClick={() => setSelectedPattern(p)}
                      style={{ cursor: 'pointer' }}
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
                  <div
                    key={p}
                    className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.98]"
                    onClick={() => setSelectedPattern(p)}
                  >
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

      {/* ─── Pattern Breakdown Drawer ─── */}
      <Sheet open={!!selectedPattern} onOpenChange={open => { if (!open) setSelectedPattern(null); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          {selectedPattern && selectedData && (
            <>
              <SheetHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PATTERN_COLORS[selectedPattern] }} />
                  <SheetTitle className="text-lg">{MOVEMENT_PATTERN_LABELS[selectedPattern]}</SheetTitle>
                </div>
                <SheetDescription>
                  {Math.round(convert(selectedData.rawVolume)).toLocaleString()} {preferredUnit} total · {selectedData.sets} sets · {TIME_LABELS[timeRange]}
                </SheetDescription>
              </SheetHeader>

              {/* Exercise Breakdown */}
              <div className="space-y-2 mb-6">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exercise Breakdown</h4>
                {selectedData.exerciseBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No exercises logged</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedData.exerciseBreakdown.map((ex) => {
                      const proportion = selectedData.rawVolume > 0 ? ex.volume / selectedData.rawVolume : 0;
                      return (
                        <div key={ex.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate mr-2">{ex.name}</span>
                            <span className="text-muted-foreground text-xs whitespace-nowrap">
                              {Math.round(convert(ex.volume)).toLocaleString()} {preferredUnit} · {ex.sets}s
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.round(proportion * 100)}%`,
                                backgroundColor: PATTERN_COLORS[selectedPattern],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Weekly Trend */}
              {selectedWeeklyTrend.length > 1 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Weekly Volume</h4>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedWeeklyTrend} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs shadow-lg">
                                <p>{payload[0].payload.week}</p>
                                <p className="font-medium">{Number(payload[0].value).toLocaleString()} {preferredUnit}</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="volume" fill={PATTERN_COLORS[selectedPattern]} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
