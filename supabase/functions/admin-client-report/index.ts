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

    const { userId } = await req.json();
    if (!userId) throw new Error("userId required");

    // Fetch all client data in parallel
    const [
      profileRes, authUserRes, workoutsRes, prsRes, checkinsRes,
      goalsRes, nutritionRes, mealsRes, diaryRes, bodyRes,
      messagesRes, enrollmentsRes, calendarRes,
    ] = await Promise.all([
      admin.from("user_profiles").select("*").eq("id", userId).single(),
      admin.auth.admin.getUserById(userId),
      admin.from("workouts").select("id, workout_name, date, is_completed, total_volume, notes").eq("user_id", userId).order("date", { ascending: false }).limit(100),
      admin.from("personal_records").select("exercise_name, max_weight, max_reps, achieved_at").eq("user_id", userId).order("achieved_at", { ascending: false }),
      admin.from("user_daily_checkins").select("*").eq("user_id", userId).order("check_date", { ascending: false }).limit(90),
      admin.from("user_goals").select("*").eq("user_id", userId),
      admin.from("user_nutrition_data").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("user_meals").select("id, name").eq("user_id", userId),
      admin.from("user_food_diary").select("id, entry_date, meal_slot, calculated_macros").eq("user_id", userId).order("entry_date", { ascending: false }).limit(30),
      admin.from("user_body_entries").select("entry_date, weight_kg, body_fat_percent").eq("user_id", userId).order("entry_date", { ascending: false }).limit(30),
      admin.from("community_messages").select("id, created_at, likes_count, is_thread_root").eq("user_id", userId),
      admin.from("user_program_enrollments").select("program_id, status, start_date").eq("user_id", userId),
      admin.from("user_calendar_workouts").select("is_completed, scheduled_date").eq("user_id", userId),
    ]);

    const profile = profileRes.data;
    const authUser = authUserRes?.data?.user;
    const workouts = workoutsRes.data || [];
    const prs = prsRes.data || [];
    const checkins = checkinsRes.data || [];
    const goals = goalsRes.data || [];
    const body = bodyRes.data || [];
    const messages = messagesRes.data || [];
    const diary = diaryRes.data || [];
    const calendar = calendarRes.data || [];
    const enrollments = enrollmentsRes.data || [];

    // Get program names
    const programIds = [...new Set(enrollments.map(e => e.program_id))];
    let programNames: Record<string, string> = {};
    if (programIds.length > 0) {
      const { data: programs } = await admin.from("programs").select("id, name").in("id", programIds);
      (programs || []).forEach(p => { programNames[p.id] = p.name; });
    }

    const completedWorkouts = workouts.filter(w => w.is_completed);
    const totalVolume = workouts.reduce((s, w) => s + (Number(w.total_volume) || 0), 0);
    const calCompliance = calendar.length > 0 ? Math.round(calendar.filter(c => c.is_completed).length / calendar.length * 100) : null;

    const clientData = {
      name: profile?.display_name || "Unknown",
      email: authUser?.email || null,
      joinDate: authUser?.created_at || profile?.created_at,
      lastSignIn: authUser?.last_sign_in_at,
      training: {
        totalWorkouts: completedWorkouts.length,
        totalVolume: Math.round(totalVolume),
        recentWorkouts: workouts.slice(0, 20).map(w => ({ name: w.workout_name, date: w.date, completed: w.is_completed, volume: w.total_volume })),
        prs: prs.slice(0, 15).map(p => ({ exercise: p.exercise_name, weight: p.max_weight, reps: p.max_reps, date: p.achieved_at })),
      },
      readiness: {
        totalCheckins: checkins.length,
        recent: checkins.slice(0, 30).map(c => ({
          date: c.check_date,
          sleepHours: (c as any).sleep_hours,
          sleep: c.sleep_score,
          stress: c.stress_score,
          energy: c.energy_score,
          drive: c.drive_score,
        })),
      },
      nutrition: {
        hasCalculator: !!nutritionRes.data,
        savedMeals: (mealsRes.data || []).length,
        diaryEntries: diary.length,
        recentDiary: diary.slice(0, 10),
      },
      goals: goals.map(g => ({ title: g.title, type: g.goal_type, status: g.status, current: g.current_value, target: g.target_value, unit: g.unit })),
      body: body.slice(0, 15).map(b => ({ date: b.entry_date, weight: b.weight_kg, bf: b.body_fat_percent })),
      programs: enrollments.map(e => ({ name: programNames[e.program_id] || "Unknown", status: e.status, startDate: e.start_date })),
      compliance: calCompliance,
      community: {
        totalPosts: messages.filter(m => m.is_thread_root).length,
        totalLikes: messages.reduce((s, m) => s + (m.likes_count || 0), 0),
      },
    };

    const systemPrompt = `You are a senior coaching analyst for "The Vault", a premium fitness coaching platform. Generate a detailed individual client report.

Your report MUST follow this structure with markdown:

## 1. Client Overview & Engagement Status
Summary of who they are, how long on platform, activity level.

---

## 2. Training Analysis
Volume trends, frequency, PRs, consistency patterns. Be specific with numbers.

---

## 3. Readiness & Recovery
Sleep hours analysis (7-9h optimal for recovery and hormonal regulation), energy/stress/drive patterns, burnout risk.

---

## 4. Nutrition Compliance
Calculator setup, diary usage, meal logging. Identify gaps.

---

## 5. Goal Progress Assessment
Review each goal, progress %, likelihood of achievement.

---

## 6. Body Composition Trends
Weight and body fat trends. Note direction and rate of change.

---

## 7. Community Engagement
Posting activity, likes received, engagement level.

---

## 8. Coaching Recommendations
Exactly 5 specific, actionable recommendations numbered 1-5. Each must include:
- **Action**: What to do
- **Rationale**: Why
- **Priority**: High/Medium/Low

---

## 9. Risk Assessment
Assign ONE overall status:
- 🟢 **On Track** — if consistently training, checking in, progressing
- 🟡 **Watch** — if some gaps, declining metrics, or missed sessions  
- 🔴 **Intervention Needed** — if inactive, declining, or at risk

Provide a clear explanation for the rating.

Be specific with names, numbers, dates. No generic advice. Never reference specific experts, authors, or coaching organizations by name. Deliver all advice as direct coaching guidance.`;

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
          { role: "user", content: `CLIENT DATA for ${clientData.name}:\n${JSON.stringify(clientData, null, 2)}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const report = aiData.choices?.[0]?.message?.content || "No report generated.";

    return new Response(JSON.stringify({ report, generatedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Client report error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: msg.includes("admin") || msg.includes("Unauthorized") ? 403 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
