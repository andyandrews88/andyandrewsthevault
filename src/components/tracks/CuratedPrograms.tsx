import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgramCard } from "./ProgramCard";
import { ProgramAssignmentWizard } from "./ProgramAssignmentWizard";
import { useProgramStore, Program } from "@/stores/programStore";
import { useEntitlement } from "@/hooks/useEntitlement";
import { hasCuratedPrograms } from "@/lib/entitlements";

/**
 * Tier 2 athlete view: only the programs the coach has switched on for them.
 * RLS (`program_availability`) enforces the same restriction server-side.
 */
export function CuratedPrograms() {
  const { entitlement, isLoading: entLoading } = useEntitlement();
  const { enrollments, fetchEnrollments } = useProgramStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Program | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("program_availability")
        .select("program:programs(*)")
        .eq("is_available", true);
      if (cancelled) return;
      const list = (data || [])
        .map((row: any) => row.program)
        .filter(Boolean)
        .filter((p: Program) => p.is_active);
      // De-duplicate (tier row + client-specific row can both match)
      const unique = Array.from(new Map(list.map((p: Program) => [p.id, p])).values()) as Program[];
      setPrograms(unique);
      setLoading(false);
    })();
    fetchEnrollments();
    return () => { cancelled = true; };
  }, [fetchEnrollments]);

  const enrolledIds = new Set(enrollments.map((e) => e.program_id));

  if (entLoading || loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
      </div>
    );
  }

  if (!hasCuratedPrograms(entitlement)) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm font-medium">Your training is programmed for you</p>
        <p className="text-xs text-muted-foreground mt-1">
          Andy builds your sessions individually — you'll find them under Train.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="section-label">PROGRAMS</p>
        <h2 className="text-base font-semibold">Choose your program</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Pick one of Andy's programs and switch whenever you like. Your logging, history and PRs carry across.
        </p>
      </div>

      {programs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-medium">No programs available yet</p>
          <p className="text-xs text-muted-foreground mt-1">Andy hasn't published a program for you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {programs.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              isEnrolled={enrolledIds.has(p.id)}
              onSelect={(program) => { setSelected(program); setWizardOpen(true); }}
            />
          ))}
        </div>
      )}

      <ProgramAssignmentWizard program={selected} open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
