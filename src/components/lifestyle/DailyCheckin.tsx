import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Moon, Brain, Zap, Flame, CheckCircle, Edit3, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface CheckinData {
  id?: string;
  sleep_hours: number;
  sleep_score: number;
  stress_score: number;
  energy_score: number;
  drive_score: number;
  notes: string;
}

const METRICS = [
  {
    key: "sleep_score" as const,
    label: "Sleep Quality",
    question: "How well did you sleep last night?",
    icon: Moon,
    labels: ["Poor", "Fair", "Okay", "Good", "Excellent"],
  },
  {
    key: "stress_score" as const,
    label: "Stress Level",
    question: "How is your stress level today?",
    icon: Brain,
    labels: ["Very High", "High", "Moderate", "Low", "Very Low"],
  },
  {
    key: "energy_score" as const,
    label: "Energy",
    question: "How is your energy right now?",
    icon: Zap,
    labels: ["Depleted", "Low", "Steady", "High", "Charged"],
  },
  {
    key: "drive_score" as const,
    label: "Drive",
    question: "How motivated do you feel today?",
    icon: Flame,
    labels: ["Flat", "Low", "Neutral", "Motivated", "Fired Up"],
  },
];

/** Matthew Walker-weighted sleep hours → 1-5 score */
function sleepHoursToScore(hours: number): number {
  if (hours < 5) return 1;
  if (hours < 6) return 2;
  if (hours < 7) return 3;
  if (hours < 8) return 4;
  return 5;
}

/** Walker-weighted readiness: sleep_hours×2 + sleep_quality + energy + drive + (6-stress) / 7 × 100 */
function calcReadiness(data: CheckinData): number {
  const { sleep_hours, sleep_score, stress_score, energy_score, drive_score } = data;
  if (!sleep_score || !stress_score || !energy_score || !drive_score) return 0;
  const shScore = sleepHoursToScore(sleep_hours);
  const raw = (shScore * 2 + sleep_score + energy_score + drive_score + stress_score) / (7 * 5);
  return Math.round(raw * 100);
}

export function DailyCheckin() {
  const [data, setData] = useState<CheckinData>({
    sleep_hours: 7,
    sleep_score: 0,
    stress_score: 0,
    energy_score: 0,
    drive_score: 0,
    notes: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodayCheckin();
  }, []);

  const fetchTodayCheckin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: checkin } = await supabase
        .from("user_daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .eq("check_date", today)
        .maybeSingle();

      if (checkin) {
        setData({
          id: checkin.id,
          sleep_hours: (checkin as any).sleep_hours ?? 7,
          sleep_score: checkin.sleep_score,
          stress_score: checkin.stress_score,
          energy_score: checkin.energy_score,
          drive_score: checkin.drive_score,
          notes: checkin.notes || "",
        });
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error("Error fetching checkin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const readinessScore = () => calcReadiness(data);

  const handleSubmit = async () => {
    const { sleep_score, stress_score, energy_score, drive_score } = data;
    if (!sleep_score || !stress_score || !energy_score || !drive_score) {
      toast.error("Please rate all four metrics before submitting.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");
      const payload: any = {
        user_id: user.id,
        check_date: today,
        sleep_hours: data.sleep_hours,
        sleep_score,
        stress_score,
        energy_score,
        drive_score,
        notes: data.notes || null,
      };

      if (data.id) {
        await supabase.from("user_daily_checkins").update(payload).eq("id", data.id);
      } else {
        const { data: inserted } = await supabase.from("user_daily_checkins").insert(payload).select().single();
        if (inserted) setData(prev => ({ ...prev, id: inserted.id }));
      }

      setIsSubmitted(true);
      setIsEditing(false);
      toast.success("Check-in saved!");
    } catch (err) {
      console.error("Error saving checkin:", err);
      toast.error("Failed to save check-in.");
    } finally {
      setIsSaving(false);
    }
  };

  const setScore = (key: keyof CheckinData, value: number) => {
    if (isSubmitted && !isEditing) return;
    setData(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <Card variant="data">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const showForm = !isSubmitted || isEditing;
  const score = readinessScore();

  return (
    <Card variant="data">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Daily Check-In</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        {isSubmitted && !isEditing && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Readiness</p>
              <p className="text-2xl font-mono text-primary font-bold">{score}%</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isSubmitted && !isEditing ? (
          <div className="space-y-4">
            {/* Sleep Hours display */}
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Sleep Duration</p>
              <p className="font-mono text-lg font-semibold">{data.sleep_hours}h</p>
              <p className="text-xs text-muted-foreground">
                {data.sleep_hours >= 7 ? "✓ Optimal range" : data.sleep_hours >= 6 ? "⚠ Below optimal" : "⚠ Sleep deficit"}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {METRICS.map(metric => {
                const val = data[metric.key] as number;
                return (
                  <div key={metric.key} className="text-center p-3 rounded-lg bg-secondary/50">
                    <metric.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="font-mono text-lg font-semibold">{val}/5</p>
                    <p className="text-xs text-muted-foreground">{metric.labels[val - 1]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Sleep Hours Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">How many hours did you sleep?</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Hours</span>
                  <span className="text-lg font-mono font-bold text-primary">{data.sleep_hours}h</span>
                </div>
                <Slider
                  value={[data.sleep_hours]}
                  onValueChange={([v]) => setData(prev => ({ ...prev, sleep_hours: v }))}
                  min={0}
                  max={14}
                  step={0.5}
                  className="w-full"
                  disabled={isSubmitted && !isEditing}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0h</span>
                  <span className="text-destructive font-medium">5h</span>
                  <span className="text-yellow-500 font-medium">7h</span>
                  <span className="text-green-500 font-medium">8h+</span>
                  <span>14h</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.sleep_hours >= 8 ? "🟢 Excellent — full recovery likely" : 
                   data.sleep_hours >= 7 ? "🟢 Good — meets Walker's minimum" :
                   data.sleep_hours >= 6 ? "🟡 Below optimal — some recovery debt" :
                   "🔴 Sleep deficit — expect reduced performance"}
                </p>
              </div>
            </div>

            {METRICS.map(metric => {
              const val = data[metric.key] as number;
              return (
                <div key={metric.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <metric.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{metric.question}</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setScore(metric.key, n)}
                        className={`flex-1 py-3 rounded-md text-sm font-medium transition-all min-h-[48px] ${
                          val === n
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                        }`}
                      >
                        <span className="block text-base font-mono">{n}</span>
                        <span className="block text-[10px] mt-0.5 opacity-70">{metric.labels[n - 1]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
              <Textarea
                placeholder="How are you feeling? Any context for today..."
                value={data.notes}
                onChange={e => setData(prev => ({ ...prev, notes: e.target.value }))}
                className="resize-none"
                rows={2}
              />
            </div>

            {score > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <span className="text-sm text-muted-foreground">Readiness Score</span>
                  <p className="text-[10px] text-muted-foreground">Walker-weighted: sleep hours ×2</p>
                </div>
                <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"} className="font-mono text-base px-3">
                  {score}%
                </Badge>
              </div>
            )}

            <div className="flex gap-2">
              {isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : data.id ? "Update Check-In" : "Submit Check-In"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
