import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { EMPTY_ENTITLEMENT, Entitlement, ServiceTier, RelationshipStatus } from "@/lib/entitlements";

/**
 * Resolves the signed-in user's coaching entitlement from
 * `coach_client_relationships` in a single query.
 * Andy is both coach and athlete — his self-relationship is ignored for `isCoach`.
 */
export function useEntitlement() {
  const { user, isInitialized } = useAuthStore();
  const [entitlement, setEntitlement] = useState<Entitlement>(EMPTY_ENTITLEMENT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isInitialized) return;
      if (!user) {
        if (!cancelled) {
          setEntitlement(EMPTY_ENTITLEMENT);
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("coach_client_relationships")
        .select("coach_id, client_id, service_tier, status")
        .or(`client_id.eq.${user.id},coach_id.eq.${user.id}`);

      if (cancelled) return;

      if (error || !data) {
        setEntitlement(EMPTY_ENTITLEMENT);
        setIsLoading(false);
        return;
      }

      const asClient = data
        .filter((r) => r.client_id === user.id && r.coach_id !== user.id)
        .sort((a) => (a.status === "active" ? -1 : 1))[0];

      const coachesOthers = data.some((r) => r.coach_id === user.id && r.client_id !== user.id);

      setEntitlement({
        tier: (asClient?.service_tier as ServiceTier) ?? null,
        status: (asClient?.status as RelationshipStatus) ?? null,
        coachId: asClient?.coach_id ?? null,
        isCoach: coachesOthers,
      });
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isInitialized]);

  return { entitlement, isLoading };
}
