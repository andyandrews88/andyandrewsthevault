import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NUTRITIONIX_BASE = 'https://trackapi.nutritionix.com/v2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const appId = Deno.env.get('NUTRITIONIX_APP_ID');
  const appKey = Deno.env.get('NUTRITIONIX_APP_KEY');

  if (!appId || !appKey) {
    return new Response(
      JSON.stringify({ error: 'Nutritionix API credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, query, upc } = await req.json();
    const headers = {
      'x-app-id': appId,
      'x-app-key': appKey,
      'Content-Type': 'application/json',
    };

    let result;

    if (action === 'search' && query) {
      // Instant search endpoint
      const res = await fetch(`${NUTRITIONIX_BASE}/search/instant?query=${encodeURIComponent(query)}`, {
        headers,
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Nutritionix search failed [${res.status}]: ${errBody}`);
      }
      const data = await res.json();

      // Get detailed nutrition for top common items
      const commonItems = (data.common || []).slice(0, 10);
      const detailedFoods = [];

      if (commonItems.length > 0) {
        // Use natural/nutrients endpoint for detailed info
        for (const item of commonItems.slice(0, 8)) {
          try {
            const nutRes = await fetch(`${NUTRITIONIX_BASE}/natural/nutrients`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ query: item.food_name }),
            });
            if (nutRes.ok) {
              const nutData = await nutRes.json();
              if (nutData.foods?.[0]) {
                const f = nutData.foods[0];
                detailedFoods.push({
                  name: f.food_name,
                  brand: null,
                  servingSize: `${f.serving_qty} ${f.serving_unit}`,
                  servingGrams: f.serving_weight_grams || 100,
                  calories: Math.round(f.nf_calories || 0),
                  protein: Math.round((f.nf_protein || 0) * 10) / 10,
                  carbs: Math.round((f.nf_total_carbohydrate || 0) * 10) / 10,
                  fats: Math.round((f.nf_total_fat || 0) * 10) / 10,
                  fiber: f.nf_dietary_fiber ? Math.round(f.nf_dietary_fiber * 10) / 10 : undefined,
                  imageUrl: f.photo?.thumb || null,
                  source: 'nutritionix',
                });
              }
            } else {
              await nutRes.text(); // consume body
            }
          } catch {
            // skip individual failures
          }
        }
      }

      // Also include branded items directly
      const brandedItems = (data.branded || []).slice(0, 5).map((b: any) => ({
        name: b.food_name,
        brand: b.brand_name,
        servingSize: `${b.serving_qty} ${b.serving_unit}`,
        servingGrams: b.serving_weight_grams || 100,
        calories: Math.round(b.nf_calories || 0),
        protein: Math.round((b.nf_protein || 0) * 10) / 10,
        carbs: Math.round((b.nf_total_carbohydrate || 0) * 10) / 10,
        fats: Math.round((b.nf_total_fat || 0) * 10) / 10,
        fiber: undefined,
        imageUrl: b.photo?.thumb || null,
        source: 'nutritionix',
      }));

      result = { foods: [...detailedFoods, ...brandedItems] };

    } else if (action === 'upc' && upc) {
      // UPC barcode lookup
      const res = await fetch(`${NUTRITIONIX_BASE}/search/item?upc=${encodeURIComponent(upc)}`, {
        headers,
      });
      if (!res.ok) {
        const errBody = await res.text();
        if (res.status === 404) {
          result = { food: null };
        } else {
          throw new Error(`Nutritionix UPC lookup failed [${res.status}]: ${errBody}`);
        }
      } else {
        const data = await res.json();
        if (data.foods?.[0]) {
          const f = data.foods[0];
          result = {
            food: {
              barcode: upc,
              name: f.food_name || 'Unknown Product',
              brand: f.brand_name,
              servingSize: `${f.serving_qty} ${f.serving_unit}`,
              servingGrams: f.serving_weight_grams || 100,
              calories: Math.round(f.nf_calories || 0),
              protein: Math.round((f.nf_protein || 0) * 10) / 10,
              carbs: Math.round((f.nf_total_carbohydrate || 0) * 10) / 10,
              fats: Math.round((f.nf_total_fat || 0) * 10) / 10,
              fiber: f.nf_dietary_fiber ? Math.round(f.nf_dietary_fiber * 10) / 10 : undefined,
              imageUrl: f.photo?.thumb || null,
              source: 'nutritionix',
            },
          };
        } else {
          result = { food: null };
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "search" with query or "upc" with upc.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Nutritionix edge function error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
