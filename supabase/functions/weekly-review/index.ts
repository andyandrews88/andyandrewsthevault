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

    const { weeklyData } = await req.json();
    const d = weeklyData;

    // Build human-readable data summary for the prompt
    const lines: string[] = [];
    lines.push(`- Workouts completed: ${d.workoutsCompleted}`);
    if (d.totalVolume > 0) lines.push(`- Total volume: ${d.totalVolume.toLocaleString()} lbs`);
    lines.push(`- New PRs: ${d.newPRs}`);
    if (d.avgReadiness > 0) {
      lines.push(`- Average readiness: ${d.avgReadiness}% (trending ${d.readinessTrend} from last week)`);
      if (d.lowestReadinessDay) lines.push(`- Lowest readiness day: ${d.lowestReadinessDay}`);
    }
    if (d.conditioningSessions > 0) {
      lines.push(`- Conditioning sessions: ${d.conditioningSessions}`);
      lines.push(`- Total conditioning time: ${d.totalConditioningMinutes} minutes`);
      if (d.totalConditioningCalories > 0) lines.push(`- Conditioning calories burned: ~${d.totalConditioningCalories}`);
    }
    if (d.avgRIR !== null && d.avgRIR !== undefined && d.rirSetsCount > 0) {
      lines.push(`- Average RIR (Reps in Reserve): ${d.avgRIR} across ${d.rirSetsCount} tracked sets`);
      lines.push(`- Hard sets (RIR 0-1): ${d.hardSetsPercent}% of tracked sets`);
    }
    if (d.weightStart && d.weightEnd) {
      const unit = d.usesImperial ? "lbs" : "kg";
      const toDisplay = (kg: number) => d.usesImperial ? Math.round(kg * 2.20462 * 10) / 10 : Math.round(kg * 10) / 10;
      const diff = toDisplay(d.weightEnd) - toDisplay(d.weightStart);
      lines.push(`- Bodyweight: ${toDisplay(d.weightStart)} -> ${toDisplay(d.weightEnd)} ${unit} (${diff > 0 ? "+" : ""}${Math.round(diff * 10) / 10} ${unit})`);
    }

    if (d.checkinNotes && d.checkinNotes.length > 0) {
      lines.push("");
      lines.push("Daily check-in notes from this week:");
      for (const n of d.checkinNotes) {
        lines.push(`- ${n.date}: "${n.note}"`);
      }
    }

    const userPrompt = `This athlete's past 7 days:\n${lines.join("\n")}\n\nWrite a 4-6 sentence weekly performance review. Be direct and coaching-oriented. Mention specific numbers. If conditioning work was done, acknowledge it. If RIR data is available, remember: lower RIR = harder effort (0 = failure, 1 = one rep left, 2 = sweet spot, 3+ = moderate/easy). Cross-reference RIR with readiness scores to evaluate autoregulation. If daily check-in notes are provided, identify patterns and correlate them with the data. If a metric needs attention, call it out with a suggestion.`;

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
            content: "You are a concise performance coach. Given this athlete's weekly data, write a 4-6 sentence review. Be direct, supportive, and actionable. Mention specific numbers. Consider ALL available data: strength volume, conditioning work, readiness scores, bodyweight trends, and training intensity (RIR). RIR SCALE: lower number = harder set. 0 = failure (no reps left), 1 = one rep left, 2 = productive sweet spot, 3+ = moderate/low intensity. AUTOREGULATION LOGIC: Cross-reference RIR with readiness. High readiness + low RIR (0-2) = ideal, athlete is capitalizing on good recovery. High readiness + high RIR (3+) = sandbagging, suggest pushing intensity on compounds. Low readiness + high RIR (3+) = smart autoregulation, acknowledge the adjustment positively. Low readiness + low RIR (0-1) = overreaching risk, suggest backing off or deloading. If conditioning data exists, account for total training load (strength + conditioning). If daily check-in notes are provided, look for patterns (recurring stress, sleep issues, pain, nutrition problems) and correlate them with the performance data. Provide lifestyle recommendations where relevant — for example, if notes mention poor sleep and readiness is low, connect those dots. Do not echo back sensitive personal details verbatim — synthesize and advise. Do not use markdown formatting — plain text only.",
          },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const review = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ review }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-review error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
