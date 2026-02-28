import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Not admin");

    const { action, targetUserId } = await req.json();
    if (!action || !targetUserId) throw new Error("Missing action or targetUserId");

    // Prevent self-actions
    if (targetUserId === user.id) throw new Error("Cannot perform actions on yourself");

    let result: any = {};

    if (action === "get_status") {
      const { data: authData } = await admin.auth.admin.getUserById(targetUserId);
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", targetUserId);
      const { data: profile } = await admin.from("user_profiles").select("display_name").eq("id", targetUserId).maybeSingle();
      
      const isBanned = authData?.user?.banned_until ? new Date(authData.user.banned_until) > new Date() : false;
      const isArchived = profile?.display_name?.startsWith("[Archived]") || false;

      result = {
        isBanned,
        isArchived,
        roles: (roles || []).map(r => r.role),
        lastSignIn: authData?.user?.last_sign_in_at || null,
        email: authData?.user?.email || null,
      };
    } else if (action === "suspend") {
      const { error } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: "876000h" });
      if (error) throw error;
      result = { success: true, message: "User suspended" };
    } else if (action === "unsuspend") {
      const { error } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: "none" });
      if (error) throw error;
      result = { success: true, message: "User unsuspended" };
    } else if (action === "archive") {
      // Prefix display name with [Archived] and suspend
      const { data: profile } = await admin.from("user_profiles").select("display_name").eq("id", targetUserId).maybeSingle();
      const currentName = profile?.display_name || "Unknown";
      if (!currentName.startsWith("[Archived]")) {
        await admin.from("user_profiles").update({ display_name: `[Archived] ${currentName}` }).eq("id", targetUserId);
      }
      await admin.auth.admin.updateUserById(targetUserId, { ban_duration: "876000h" });
      result = { success: true, message: "User archived" };
    } else if (action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(targetUserId);
      if (error) throw error;
      result = { success: true, message: "User permanently deleted" };
    } else if (action === "remove_role") {
      await admin.from("user_roles").delete().eq("user_id", targetUserId);
      result = { success: true, message: "All roles removed" };
    } else {
      throw new Error("Invalid action");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: msg.includes("admin") || msg.includes("Unauthorized") ? 403 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
