// Coach invite lifecycle: create / resend / revoke / sync
// Caller must be an authenticated coach (admin role OR has existing coach relationships).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function findUserByEmail(admin: any, email: string) {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = (data?.users || []).find(
      (u: any) => (u.email || "").toLowerCase() === target,
    );
    if (hit) return hit;
    if (!data?.users || data.users.length < 200) return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    // Coach check: admin role or existing coach relationships (multi-coach ready)
    const [{ data: roleRow }, { count: relCount }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      admin.from("coach_client_relationships").select("id", { count: "exact", head: true }).eq("coach_id", user.id),
    ]);
    const isCoach = !!roleRow || (relCount ?? 0) > 0;
    if (!isCoach) return json({ error: "Not a coach" }, 403);

    const body = await req.json();
    const action = body?.action as string;
    const origin = (body?.origin as string) || req.headers.get("origin") || "";
    const redirectTo = origin ? `${origin}/auth` : undefined;

    if (action === "create") {
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const tier = body.tier === "tier_2" ? "tier_2" : "tier_1";
      if (!name || !email) return json({ error: "Name and email are required" }, 400);

      const existing = await findUserByEmail(admin, email);

      if (existing) {
        // Existing account — link, never duplicate identity
        const { error: relErr } = await admin
          .from("coach_client_relationships")
          .upsert(
            {
              coach_id: user.id,
              client_id: existing.id,
              service_tier: tier,
              status: "active",
              restored_at: new Date().toISOString(),
            },
            { onConflict: "coach_id,client_id" },
          );
        if (relErr) throw relErr;

        const { error: invErr } = await admin.from("client_invites").insert({
          coach_id: user.id,
          name,
          email,
          service_tier: tier,
          token: crypto.randomUUID(),
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_user_id: existing.id,
          expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        });
        if (invErr) throw invErr;

        return json({ ok: true, linkedExisting: true, clientId: existing.id });
      }

      // New account: Supabase sends the invite email; client sets a password on acceptance
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { full_name: name, invited_by_coach: user.id, service_tier: tier },
      });
      if (inviteErr) throw inviteErr;
      const newUserId = invited?.user?.id;
      if (!newUserId) throw new Error("Invite failed");

      const { error: relErr } = await admin.from("coach_client_relationships").upsert(
        {
          coach_id: user.id,
          client_id: newUserId,
          service_tier: tier,
          status: "active",
        },
        { onConflict: "coach_id,client_id" },
      );
      if (relErr) throw relErr;

      const { data: invRow, error: invErr } = await admin
        .from("client_invites")
        .insert({
          coach_id: user.id,
          name,
          email,
          service_tier: tier,
          token: crypto.randomUUID(),
          status: "pending",
          accepted_user_id: newUserId,
          expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        })
        .select()
        .single();
      if (invErr) throw invErr;

      return json({ ok: true, invite: invRow, clientId: newUserId });
    }

    if (action === "resend") {
      const inviteId = String(body.inviteId || "");
      const { data: inv } = await admin
        .from("client_invites")
        .select("*")
        .eq("id", inviteId)
        .eq("coach_id", user.id)
        .maybeSingle();
      if (!inv) return json({ error: "Invite not found" }, 404);
      if (inv.status !== "pending") return json({ error: "Only pending invites can be resent" }, 400);

      const { error: sendErr } = await admin.auth.admin.inviteUserByEmail(inv.email, { redirectTo });
      if (sendErr) {
        // User already exists in auth (invite previously created them) — send a recovery link instead
        const { error: recErr } = await admin.auth.admin.generateLink({
          type: "recovery",
          email: inv.email,
          options: { redirectTo: origin ? `${origin}/reset-password` : undefined },
        });
        if (recErr) throw sendErr;
      }

      await admin
        .from("client_invites")
        .update({ resent_at: new Date().toISOString(), expires_at: new Date(Date.now() + 14 * 86400000).toISOString() })
        .eq("id", inviteId);

      return json({ ok: true });
    }

    if (action === "revoke") {
      const inviteId = String(body.inviteId || "");
      const { data: inv } = await admin
        .from("client_invites")
        .select("*")
        .eq("id", inviteId)
        .eq("coach_id", user.id)
        .maybeSingle();
      if (!inv) return json({ error: "Invite not found" }, 404);

      await admin
        .from("client_invites")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", inviteId);

      // Archive (never delete) the provisional relationship if the invite was never accepted
      if (inv.accepted_user_id && inv.status === "pending") {
        await admin
          .from("coach_client_relationships")
          .update({ status: "archived", archived_at: new Date().toISOString() })
          .eq("coach_id", user.id)
          .eq("client_id", inv.accepted_user_id);
      }

      return json({ ok: true });
    }

    if (action === "sync") {
      // Flip pending invites to accepted once the invited user has signed in
      const { data: pending } = await admin
        .from("client_invites")
        .select("id, accepted_user_id, expires_at")
        .eq("coach_id", user.id)
        .eq("status", "pending");

      let accepted = 0;
      let expired = 0;
      for (const inv of pending || []) {
        if (inv.accepted_user_id) {
          const { data: au } = await admin.auth.admin.getUserById(inv.accepted_user_id);
          if (au?.user?.last_sign_in_at) {
            await admin
              .from("client_invites")
              .update({ status: "accepted", accepted_at: au.user.last_sign_in_at })
              .eq("id", inv.id);
            accepted++;
            continue;
          }
        }
        if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
          await admin.from("client_invites").update({ status: "expired" }).eq("id", inv.id);
          expired++;
        }
      }
      return json({ ok: true, accepted, expired });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("coach-invite error:", msg);
    return json({ error: msg }, 400);
  }
});
