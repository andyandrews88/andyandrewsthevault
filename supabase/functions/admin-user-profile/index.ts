import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { userId } = await req.json();
    if (!userId) throw new Error("userId required");

    // Fetch all data for this user in parallel
    const [
      profileRes,
      authUserRes,
      workoutsRes,
      prsRes,
      checkinsRes,
      goalsRes,
      nutritionRes,
      mealsRes,
      auditsRes,
      messagesRes,
      bodyEntriesRes,
    ] = await Promise.all([
      admin.from("user_profiles").select("*").eq("id", userId).single(),
      admin.auth.admin.getUserById(userId),
      admin.from("workouts").select("id, workout_name, date, is_completed, total_volume, notes, created_at").eq("user_id", userId).order("date", { ascending: false }).limit(100),
      admin.from("personal_records").select("id, exercise_name, max_weight, max_reps, achieved_at").eq("user_id", userId).order("achieved_at", { ascending: false }),
      admin.from("user_daily_checkins").select("*").eq("user_id", userId).order("check_date", { ascending: false }).limit(90),
      admin.from("user_goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      admin.from("user_nutrition_data").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("user_meals").select("id, name, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      admin.from("user_audit_data").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("community_messages").select("id, content, created_at, likes_count, is_thread_root").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      admin.from("user_body_entries").select("id, entry_date, weight_kg, body_fat_percent, uses_imperial").eq("user_id", userId).order("entry_date", { ascending: false }).limit(50),
    ]);

    const authUser = authUserRes?.data?.user;

    // Calculate checkin streak
    const checkinDates = (checkinsRes.data || []).map(c => c.check_date);
    const uniqueDates = [...new Set(checkinDates)].sort().reverse();
    let streak = 0;
    if (uniqueDates.length > 0) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const diff = new Date(uniqueDates[i - 1]).getTime() - new Date(uniqueDates[i]).getTime();
        if (diff <= 86400000 * 1.5) streak++;
        else break;
      }
    }

    // Avg readiness scores
    const checkins = checkinsRes.data || [];
    const avgScores = checkins.length > 0 ? {
      energy: Math.round(checkins.reduce((s, c) => s + c.energy_score, 0) / checkins.length),
      sleep: Math.round(checkins.reduce((s, c) => s + c.sleep_score, 0) / checkins.length),
      stress: Math.round(checkins.reduce((s, c) => s + c.stress_score, 0) / checkins.length),
      drive: Math.round(checkins.reduce((s, c) => s + c.drive_score, 0) / checkins.length),
    } : null;

    const totalVolume = (workoutsRes.data || []).reduce((s, w) => s + (Number(w.total_volume) || 0), 0);

    const result = {
      profile: profileRes.data,
      email: authUser?.email || null,
      joinDate: authUser?.created_at || profileRes.data?.created_at,
      lastSignIn: authUser?.last_sign_in_at || null,
      training: {
        workouts: workoutsRes.data || [],
        totalVolume: Math.round(totalVolume),
        completedCount: (workoutsRes.data || []).filter(w => w.is_completed).length,
        prs: prsRes.data || [],
      },
      checkins: {
        entries: checkins.slice(0, 30),
        streak,
        avgScores,
        totalCount: checkins.length,
      },
      goals: goalsRes.data || [],
      nutrition: {
        calculatorData: nutritionRes.data,
        meals: mealsRes.data || [],
        auditData: auditsRes.data,
      },
      community: {
        messages: messagesRes.data || [],
        totalPosts: (messagesRes.data || []).filter(m => m.is_thread_root).length,
        totalLikes: (messagesRes.data || []).reduce((s, m) => s + (m.likes_count || 0), 0),
      },
      bodyEntries: bodyEntriesRes.data || [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: msg.includes("admin") || msg.includes("Unauthorized") ? 403 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
