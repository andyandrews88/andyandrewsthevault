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
    if (d.weightStart && d.weightEnd) {
      const unit = d.usesImperial ? "lbs" : "kg";
      const toDisplay = (kg: number) => d.usesImperial ? Math.round(kg * 2.20462 * 10) / 10 : Math.round(kg * 10) / 10;
      const diff = toDisplay(d.weightEnd) - toDisplay(d.weightStart);
      lines.push(`- Bodyweight: ${toDisplay(d.weightStart)} -> ${toDisplay(d.weightEnd)} ${unit} (${diff > 0 ? "+" : ""}${Math.round(diff * 10) / 10} ${unit})`);
    }

    const userPrompt = `This athlete's past 7 days:\n${lines.join("\n")}\n\nWrite a 3-4 sentence weekly performance review. Be direct and coaching-oriented. Mention specific numbers. If a metric needs attention, call it out with a suggestion.`;

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
            content: "You are a concise performance coach. Given this athlete's weekly data, write a 3-4 sentence review. Be direct, supportive, and actionable. Mention specific numbers. If something needs attention, say so. Do not use markdown formatting — plain text only.",
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
