import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface ProgramRow {
  id: string;
  name: string;
  category: string;
  duration_weeks: number;
  days_per_week: number;
}

/**
 * Curated allow-list: which programs Tier 2 athletes can browse and self-select.
 * Backed by `program_availability` (coach_id + program_id + service_tier).
 */
export function ProgramAvailabilityManager() {
  const { user } = useAuthStore();
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [available, setAvailable] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [progRes, availRes] = await Promise.all([
        supabase.from("programs").select("id, name, category, duration_weeks, days_per_week").eq("is_active", true).order("name"),
        supabase
          .from("program_availability")
          .select("program_id, is_available")
          .eq("coach_id", user.id)
          .eq("service_tier", "tier_2"),
      ]);
      if (cancelled) return;
      setPrograms((progRes.data || []) as ProgramRow[]);
      setAvailable(
        Object.fromEntries((availRes.data || []).map((a: any) => [a.program_id, a.is_available])),
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const toggle = async (programId: string, next: boolean) => {
    if (!user) return;
    setBusy(programId);
    const { error } = await supabase
      .from("program_availability")
      .upsert(
        { coach_id: user.id, program_id: programId, service_tier: "tier_2", client_id: null, is_available: next },
        { onConflict: "coach_id,program_id,service_tier" },
      );
    setBusy(null);
    if (error) {
      toast.error("Could not update availability.");
      return;
    }
    setAvailable((a) => ({ ...a, [programId]: next }));
    toast.success(next ? "Program available to Tier 2." : "Program hidden from Tier 2.");
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Tier 2 athletes can browse and switch between the programs you switch on here. Tier 1 athletes get
        individual programming from you instead.
      </p>
      {programs.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {p.duration_weeks} weeks · {p.days_per_week} days/week
              <Badge variant="outline" className="ml-2 text-[10px] capitalize">{p.category}</Badge>
            </p>
          </div>
          <Switch
            checked={!!available[p.id]}
            disabled={busy === p.id}
            onCheckedChange={(v) => toggle(p.id, v)}
            aria-label={`Make ${p.name} available to Tier 2`}
          />
        </div>
      ))}
    </div>
  );
}
