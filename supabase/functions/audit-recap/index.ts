import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { results } = await req.json();
    const d = results.data;
    const scores = results.scores;

    // Build detailed summary for the AI
    const lines: string[] = [];
    lines.push(`## Athlete Profile`);
    lines.push(`- Weight: ${d.weight} lbs, Age: ${d.age}, Height: ${d.height} inches`);
    lines.push(`- Training experience: ${d.experience || 'not specified'}`);
    if (d.trainingFrequency) lines.push(`- Training frequency: ${d.trainingFrequency} days/week`);
    if (d.primaryGoal) lines.push(`- Primary goal: ${d.primaryGoal}`);
    if (d.injuryHistory && d.injuryHistory !== 'none') lines.push(`- Injury history: ${d.injuryHistory}`);
    
    lines.push(`\n## Lifestyle`);
    lines.push(`- Sleep: ${d.sleep || 'not specified'} hours/night`);
    lines.push(`- Protein target met: ${d.protein || 'not specified'}`);
    lines.push(`- Stress level: ${d.stress || 'not specified'}/10`);
    if (d.waterIntake) lines.push(`- Water intake: ${d.waterIntake}`);
    if (d.alcohol) lines.push(`- Alcohol consumption: ${d.alcohol}`);

    lines.push(`\n## Strength Numbers`);
    if (d.backSquat) lines.push(`- Back Squat: ${d.backSquat} lbs${d.estimatedLifts?.backSquat ? ' (estimated)' : ''}${d.substitutions?.backSquat ? ` (substituted: ${d.substitutions.backSquat})` : ''}`);
    if (d.frontSquat) lines.push(`- Front Squat: ${d.frontSquat} lbs${d.estimatedLifts?.frontSquat ? ' (estimated)' : ''}${d.substitutions?.frontSquat ? ` (substituted: ${d.substitutions.frontSquat})` : ''}`);
    if (d.strictPress) lines.push(`- Strict Press: ${d.strictPress} lbs${d.estimatedLifts?.strictPress ? ' (estimated)' : ''}`);
    if (d.deadlift) lines.push(`- Deadlift: ${d.deadlift} lbs${d.estimatedLifts?.deadlift ? ' (estimated)' : ''}${d.substitutions?.deadlift ? ` (substituted: ${d.substitutions.deadlift})` : ''}`);
    if (!d.backSquat && !d.frontSquat && !d.strictPress && !d.deadlift) lines.push(`- No strength data provided`);

    lines.push(`\n## Cardio`);
    if (d.mileRunTime) {
      const mins = Math.floor(d.mileRunTime / 60);
      const secs = d.mileRunTime % 60;
      lines.push(`- Mile time: ${mins}:${secs.toString().padStart(2, '0')}`);
    } else if (d.cardioTest && d.cardioTest !== 'none' && d.cardioTime) {
      const mins = Math.floor(d.cardioTime / 60);
      const secs = d.cardioTime % 60;
      lines.push(`- ${d.cardioTest}: ${mins}:${secs.toString().padStart(2, '0')}`);
    } else {
      lines.push(`- No cardio benchmark provided`);
    }

    // Movement Screen section
    const movementLines: string[] = [];
    if (d.broadJumpFeet) movementLines.push(`- Broad Jump: ${d.broadJumpFeet} feet`);
    if (d.deadHangSeconds !== undefined && d.deadHangSeconds !== null) movementLines.push(`- Dead Hang: ${d.deadHangSeconds} seconds`);
    if (d.toeTouch !== undefined && d.toeTouch !== null) {
      const toeLabels = ['Cannot reach toes', 'Touches toes', 'Palms flat on ground'];
      movementLines.push(`- Toe Touch: ${toeLabels[d.toeTouch]}`);
    }
    if (d.heelSit) movementLines.push(`- Heel Sit: ${d.heelSit === 'pass' ? 'Pass' : 'Fail'}`);
    if (d.deepSquat) movementLines.push(`- Deep Squat (30s hold): ${d.deepSquat === 'pass' ? 'Pass' : 'Fail'}`);
    if (d.overheadReach) movementLines.push(`- Overhead Reach (Wall Test): ${d.overheadReach === 'pass' ? 'Pass' : 'Fail'}`);
    if (d.maxPullups !== undefined && d.maxPullups !== null) movementLines.push(`- Max Pull-ups: ${d.maxPullups} reps`);
    if (d.maxPushups !== undefined && d.maxPushups !== null) movementLines.push(`- Max Push-ups (chest to ground, full lockout): ${d.maxPushups} reps`);
    if (d.lSitSeconds !== undefined && d.lSitSeconds !== null) movementLines.push(`- Parallette L-Sit: ${d.lSitSeconds} seconds`);
    if (d.pistolSquatLeft || d.pistolSquatRight) {
      movementLines.push(`- Pistol Squat Barefoot — Left: ${d.pistolSquatLeft === 'yes' ? 'Yes' : d.pistolSquatLeft === 'no' ? 'No' : 'Not tested'}, Right: ${d.pistolSquatRight === 'yes' ? 'Yes' : d.pistolSquatRight === 'no' ? 'No' : 'Not tested'}`);
    }

    if (movementLines.length > 0) {
      lines.push(`\n## Movement Screen`);
      lines.push(...movementLines);
    }

    lines.push(`\n## Scores`);
    lines.push(`- Overall: ${results.overallScore}/100`);
    lines.push(`- Strength: ${scores.strength}, Endurance: ${scores.endurance}, Mobility: ${scores.mobility}, Power: ${scores.power}, Stability: ${scores.stability}`);
    lines.push(`- Tier: ${results.tier}`);

    lines.push(`\n## Leaks Detected: ${results.leaks.length}`);
    results.leaks.forEach((leak: any) => {
      lines.push(`- ${leak.severity.toUpperCase()}: ${leak.title} — ${leak.description}`);
    });

    // Precision Nutrition habits
    const pnHabits = [
      { key: 'eatsSlowly', label: 'Eats slowly and without distractions' },
      { key: 'stopsAt80', label: 'Stops eating at 80% full' },
      { key: 'proteinEveryMeal', label: 'Includes protein at every meal' },
      { key: 'veggiesEveryMeal', label: 'Eats vegetables/fruit at every meal' },
      { key: 'mealPrep', label: 'Plans or preps meals in advance' },
      { key: 'eatingConsistency', label: 'Eating schedule consistency' },
    ];
    const hasAnyPnHabit = pnHabits.some(h => (d as any)[h.key]);
    if (hasAnyPnHabit) {
      lines.push(`\n## Nutrition Habits`);
      for (const h of pnHabits) {
        const val = (d as any)[h.key];
        if (val) lines.push(`- ${h.label}: ${val}`);
      }
    }

    if (results.skippedAreas?.length > 0) {
      lines.push(`\n## Areas Not Assessed (data not provided):`);
      results.skippedAreas.forEach((area: string) => lines.push(`- ${area}`));
    }

    const hasMovementData = movementLines.length > 0;

    const userPrompt = `Here is the full audit data for this athlete:\n\n${lines.join("\n")}\n\nWrite a personalized analysis with these ${hasMovementData ? '4' : '3'} sections:\n1. **Overall Assessment** — 2-3 sentences summarizing where this athlete stands\n2. **Key Findings** — Interpret each leak and skipped area. Explain WHY it matters for their goals.${hasMovementData ? ' If movement screen data is provided, analyze mobility patterns (toe touch + heel sit + deep squat + overhead reach), power output (broad jump), grip/core stability (dead hang + L-sit), muscular endurance (pull-ups + push-ups), and single-leg symmetry (pistol squats). Flag asymmetries.' : ''} If nutrition habit data is provided, analyze their eating behaviors and connect them to performance outcomes.\n${hasMovementData ? '3. **Movement Quality Assessment** — Analyze movement screen results using functional movement screening principles and the movement hierarchy (mobility before stability before strength). Identify mobility restrictions vs stability deficits. Note if the athlete has strength but lacks movement quality (or vice versa). Reference specific test results. For pull-ups and push-ups, evaluate strength-to-bodyweight ratios. For pistol squats, assess single-leg stability and flag any left/right asymmetries.\n4. **Action Plan** — 3-5 prioritized recommendations incorporating movement corrections alongside strength/conditioning work.\n' : '3. **Action Plan** — 3-5 prioritized, specific recommendations. If nutrition habits are weak, pick ONE simple nutrition habit to focus on for 2 weeks (e.g., protein at every meal, eating slowly, planning meals in advance).\n'}\nUse markdown formatting. Be direct and coaching-oriented. Reference their specific numbers. Never cite or name-drop any experts, books, or certifications.`;

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
            content: `You are a performance coach and movement specialist writing a personalized audit recap for an athlete. You understand functional movement screening principles, the movement hierarchy (mobility before stability before strength), and strength-to-bodyweight ratios. When movement screen data is provided, analyze it with expertise: toe touch and heel sit reveal hip and ankle mobility; deep squat tests multi-joint mobility and motor control; overhead reach indicates shoulder and thoracic mobility; dead hang and L-sit measure grip endurance and core compression strength; pull-ups and push-ups reveal relative bodyweight strength; pistol squats expose single-leg stability and asymmetry. Be direct, knowledgeable, and actionable. Use their specific data points. Write in second person ("you"). Format with markdown headers and bullet points. Keep it under 700 words total.

COACHING KNOWLEDGE BASE — Use to inform recommendations. Never cite sources or name-drop experts.

SLEEP & RECOVERY:
- 7-9 hours is non-negotiable. Consistency of sleep/wake times (±1 hour) matters more than total hours.
- Morning sunlight within 30-60 min of waking sets circadian rhythm.
- Delay caffeine 90-120 min after waking. No caffeine after 4pm.
- Cool bedroom (65-68°F), warm shower before bed to initiate sleep.

TRAINING & AUTOREGULATION:
- Life stress is a training variable. High life stress = reduce volume/intensity.
- Aerobic base work (nasal-breathing pace) should be 70-80% of conditioning volume.
- Fitness-fatigue model: deload when accumulated fatigue exceeds fitness gains.
- The body adapts during recovery, not during the session.

NUTRITION & HABITS:
- One habit at a time. 80%+ adherence with one change; <5% success with 3+ simultaneously.
- Hand-portion method: 1 palm protein, 1 fist veg, 1 cupped hand carbs, 1 thumb fats per meal.
- 80% consistency beats 100% perfection.
- Protein 0.7-1.2g/lb bodyweight. Stress-eating is a symptom — address sleep and stress first.

IMPORTANT: Never reference specific experts, authors, books, or coaching organizations by name. Deliver all advice as direct coaching guidance.`,
          },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const recap = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ recap }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("audit-recap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
