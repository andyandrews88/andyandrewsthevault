import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin using their JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    // Use service role for admin check and data aggregation
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Not admin");

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

    // Parallel fetches
    const [
      profilesRes,
      recentProfilesRes,
      weekProfilesRes,
      workoutsRes,
      weekWorkoutsRes,
      exercisesRes,
      prsRes,
      checkinsRes,
      weekCheckinsRes,
      nutritionRes,
      mealsRes,
      auditsRes,
      goalsRes,
      goalsAchievedRes,
      bodyEntriesRes,
      messagesRes,
      weekMessagesRes,
      likesRes,
      resourcesRes,
      podcastsRes,
    ] = await Promise.all([
      admin.from("user_profiles").select("id, created_at, display_name", { count: "exact" }),
      admin.from("user_profiles").select("id", { count: "exact" }).gte("created_at", monthAgo),
      admin.from("user_profiles").select("id", { count: "exact" }).gte("created_at", weekAgo),
      admin.from("workouts").select("id, user_id, date, is_completed, total_volume", { count: "exact" }).eq("is_completed", true),
      admin.from("workouts").select("id, user_id", { count: "exact" }).eq("is_completed", true).gte("date", weekAgo),
      admin.from("workout_exercises").select("exercise_name"),
      admin.from("personal_records").select("id", { count: "exact" }),
      admin.from("user_daily_checkins").select("id, user_id, check_date", { count: "exact" }),
      admin.from("user_daily_checkins").select("id", { count: "exact" }).gte("check_date", weekAgo),
      admin.from("user_nutrition_data").select("id", { count: "exact" }),
      admin.from("user_meals").select("id", { count: "exact" }),
      admin.from("user_audit_data").select("id", { count: "exact" }),
      admin.from("user_goals").select("id, status", { count: "exact" }),
      admin.from("user_goals").select("id", { count: "exact" }).eq("status", "achieved"),
      admin.from("user_body_entries").select("id", { count: "exact" }),
      admin.from("community_messages").select("id, user_id, created_at, likes_count", { count: "exact" }).eq("is_thread_root", true),
      admin.from("community_messages").select("id", { count: "exact" }).eq("is_thread_root", true).gte("created_at", weekAgo + "T00:00:00Z"),
      admin.from("community_likes").select("id", { count: "exact" }),
      admin.from("vault_resources").select("id", { count: "exact" }),
      admin.from("vault_podcasts").select("id", { count: "exact" }),
    ]);

    // Calculate exercise popularity
    const exerciseCount: Record<string, number> = {};
    (exercisesRes.data || []).forEach((e) => {
      exerciseCount[e.exercise_name] = (exerciseCount[e.exercise_name] || 0) + 1;
    });
    const topExercises = Object.entries(exerciseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Unique active users (workout in last 7 days)
    const activeWorkoutUsers = new Set((weekWorkoutsRes.data || []).map((w) => w.user_id));

    // Unique checkin users
    const checkinUsers = new Set((checkinsRes.data || []).map((c) => c.user_id));

    // Average workouts per user
    const workoutUserCounts: Record<string, number> = {};
    (workoutsRes.data || []).forEach((w) => {
      workoutUserCounts[w.user_id] = (workoutUserCounts[w.user_id] || 0) + 1;
    });
    const workoutUserIds = Object.keys(workoutUserCounts);
    const avgWorkoutsPerUser = workoutUserIds.length > 0
      ? Math.round((workoutsRes.count || 0) / workoutUserIds.length * 10) / 10
      : 0;

    // Total volume
    const totalVolume = (workoutsRes.data || []).reduce((s, w) => s + (Number(w.total_volume) || 0), 0);

    // Community engagement
    const totalLikesOnPosts = (messagesRes.data || []).reduce((s, m) => s + (m.likes_count || 0), 0);
    const avgLikesPerPost = (messagesRes.count || 0) > 0
      ? Math.round(totalLikesOnPosts / (messagesRes.count || 1) * 10) / 10
      : 0;

    // Recent signups list
    const recentUsers = (profilesRes.data || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((u) => ({ id: u.id, displayName: u.display_name, createdAt: u.created_at }));

    const analytics = {
      users: {
        total: profilesRes.count || 0,
        newThisMonth: recentProfilesRes.count || 0,
        newThisWeek: weekProfilesRes.count || 0,
        recentSignups: recentUsers,
      },
      training: {
        totalWorkouts: workoutsRes.count || 0,
        workoutsThisWeek: weekWorkoutsRes.count || 0,
        activeUsersThisWeek: activeWorkoutUsers.size,
        avgWorkoutsPerUser,
        totalVolume: Math.round(totalVolume),
        totalPRs: prsRes.count || 0,
        topExercises,
      },
      nutrition: {
        usersWithCalculator: nutritionRes.count || 0,
        totalSavedMeals: mealsRes.count || 0,
        auditsCompleted: auditsRes.count || 0,
      },
      lifestyle: {
        totalCheckins: checkinsRes.count || 0,
        checkinsThisWeek: weekCheckinsRes.count || 0,
        usersWhoCheckin: checkinUsers.size,
        totalBodyEntries: bodyEntriesRes.count || 0,
      },
      goals: {
        totalGoals: goalsRes.count || 0,
        achievedGoals: goalsAchievedRes.count || 0,
      },
      community: {
        totalPosts: messagesRes.count || 0,
        postsThisWeek: weekMessagesRes.count || 0,
        totalLikes: likesRes.count || 0,
        avgLikesPerPost,
      },
      content: {
        totalResources: resourcesRes.count || 0,
        totalPodcasts: podcastsRes.count || 0,
      },
    };

    return new Response(JSON.stringify(analytics), {
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
