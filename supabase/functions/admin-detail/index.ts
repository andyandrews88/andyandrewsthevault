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

    const body = await req.json();
    const { section } = body || {};
    if (!section) throw new Error("Missing section parameter");

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    let result: any = {};

    if (section === "users") {
      // Full user list with workout counts, checkin data, compliance, and last activity
      const { data: profiles } = await admin.from("user_profiles").select("id, display_name, created_at").order("created_at", { ascending: false });
      const { data: workouts } = await admin.from("workouts").select("user_id, date, is_completed");
      const { data: checkins } = await admin.from("user_daily_checkins").select("user_id, check_date");
      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const { data: calendarWorkouts } = await admin.from("user_calendar_workouts").select("user_id, is_completed");

      // Completed workout counts + last workout date
      const workoutCounts: Record<string, number> = {};
      const lastWorkoutDate: Record<string, string> = {};
      (workouts || []).forEach(w => {
        if (w.is_completed) {
          workoutCounts[w.user_id] = (workoutCounts[w.user_id] || 0) + 1;
          if (!lastWorkoutDate[w.user_id] || w.date > lastWorkoutDate[w.user_id]) {
            lastWorkoutDate[w.user_id] = w.date;
          }
        }
      });

      const lastActive: Record<string, string> = {};
      (authUsers?.users || []).forEach(u => { if (u.last_sign_in_at) lastActive[u.id] = u.last_sign_in_at; });

      // Last checkin date + streaks
      const userCheckins: Record<string, string[]> = {};
      const lastCheckinDate: Record<string, string> = {};
      (checkins || []).forEach(c => {
        if (!userCheckins[c.user_id]) userCheckins[c.user_id] = [];
        userCheckins[c.user_id].push(c.check_date);
        if (!lastCheckinDate[c.user_id] || c.check_date > lastCheckinDate[c.user_id]) {
          lastCheckinDate[c.user_id] = c.check_date;
        }
      });

      // Compliance from calendar workouts (scheduled program workouts)
      const scheduledCount: Record<string, number> = {};
      const completedCount: Record<string, number> = {};
      (calendarWorkouts || []).forEach(cw => {
        scheduledCount[cw.user_id] = (scheduledCount[cw.user_id] || 0) + 1;
        if (cw.is_completed) completedCount[cw.user_id] = (completedCount[cw.user_id] || 0) + 1;
      });

      const calcStreak = (dates: string[]) => {
        if (!dates.length) return 0;
        const sorted = [...new Set(dates)].sort().reverse();
        let streak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const diff = new Date(sorted[i - 1]).getTime() - new Date(sorted[i]).getTime();
          if (diff <= 86400000 * 1.5) streak++;
          else break;
        }
        return streak;
      };

      result = {
        users: (profiles || []).map(p => ({
          id: p.id,
          displayName: p.display_name,
          createdAt: p.created_at,
          lastActive: lastActive[p.id] || null,
          workoutsCount: workoutCounts[p.id] || 0,
          checkinStreak: calcStreak(userCheckins[p.id] || []),
          lastWorkoutDate: lastWorkoutDate[p.id] || null,
          lastCheckinDate: lastCheckinDate[p.id] || null,
          scheduledWorkouts: scheduledCount[p.id] || 0,
          completedWorkouts: completedCount[p.id] || 0,
        })),
      };
    } else if (section === "training") {
      const { data: workouts } = await admin.from("workouts").select("id, user_id, date, total_volume, workout_name").eq("is_completed", true).order("date", { ascending: false }).limit(500);
      const { data: prs } = await admin.from("personal_records").select("id, user_id, exercise_name, max_weight, max_reps, achieved_at").order("achieved_at", { ascending: false }).limit(100);
      const { data: profiles } = await admin.from("user_profiles").select("id, display_name");

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.display_name; });

      // Workouts by day (last 14 days)
      const dayCounts: Record<string, number> = {};
      (workouts || []).forEach(w => {
        dayCounts[w.date] = (dayCounts[w.date] || 0) + 1;
      });

      // Per-user frequency
      const userFreq: Record<string, number> = {};
      (workouts || []).forEach(w => { userFreq[w.user_id] = (userFreq[w.user_id] || 0) + 1; });

      result = {
        workoutsByDay: Object.entries(dayCounts).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14).map(([date, count]) => ({ date, count })),
        prLeaderboard: (prs || []).slice(0, 20).map(pr => ({
          userName: nameMap[pr.user_id] || "Unknown",
          oderId: pr.user_id,
          exerciseName: pr.exercise_name,
          maxWeight: pr.max_weight,
          maxReps: pr.max_reps,
          achievedAt: pr.achieved_at,
        })),
        userFrequency: Object.entries(userFreq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([userId, count]) => ({
          userId,
          userName: nameMap[userId] || "Unknown",
          workoutCount: count,
        })),
      };
    } else if (section === "nutrition") {
      const { data: profiles } = await admin.from("user_profiles").select("id, display_name");
      const { data: nutrition } = await admin.from("user_nutrition_data").select("user_id");
      const { data: meals } = await admin.from("user_meals").select("user_id");
      const { data: audits } = await admin.from("user_audit_data").select("user_id");

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.display_name; });

      const nutritionSet = new Set((nutrition || []).map(n => n.user_id));
      const mealCounts: Record<string, number> = {};
      (meals || []).forEach(m => { mealCounts[m.user_id] = (mealCounts[m.user_id] || 0) + 1; });
      const auditSet = new Set((audits || []).map(a => a.user_id));

      result = {
        users: (profiles || []).map(p => ({
          id: p.id,
          displayName: p.display_name,
          hasCalculator: nutritionSet.has(p.id),
          mealCount: mealCounts[p.id] || 0,
          hasAudit: auditSet.has(p.id),
        })).filter(u => u.hasCalculator || u.mealCount > 0 || u.hasAudit),
      };
    } else if (section === "lifestyle") {
      const { data: profiles } = await admin.from("user_profiles").select("id, display_name");
      const { data: checkins } = await admin.from("user_daily_checkins").select("user_id, check_date, energy_score, sleep_score, stress_score, drive_score");
      const { data: goals } = await admin.from("user_goals").select("id, user_id, title, status, current_value, target_value, goal_type");
      const { data: bodyEntries } = await admin.from("user_body_entries").select("user_id", { count: "exact" });

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.display_name; });

      const userCheckinCounts: Record<string, number> = {};
      (checkins || []).forEach(c => { userCheckinCounts[c.user_id] = (userCheckinCounts[c.user_id] || 0) + 1; });

      result = {
        checkinFrequency: Object.entries(userCheckinCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([userId, count]) => ({
          userId,
          userName: nameMap[userId] || "Unknown",
          checkinCount: count,
        })),
        goals: (goals || []).map(g => ({
          ...g,
          userName: nameMap[g.user_id] || "Unknown",
        })),
      };
    } else if (section === "community") {
      const { data: messages } = await admin.from("community_messages").select("id, user_id, content, created_at, likes_count").eq("is_thread_root", true).order("created_at", { ascending: false }).limit(50);
      const { data: profiles } = await admin.from("user_profiles").select("id, display_name");

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.display_name; });

      const userPostCounts: Record<string, number> = {};
      (messages || []).forEach(m => { userPostCounts[m.user_id] = (userPostCounts[m.user_id] || 0) + 1; });

      result = {
        recentPosts: (messages || []).map(m => ({
          id: m.id,
          userId: m.user_id,
          userName: nameMap[m.user_id] || "Unknown",
          content: m.content.slice(0, 120),
          createdAt: m.created_at,
          likesCount: m.likes_count,
        })),
        topPosters: Object.entries(userPostCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([userId, count]) => ({
          userId,
          userName: nameMap[userId] || "Unknown",
          postCount: count,
        })),
      };
    } else if (section === "content") {
      const { data: resources } = await admin.from("vault_resources").select("id, title, category, type, is_featured, created_at").order("created_at", { ascending: false });
      const { data: podcasts } = await admin.from("vault_podcasts").select("id, title, is_featured, created_at, episode_number").order("created_at", { ascending: false });

      result = { resources: resources || [], podcasts: podcasts || [] };
    } else if (section === "announcements") {
      const { data: announcements } = await admin.from("announcements").select("*").order("created_at", { ascending: false });
      result = { announcements: announcements || [] };
    } else {
      throw new Error("Invalid section");
    }

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
