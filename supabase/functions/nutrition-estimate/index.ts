// Estimates calories/macros from a meal description and/or photo.
// The result is ALWAYS returned as a draft estimate — the athlete must confirm
// or edit it in the app before anything is written to their nutrition log.
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
    if (!LOVABLE_API_KEY) throw new Error("AI is not configured");

    const { description, imageBase64 } = await req.json();
    if (!description && !imageBase64) {
      return new Response(JSON.stringify({ error: "Nothing to estimate" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: unknown[] = [];
    content.push({
      type: "text",
      text:
        "Estimate the nutrition of this meal. Be realistic and conservative. " +
        "If portion size is unclear, assume a normal adult serving and say so in the note.\n" +
        (description ? `Athlete's description: ${description}` : "No description given."),
    });
    if (imageBase64) {
      content.push({ type: "image_url", image_url: { url: imageBase64 } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You estimate the calories and macronutrients of meals for an athlete's coach. " +
              "You never give coaching advice, never change targets, and never claim certainty. " +
              "Always return numbers via the provided tool.",
          },
          { role: "user", content },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_estimate",
              description: "Return the estimated nutrition for the meal.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Short name of the meal" },
                  items: { type: "array", items: { type: "string" } },
                  calories: { type: "number" },
                  protein: { type: "number", description: "grams" },
                  carbs: { type: "number", description: "grams" },
                  fats: { type: "number", description: "grams" },
                  confidence: { type: "string", enum: ["low", "medium", "high"] },
                  note: { type: "string", description: "Assumptions made" },
                },
                required: ["summary", "calories", "protein", "carbs", "fats", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_estimate" } },
      }),
    });

    if (res.status === 429) {
      return new Response(
        JSON.stringify({ error: "AI is busy right now. Try again in a moment, or enter the numbers yourself." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (res.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits are exhausted. Enter the numbers manually for now." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("No estimate returned");
    const estimate = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify({ estimate, is_estimate: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
