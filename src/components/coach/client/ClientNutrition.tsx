import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ServiceTier } from "@/lib/entitlements";

interface Props {
  clientId: string;
  tier: ServiceTier;
}

interface DiaryRow {
  id: string;
  entry_date: string;
  meal_slot: string;
  source: string;
  is_confirmed: boolean;
  food_data: any;
  calculated_macros: any;
  ai_estimate: any;
  photo_path: string | null;
}

interface TargetRow {
  id: string;
  effective_from: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
}

export function ClientNutrition({ clientId, tier }: Props) {
  const [entries, setEntries] = useState<DiaryRow[]>([]);
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ calories: "", protein_g: "", carbs_g: "", fats_g: "" });

  const load = async () => {
    setLoading(true);
    const [diaryRes, targetRes] = await Promise.all([
      supabase
        .from("user_food_diary")
        .select("id, entry_date, meal_slot, source, is_confirmed, food_data, calculated_macros, ai_estimate, photo_path")
        .eq("user_id", clientId)
        .order("entry_date", { ascending: false })
        .limit(60),
      supabase
        .from("nutrition_targets")
        .select("id, effective_from, calories, protein_g, carbs_g, fats_g")
        .eq("user_id", clientId)
        .order("effective_from", { ascending: false }),
    ]);
    setEntries((diaryRes.data || []) as DiaryRow[]);
    setTargets((targetRes.data || []) as TargetRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  const saveTarget = async () => {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const payload = {
      user_id: clientId,
      effective_from: format(new Date(), "yyyy-MM-dd"),
      calories: form.calories ? Number(form.calories) : null,
      protein_g: form.protein_g ? Number(form.protein_g) : null,
      carbs_g: form.carbs_g ? Number(form.carbs_g) : null,
      fats_g: form.fats_g ? Number(form.fats_g) : null,
      set_by: auth.user?.id ?? null,
    };
    const { error } = await supabase.from("nutrition_targets").upsert(payload, { onConflict: "user_id,effective_from" });
    setSaving(false);
    if (error) {
      toast.error("Could not save the targets.");
      return;
    }
    toast.success("Targets saved from today.");
    setForm({ calories: "", protein_g: "", carbs_g: "", fats_g: "" });
    load();
  };

  const byDate = entries.reduce<Record<string, DiaryRow[]>>((acc, e) => {
    (acc[e.entry_date] ||= []).push(e);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {tier === "tier_1" ? (
        <div className="rounded-xl border border-border bg-card p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Set targets (effective today)</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["calories", "protein_g", "carbs_g", "fats_g"] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label className="text-[11px] capitalize">{k.replace("_g", "")}</Label>
                <Input
                  inputMode="decimal"
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  placeholder="—"
                />
              </div>
            ))}
          </div>
          <Button size="sm" className="min-h-[44px]" onClick={saveTarget} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save targets
          </Button>
          {targets.length > 0 && (
            <div className="pt-1 space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Target history</p>
              {targets.slice(0, 5).map((t) => (
                <p key={t.id} className="text-xs text-muted-foreground">
                  From {format(new Date(t.effective_from), "d MMM yyyy")}: {t.calories ?? "—"} kcal ·
                  {" "}P {t.protein_g ?? "—"} · C {t.carbs_g ?? "—"} · F {t.fats_g ?? "—"}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tier 2: the athlete self-logs and sets their own targets. Nutrition review is a Tier 1 service.
        </p>
      )}

      {Object.keys(byDate).length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No food logged yet.</p>
      ) : (
        Object.entries(byDate).map(([date, rows]) => {
          const totals = rows.reduce(
            (acc, r) => {
              const m = r.calculated_macros || {};
              acc.calories += Number(m.calories || 0);
              acc.protein += Number(m.protein || 0);
              acc.carbs += Number(m.carbs || 0);
              acc.fats += Number(m.fats || 0);
              return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fats: 0 },
          );
          return (
            <div key={date} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{format(new Date(date), "EEE d MMM")}</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {Math.round(totals.calories)} kcal · P{Math.round(totals.protein)} C{Math.round(totals.carbs)} F{Math.round(totals.fats)}
                </p>
              </div>
              <div className="mt-2 space-y-1.5">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px] capitalize">{r.meal_slot}</Badge>
                    <span className="truncate flex-1">{r.food_data?.name || r.food_data?.food_name || "Entry"}</span>
                    <Badge variant="secondary" className="text-[10px] capitalize">{r.source}</Badge>
                    {r.ai_estimate && (
                      <span className={`text-[10px] ${r.is_confirmed ? "text-muted-foreground" : "text-amber-500"}`}>
                        {r.is_confirmed ? "confirmed" : "unconfirmed estimate"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
