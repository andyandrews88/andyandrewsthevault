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
      lines.push(`\n## Nutrition Habits (Precision Nutrition)`);
      for (const h of pnHabits) {
        const val = (d as any)[h.key];
        if (val) lines.push(`- ${h.label}: ${val}`);
      }
    }

    if (results.skippedAreas?.length > 0) {
      lines.push(`\n## Areas Not Assessed (data not provided):`);
      results.skippedAreas.forEach((area: string) => lines.push(`- ${area}`));
    }

    const userPrompt = `Here is the full audit data for this athlete:\n\n${lines.join("\n")}\n\nWrite a personalized analysis with these 3 sections:\n1. **Overall Assessment** — 2-3 sentences summarizing where this athlete stands\n2. **Key Findings** — Interpret each leak and skipped area. Explain WHY it matters for their goals. If Precision Nutrition habit data is provided, analyze their eating behaviors and connect them to performance outcomes.\n3. **Action Plan** — 3-5 prioritized, specific recommendations. If nutrition habits are weak, include a Precision Nutrition anchor habit recommendation (pick ONE habit to focus on for 2 weeks).\n\nUse markdown formatting. Be direct and coaching-oriented. Reference their specific numbers.`;

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
            content: "You are a performance coach writing a personalized audit recap for an athlete. Be direct, knowledgeable, and actionable. Use their specific data points. Write in second person (\"you\"). Format with markdown headers and bullet points. Keep it under 500 words total.",
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
