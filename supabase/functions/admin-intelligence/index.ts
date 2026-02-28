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
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Not admin");

    // Collect ALL data in parallel
    const [
      profilesRes, workoutsRes, prsRes, checkinsRes, goalsRes,
      nutritionRes, mealsRes, diaryRes, bodyRes, communityRes,
      programsRes, enrollmentsRes, calendarRes, assignmentsRes, authUsersRes
    ] = await Promise.all([
      admin.from("user_profiles").select("id, display_name, created_at"),
      admin.from("workouts").select("id, user_id, date, total_volume, workout_name, is_completed"),
      admin.from("personal_records").select("user_id, exercise_name, max_weight, max_reps, achieved_at"),
      admin.from("user_daily_checkins").select("user_id, check_date, energy_score, sleep_score, stress_score, drive_score"),
      admin.from("user_goals").select("user_id, title, status, current_value, target_value, goal_type"),
      admin.from("user_nutrition_data").select("user_id"),
      admin.from("user_meals").select("user_id"),
      admin.from("user_food_diary").select("user_id, entry_date"),
      admin.from("user_body_entries").select("user_id, entry_date, weight_kg, body_fat_percent").order("entry_date", { ascending: false }),
      admin.from("community_messages").select("user_id, created_at, likes_count, is_thread_root"),
      admin.from("programs").select("id, name"),
      admin.from("user_program_enrollments").select("user_id, program_id, status"),
      admin.from("user_calendar_workouts").select("user_id, is_completed"),
      admin.from("coach_client_assignments").select("client_user_id, status"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const profiles = profilesRes.data || [];
    const workouts = workoutsRes.data || [];
    const prs = prsRes.data || [];
    const checkins = checkinsRes.data || [];
    const goals = goalsRes.data || [];
    const nutritionUsers = new Set((nutritionRes.data || []).map(n => n.user_id));
    const mealCounts: Record<string, number> = {};
    (mealsRes.data || []).forEach(m => { mealCounts[m.user_id] = (mealCounts[m.user_id] || 0) + 1; });
    const diaryCounts: Record<string, number> = {};
    (diaryRes.data || []).forEach(d => { diaryCounts[d.user_id] = (diaryCounts[d.user_id] || 0) + 1; });
    const bodyEntries = bodyRes.data || [];
    const messages = communityRes.data || [];
    const programs = programsRes.data || [];
    const enrollments = enrollmentsRes.data || [];
    const calendarWorkouts = calendarRes.data || [];
    const assignments = assignmentsRes.data || [];
    const authUsers = authUsersRes.data?.users || [];

    // Build per-user summaries
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    const lastSignIn: Record<string, string> = {};
    authUsers.forEach(u => { if (u.last_sign_in_at) lastSignIn[u.id] = u.last_sign_in_at; });

    const programMap: Record<string, string> = {};
    programs.forEach(p => { programMap[p.id] = p.name; });

    const userSummaries = profiles.map(p => {
      const uid = p.id;
      const userWorkouts = workouts.filter(w => w.user_id === uid);
      const completedWorkouts = userWorkouts.filter(w => w.is_completed);
      const recentWorkouts = completedWorkouts.filter(w => new Date(w.date) >= thirtyDaysAgo);
      const userPRs = prs.filter(pr => pr.user_id === uid);
      const userCheckins = checkins.filter(c => c.user_id === uid);
      const recentCheckins = userCheckins.filter(c => new Date(c.check_date) >= thirtyDaysAgo);
      const userGoals = goals.filter(g => g.user_id === uid);
      const userBody = bodyEntries.filter(b => b.user_id === uid);
      const userPosts = messages.filter(m => m.user_id === uid);
      const userEnrollments = enrollments.filter(e => e.user_id === uid);
      const userCalendar = calendarWorkouts.filter(cw => cw.user_id === uid);

      const avgEnergy = recentCheckins.length > 0 ? Math.round(recentCheckins.reduce((s, c) => s + c.energy_score, 0) / recentCheckins.length * 10) / 10 : null;
      const avgSleep = recentCheckins.length > 0 ? Math.round(recentCheckins.reduce((s, c) => s + c.sleep_score, 0) / recentCheckins.length * 10) / 10 : null;
      const avgStress = recentCheckins.length > 0 ? Math.round(recentCheckins.reduce((s, c) => s + c.stress_score, 0) / recentCheckins.length * 10) / 10 : null;

      const compliance = userCalendar.length > 0 ? Math.round(userCalendar.filter(cw => cw.is_completed).length / userCalendar.length * 100) : null;

      return {
        name: p.display_name,
        joinDate: p.created_at,
        lastActive: lastSignIn[uid] || null,
        totalWorkouts: completedWorkouts.length,
        workoutsLast30d: recentWorkouts.length,
        totalPRs: userPRs.length,
        topPR: userPRs.length > 0 ? `${userPRs[0].exercise_name} ${userPRs[0].max_weight}kg` : null,
        totalCheckins: userCheckins.length,
        checkinsLast30d: recentCheckins.length,
        avgEnergy, avgSleep, avgStress,
        latestWeight: userBody.length > 0 ? userBody[0].weight_kg : null,
        latestBF: userBody.length > 0 ? userBody[0].body_fat_percent : null,
        hasNutrition: nutritionUsers.has(uid),
        savedMeals: mealCounts[uid] || 0,
        diaryEntries: diaryCounts[uid] || 0,
        goalsActive: userGoals.filter(g => g.status === "active").length,
        goalsAchieved: userGoals.filter(g => g.status === "achieved").length,
        programsEnrolled: userEnrollments.map(e => programMap[e.program_id] || "Unknown"),
        compliance,
        communityPosts: userPosts.filter(m => m.is_thread_root).length,
        totalLikesReceived: userPosts.reduce((s, m) => s + (m.likes_count || 0), 0),
      };
    });

    // Build data prompt
    const platformSummary = {
      totalUsers: profiles.length,
      totalCompletedWorkouts: workouts.filter(w => w.is_completed).length,
      totalPRs: prs.length,
      totalCheckins: checkins.length,
      totalGoals: goals.length,
      goalsAchieved: goals.filter(g => g.status === "achieved").length,
      totalPosts: messages.filter(m => m.is_thread_root).length,
      totalPrograms: programs.length,
      activeEnrollments: enrollments.filter(e => e.status === "active").length,
    };

    const dataPrompt = `
PLATFORM DATA (as of ${now.toISOString()}):

PLATFORM SUMMARY:
${JSON.stringify(platformSummary, null, 2)}

PER-USER DATA (${userSummaries.length} users):
${JSON.stringify(userSummaries, null, 2)}
`;

    const systemPrompt = `You are the Chief Intelligence Officer for a premium fitness coaching platform called "The Vault". You produce executive-grade analytics briefings for the head coach.

Your report MUST follow this EXACT structure with markdown formatting:

# 🧠 Intelligence Briefing

## 1. Executive Summary
A 3-4 sentence high-level overview of platform health, key wins, and critical concerns.

## 2. User Acquisition & Retention
- Total users, growth trends, sign-up velocity
- Retention signals (last active dates, frequency patterns)
- Churn risk identification

## 3. Training Performance Analysis
- Workout volume trends, frequency patterns
- PR achievements and progression rates
- Training consistency analysis
- Notable performances or declines

## 4. Readiness & Lifestyle Intelligence
- Check-in participation rates
- Energy, sleep, stress, and drive score patterns
- Correlations between readiness and training performance
- Burnout/overtraining risk flags

## 5. Nutrition & Body Composition
- Calculator adoption, meal logging engagement
- Food diary usage patterns
- Weight and body fat trends
- Nutrition compliance gaps

## 6. Goal Tracking & Accountability
- Active goals overview
- Achievement rates
- Stalled or at-risk goals
- Goal-setting engagement

## 7. Program Compliance & Coaching Effectiveness
- Program enrollment rates
- Workout compliance percentages
- Drop-off patterns
- Template effectiveness signals

## 8. Community Health
- Posting frequency and engagement
- Top contributors
- Community sentiment indicators
- Content gaps or opportunities

## 9. Strategic Recommendations
Provide exactly 5 priority actions, numbered 1-5, each with:
- **Action**: What to do
- **Rationale**: Why it matters
- **Expected Impact**: What improvement to expect

## 10. Client Priority Matrix

Categorise EVERY client into one of three tiers:

🟢 **On Track** — Consistently training, checking in, progressing toward goals
🟡 **Watch** — Some engagement gaps, declining metrics, or missed sessions
🔴 **Intervention Needed** — Inactive, declining readiness, stalled goals, or at risk of churning

List each client with their tier and a one-line explanation.

Be specific with names, numbers, and dates. No generic advice. Every insight must be backed by the data provided.`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: dataPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const report = aiData.choices?.[0]?.message?.content || "No report generated.";

    return new Response(JSON.stringify({ report, generatedAt: now.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Intelligence error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: msg.includes("admin") || msg.includes("Unauthorized") ? 403 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
