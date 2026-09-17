import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { ServiceTier } from "@/lib/entitlements";

export interface RosterClient {
  relationshipId: string;
  clientId: string;
  tier: ServiceTier;
  status: "active" | "archived" | "pending";
  displayName: string;
  avatarUrl: string | null;
  startedAt: string;
  /** Real data only — null when nothing has been logged */
  lastWorkoutDate: string | null;
  completedLast7: number;
  activeProgramName: string | null;
}

export interface CoachInvite {
  id: string;
  name: string;
  email: string;
  service_tier: ServiceTier;
  status: "pending" | "accepted" | "revoked" | "expired";
  sent_at: string;
  resent_at: string | null;
  expires_at: string;
}

interface CoachState {
  clients: RosterClient[];
  invites: CoachInvite[];
  isLoading: boolean;
  error: string | null;
  loadedFor: string | null;

  load: (coachId: string, force?: boolean) => Promise<void>;
  setRelationshipStatus: (relationshipId: string, status: "active" | "archived") => Promise<void>;
  createInvite: (name: string, email: string, tier: ServiceTier) => Promise<{ linkedExisting: boolean }>;
  resendInvite: (inviteId: string) => Promise<void>;
  revokeInvite: (inviteId: string) => Promise<void>;
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const useCoachStore = create<CoachState>((set, get) => ({
  clients: [],
  invites: [],
  isLoading: false,
  error: null,
  loadedFor: null,

  /** One data load per roster screen. */
  load: async (coachId, force = false) => {
    if (!force && get().loadedFor === coachId && get().clients.length > 0) return;
    set({ isLoading: true, error: null });
    try {
      const { data: rels, error: relErr } = await supabase
        .from("coach_client_relationships")
        .select("id, client_id, service_tier, status, started_at")
        .eq("coach_id", coachId);
      if (relErr) throw relErr;

      const clientIds = (rels || []).map((r) => r.client_id);

      const [profilesRes, workoutsRes, enrollRes, invitesRes] = await Promise.all([
        clientIds.length
          ? supabase.from("user_profiles").select("id, display_name, avatar_url").in("id", clientIds)
          : Promise.resolve({ data: [], error: null } as any),
        clientIds.length
          ? supabase
              .from("workouts")
              .select("user_id, date, is_completed")
              .in("user_id", clientIds)
              .gte("date", daysAgoIso(30))
              .order("date", { ascending: false })
          : Promise.resolve({ data: [], error: null } as any),
        clientIds.length
          ? supabase
              .from("user_program_enrollments")
              .select("user_id, status, program:programs(name)")
              .in("user_id", clientIds)
              .eq("status", "active")
          : Promise.resolve({ data: [], error: null } as any),
        supabase
          .from("client_invites")
          .select("id, name, email, service_tier, status, sent_at, resent_at, expires_at")
          .eq("coach_id", coachId)
          .order("sent_at", { ascending: false }),
      ]);

      const profiles = new Map<string, { display_name: string; avatar_url: string | null }>(
        (profilesRes.data || []).map((p: any) => [p.id as string, p]),
      );
      const sevenDaysAgo = daysAgoIso(7);

      const clients: RosterClient[] = (rels || []).map((r) => {
        const workouts = (workoutsRes.data || []).filter((w: any) => w.user_id === r.client_id);
        const completed = workouts.filter((w: any) => w.is_completed);
        const enrollment = (enrollRes.data || []).find((e: any) => e.user_id === r.client_id);
        return {
          relationshipId: r.id,
          clientId: r.client_id,
          tier: r.service_tier as ServiceTier,
          status: r.status as RosterClient["status"],
          displayName: profiles.get(r.client_id)?.display_name || "Client",
          avatarUrl: profiles.get(r.client_id)?.avatar_url || null,
          startedAt: r.started_at,
          lastWorkoutDate: completed[0]?.date ?? null,
          completedLast7: completed.filter((w: any) => w.date >= sevenDaysAgo).length,
          activeProgramName: (enrollment as any)?.program?.name ?? null,
        };
      });

      clients.sort((a, b) => a.displayName.localeCompare(b.displayName));

      set({
        clients,
        invites: (invitesRes.data || []) as CoachInvite[],
        isLoading: false,
        loadedFor: coachId,
      });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : "Failed to load roster" });
    }
  },

  setRelationshipStatus: async (relationshipId, status) => {
    const patch: Record<string, unknown> = { status };
    if (status === "archived") patch.archived_at = new Date().toISOString();
    if (status === "active") patch.restored_at = new Date().toISOString();

    const { error } = await supabase
      .from("coach_client_relationships")
      .update(patch)
      .eq("id", relationshipId);
    if (error) throw error;

    set((s) => ({
      clients: s.clients.map((c) => (c.relationshipId === relationshipId ? { ...c, status } : c)),
    }));
  },

  createInvite: async (name, email, tier) => {
    const { data, error } = await supabase.functions.invoke("coach-invite", {
      body: { action: "create", name, email, tier, origin: window.location.origin },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return { linkedExisting: !!data?.linkedExisting };
  },

  resendInvite: async (inviteId) => {
    const { data, error } = await supabase.functions.invoke("coach-invite", {
      body: { action: "resend", inviteId, origin: window.location.origin },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    set((s) => ({
      invites: s.invites.map((i) =>
        i.id === inviteId ? { ...i, resent_at: new Date().toISOString() } : i,
      ),
    }));
  },

  revokeInvite: async (inviteId) => {
    const { data, error } = await supabase.functions.invoke("coach-invite", {
      body: { action: "revoke", inviteId },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    set((s) => ({
      invites: s.invites.map((i) => (i.id === inviteId ? { ...i, status: "revoked" } : i)),
    }));
  },
}));
