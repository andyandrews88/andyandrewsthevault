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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Not admin");

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

    // Fetch current week vs previous week data
    const [
      newUsersThisWeek, newUsersPrevWeek,
      workoutsThisWeek, workoutsPrevWeek,
      checkinsThisWeek, checkinsPrevWeek,
      postsThisWeek, postsPrevWeek,
      likesThisWeek,
      prsThisWeek,
      allProfiles,
      inactiveUsers,
      topExercises,
    ] = await Promise.all([
      admin.from("user_profiles").select("id", { count: "exact" }).gte("created_at", weekAgo),
      admin.from("user_profiles").select("id", { count: "exact" }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
      admin.from("workouts").select("id, user_id", { count: "exact" }).eq("is_completed", true).gte("date", weekAgo.slice(0, 10)),
      admin.from("workouts").select("id", { count: "exact" }).eq("is_completed", true).gte("date", twoWeeksAgo.slice(0, 10)).lt("date", weekAgo.slice(0, 10)),
      admin.from("user_daily_checkins").select("id", { count: "exact" }).gte("check_date", weekAgo.slice(0, 10)),
      admin.from("user_daily_checkins").select("id", { count: "exact" }).gte("check_date", twoWeeksAgo.slice(0, 10)).lt("check_date", weekAgo.slice(0, 10)),
      admin.from("community_messages").select("id", { count: "exact" }).eq("is_thread_root", true).gte("created_at", weekAgo),
      admin.from("community_messages").select("id", { count: "exact" }).eq("is_thread_root", true).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
      admin.from("community_likes").select("id", { count: "exact" }).gte("created_at", weekAgo),
      admin.from("personal_records").select("id, exercise_name", { count: "exact" }).gte("achieved_at", weekAgo),
      admin.from("user_profiles").select("id, display_name", { count: "exact" }),
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("workout_exercises").select("exercise_name").gte("created_at", weekAgo),
    ]);

    // Find users inactive 14+ days
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);
    const inactiveList = (inactiveUsers?.data?.users || [])
      .filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) < fourteenDaysAgo)
      .length;

    // Active workout users this week
    const activeUsers = new Set((workoutsThisWeek.data || []).map(w => w.user_id));

    // Top exercises this week
    const exCounts: Record<string, number> = {};
    (topExercises.data || []).forEach(e => { exCounts[e.exercise_name] = (exCounts[e.exercise_name] || 0) + 1; });
    const topEx = Object.entries(exCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // PR exercises this week
    const prExercises: Record<string, number> = {};
    (prsThisWeek.data || []).forEach(p => { prExercises[p.exercise_name] = (prExercises[p.exercise_name] || 0) + 1; });

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const change = Math.round(((curr - prev) / prev) * 100);
      return `${change >= 0 ? "+" : ""}${change}%`;
    };

    const dataPrompt = `
Platform Weekly Summary (last 7 days):

USERS:
- Total users: ${allProfiles.count || 0}
- New signups this week: ${newUsersThisWeek.count || 0} (${pctChange(newUsersThisWeek.count || 0, newUsersPrevWeek.count || 0)} vs prev week)
- Users inactive 14+ days: ${inactiveList}
- Active training users this week: ${activeUsers.size}

TRAINING:
- Workouts this week: ${workoutsThisWeek.count || 0} (${pctChange(workoutsThisWeek.count || 0, workoutsPrevWeek.count || 0)} vs prev week)
- New PRs this week: ${prsThisWeek.count || 0}
${topEx.length > 0 ? `- Top exercises: ${topEx.map(([name, count]) => `${name} (${count})`).join(", ")}` : ""}
${Object.keys(prExercises).length > 0 ? `- PR exercises: ${Object.entries(prExercises).map(([name, count]) => `${name} (${count})`).join(", ")}` : ""}

LIFESTYLE:
- Check-ins this week: ${checkinsThisWeek.count || 0} (${pctChange(checkinsThisWeek.count || 0, checkinsPrevWeek.count || 0)} vs prev week)

COMMUNITY:
- Posts this week: ${postsThisWeek.count || 0} (${pctChange(postsThisWeek.count || 0, postsPrevWeek.count || 0)} vs prev week)
- Likes this week: ${likesThisWeek.count || 0}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are the AI admin assistant for a fitness coaching platform called The Vault. You're writing a weekly briefing for the solo founder/coach who runs the platform. Be concise, data-driven, and actionable. Highlight what needs attention. Use bullet points. Keep it under 250 words. Don't use markdown headers — just plain text with bullet points. Start with a one-line summary of the week.",
          },
          { role: "user", content: dataPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ report }), {
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
