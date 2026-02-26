import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const adminUserId = user.id;

    // Check admin role using service client
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create_workout": {
        const { userId, workoutName, date } = body;
        const { data, error } = await serviceClient
          .from("workouts")
          .insert({
            user_id: userId,
            workout_name: workoutName,
            date: date,
            is_completed: false,
          })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "add_exercise": {
        const { workoutId, exerciseName, orderIndex, exerciseType } = body;
        const { data: exercise, error } = await serviceClient
          .from("workout_exercises")
          .insert({
            workout_id: workoutId,
            exercise_name: exerciseName,
            order_index: orderIndex || 0,
            exercise_type: exerciseType || "strength",
          })
          .select()
          .single();
        if (error) throw error;

        // Add a default first set
        if (exerciseType === "conditioning") {
          const { data: firstSet } = await serviceClient
            .from("conditioning_sets")
            .insert({ exercise_id: exercise.id, set_number: 1 })
            .select()
            .single();
          return new Response(
            JSON.stringify({ ...exercise, sets: [], conditioning_sets: firstSet ? [firstSet] : [] }),
            { headers: corsHeaders }
          );
        } else {
          const { data: firstSet } = await serviceClient
            .from("exercise_sets")
            .insert({ exercise_id: exercise.id, set_number: 1 })
            .select()
            .single();
          return new Response(
            JSON.stringify({ ...exercise, sets: firstSet ? [firstSet] : [], conditioning_sets: [] }),
            { headers: corsHeaders }
          );
        }
      }

      case "add_set": {
        const { exerciseId, setNumber, weight, reps } = body;
        const { data, error } = await serviceClient
          .from("exercise_sets")
          .insert({
            exercise_id: exerciseId,
            set_number: setNumber || 1,
            weight: weight || null,
            reps: reps || null,
          })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "update_set": {
        const { setId, weight, reps, isCompleted, rir } = body;
        const updateData: Record<string, unknown> = {};
        if (weight !== undefined) updateData.weight = weight;
        if (reps !== undefined) updateData.reps = reps;
        if (isCompleted !== undefined) updateData.is_completed = isCompleted;
        if (rir !== undefined) updateData.rir = rir;

        const { data, error } = await serviceClient
          .from("exercise_sets")
          .update(updateData)
          .eq("id", setId)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "remove_exercise": {
        const { exerciseId } = body;
        const { error } = await serviceClient
          .from("workout_exercises")
          .delete()
          .eq("id", exerciseId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "remove_set": {
        const { setId } = body;
        const { error } = await serviceClient
          .from("exercise_sets")
          .delete()
          .eq("id", setId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "finish_workout": {
        const { workoutId } = body;
        const { error } = await serviceClient
          .from("workouts")
          .update({ is_completed: true })
          .eq("id", workoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "update_notes": {
        const { workoutId, notes } = body;
        const { error } = await serviceClient
          .from("workouts")
          .update({ notes })
          .eq("id", workoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "update_exercise_notes": {
        const { exerciseId, notes } = body;
        const { error } = await serviceClient
          .from("workout_exercises")
          .update({ notes })
          .eq("id", exerciseId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "get_workout_detail": {
        const { workoutId } = body;
        const { data: workout, error: wErr } = await serviceClient
          .from("workouts")
          .select("*")
          .eq("id", workoutId)
          .single();
        if (wErr) throw wErr;

        const { data: exercises } = await serviceClient
          .from("workout_exercises")
          .select("*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)")
          .eq("workout_id", workoutId)
          .order("order_index");

        return new Response(
          JSON.stringify({ workout, exercises: exercises || [] }),
          { headers: corsHeaders }
        );
      }

      case "get_user_workouts": {
        const { userId, limit: queryLimit, includeAll } = body;
        let query = serviceClient
          .from("workouts")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(queryLimit || 20);
        if (!includeAll) {
          query = query.eq("is_completed", true);
        }
        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "reopen_workout": {
        const { workoutId } = body;
        const { error } = await serviceClient
          .from("workouts")
          .update({ is_completed: false })
          .eq("id", workoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "upsert_exercise_video": {
        const { exerciseName, videoUrl } = body;
        // Check if exercise exists in library
        const { data: existing } = await serviceClient
          .from("exercise_library")
          .select("id")
          .ilike("name", exerciseName)
          .maybeSingle();
        
        if (existing) {
          const { error } = await serviceClient
            .from("exercise_library")
            .update({ video_url: videoUrl, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await serviceClient
            .from("exercise_library")
            .insert({ name: exerciseName, video_url: videoUrl, category: "strength" });
          if (error) throw error;
        }
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "get_exercise_video": {
        const { exerciseName } = body;
        const { data } = await serviceClient
          .from("exercise_library")
          .select("video_url")
          .ilike("name", exerciseName)
          .maybeSingle();
        return new Response(JSON.stringify({ video_url: data?.video_url || null }), { headers: corsHeaders });
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: corsHeaders }
        );
    }
  } catch (err) {
    console.error("admin-workout-builder error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
