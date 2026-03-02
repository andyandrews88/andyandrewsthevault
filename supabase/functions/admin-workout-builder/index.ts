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
      // ==================== EXISTING WORKOUT ACTIONS ====================
      case "create_workout": {
        const { userId, workoutName, date } = body;
        const { data, error } = await serviceClient
          .from("workouts")
          .insert({ user_id: userId, workout_name: workoutName, date, is_completed: false })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "add_exercise": {
        const { workoutId, exerciseName, orderIndex, exerciseType } = body;
        const { data: exercise, error } = await serviceClient
          .from("workout_exercises")
          .insert({ workout_id: workoutId, exercise_name: exerciseName, order_index: orderIndex || 0, exercise_type: exerciseType || "strength" })
          .select()
          .single();
        if (error) throw error;
        // Auto-register in exercise_library (insert if not exists)
        const { data: existingLib } = await serviceClient.from("exercise_library").select("id").ilike("name", exerciseName).maybeSingle();
        if (!existingLib) {
          await serviceClient.from("exercise_library").insert({ name: exerciseName, category: exerciseType === "conditioning" ? "conditioning" : "strength" });
        }
        if (exerciseType === "conditioning") {
          const { data: firstSet } = await serviceClient.from("conditioning_sets").insert({ exercise_id: exercise.id, set_number: 1 }).select().single();
          return new Response(JSON.stringify({ ...exercise, sets: [], conditioning_sets: firstSet ? [firstSet] : [] }), { headers: corsHeaders });
        } else {
          const { data: firstSet } = await serviceClient.from("exercise_sets").insert({ exercise_id: exercise.id, set_number: 1 }).select().single();
          return new Response(JSON.stringify({ ...exercise, sets: firstSet ? [firstSet] : [], conditioning_sets: [] }), { headers: corsHeaders });
        }
      }

      case "replace_exercise": {
        const { exerciseId, newExerciseName } = body;
        const { error } = await serviceClient.from("workout_exercises").update({ exercise_name: newExerciseName }).eq("id", exerciseId);
        if (error) throw error;
        // Auto-register new exercise name
        const { data: existingLib } = await serviceClient.from("exercise_library").select("id").ilike("name", newExerciseName).maybeSingle();
        if (!existingLib) {
          await serviceClient.from("exercise_library").insert({ name: newExerciseName, category: "strength" });
        }
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "add_set": {
        const { exerciseId, setNumber, weight, reps } = body;
        const { data, error } = await serviceClient.from("exercise_sets").insert({ exercise_id: exerciseId, set_number: setNumber || 1, weight: weight || null, reps: reps || null }).select().single();
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
        const { data, error } = await serviceClient.from("exercise_sets").update(updateData).eq("id", setId).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "remove_exercise": {
        const { exerciseId } = body;
        const { error } = await serviceClient.from("workout_exercises").delete().eq("id", exerciseId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "remove_set": {
        const { setId } = body;
        const { error } = await serviceClient.from("exercise_sets").delete().eq("id", setId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "finish_workout": {
        const { workoutId } = body;
        const { error } = await serviceClient.from("workouts").update({ is_completed: true }).eq("id", workoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "update_notes": {
        const { workoutId, notes } = body;
        const { error } = await serviceClient.from("workouts").update({ notes }).eq("id", workoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "update_exercise_notes": {
        const { exerciseId, notes } = body;
        const { error } = await serviceClient.from("workout_exercises").update({ notes }).eq("id", exerciseId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "get_workout_detail": {
        const { workoutId } = body;
        const { data: workout, error: wErr } = await serviceClient.from("workouts").select("*").eq("id", workoutId).single();
        if (wErr) throw wErr;
        const { data: exercises } = await serviceClient.from("workout_exercises").select("*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)").eq("workout_id", workoutId).order("order_index");
        return new Response(JSON.stringify({ workout, exercises: exercises || [] }), { headers: corsHeaders });
      }

      case "get_user_workouts": {
        const { userId, limit: queryLimit, includeAll } = body;
        let query = serviceClient.from("workouts").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(queryLimit || 20);
        if (!includeAll) query = query.eq("is_completed", true);
        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "reopen_workout": {
        const { workoutId } = body;
        const { error } = await serviceClient.from("workouts").update({ is_completed: false }).eq("id", workoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "upsert_exercise_video": {
        const { exerciseName, videoUrl } = body;
        const { data: existing } = await serviceClient.from("exercise_library").select("id").ilike("name", exerciseName).maybeSingle();
        if (existing) {
          const { error } = await serviceClient.from("exercise_library").update({ video_url: videoUrl, updated_at: new Date().toISOString() }).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await serviceClient.from("exercise_library").insert({ name: exerciseName, video_url: videoUrl, category: "strength" });
          if (error) throw error;
        }
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "get_exercise_video": {
        const { exerciseName } = body;
        const { data } = await serviceClient.from("exercise_library").select("video_url, is_timed, is_unilateral").ilike("name", exerciseName).maybeSingle();
        return new Response(JSON.stringify({ video_url: data?.video_url || null, is_timed: data?.is_timed || false, is_unilateral: data?.is_unilateral || false }), { headers: corsHeaders });
      }

      // ==================== COPY WORKOUT TO USER ====================
      case "copy_workout_to_user": {
        const { sourceWorkoutId, targetUserId, targetDate } = body;
        // Get source workout
        const { data: srcWorkout, error: srcErr } = await serviceClient.from("workouts").select("*").eq("id", sourceWorkoutId).single();
        if (srcErr) throw srcErr;
        // Get source exercises with sets
        const { data: srcExercises } = await serviceClient.from("workout_exercises").select("*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)").eq("workout_id", sourceWorkoutId).order("order_index");
        // Create new workout for target user
        const { data: newWorkout, error: nwErr } = await serviceClient.from("workouts").insert({
          user_id: targetUserId,
          workout_name: srcWorkout.workout_name,
          date: targetDate || srcWorkout.date,
          is_completed: false,
        }).select().single();
        if (nwErr) throw nwErr;
        // Clone exercises and sets
        for (const ex of (srcExercises || [])) {
          const { data: newEx, error: exErr } = await serviceClient.from("workout_exercises").insert({
            workout_id: newWorkout.id,
            exercise_name: ex.exercise_name,
            order_index: ex.order_index,
            exercise_type: ex.exercise_type,
            notes: ex.notes,
            superset_group: ex.superset_group,
          }).select().single();
          if (exErr) continue;
          // Clone strength sets
          for (const s of (ex.sets || [])) {
            await serviceClient.from("exercise_sets").insert({
              exercise_id: newEx.id,
              set_number: s.set_number,
              weight: s.weight,
              reps: s.reps,
              rpe: s.rpe,
              rir: s.rir,
              set_type: s.set_type,
              is_completed: false,
            });
          }
          // Clone conditioning sets
          for (const cs of (ex.conditioning_sets || [])) {
            await serviceClient.from("conditioning_sets").insert({
              exercise_id: newEx.id,
              set_number: cs.set_number,
              duration_seconds: cs.duration_seconds,
              distance: cs.distance,
              distance_unit: cs.distance_unit,
              calories: cs.calories,
              is_completed: false,
            });
          }
        }
        return new Response(JSON.stringify({ success: true, workoutId: newWorkout.id }), { headers: corsHeaders });
      }

      // ==================== TEMPLATE CRUD ====================
      case "list_templates": {
        const { includeArchived } = body;
        let query = serviceClient.from("coach_program_templates").select("*").order("updated_at", { ascending: false });
        if (!includeArchived) query = query.eq("is_archived", false);
        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "create_template": {
        const { name, description, durationWeeks, daysPerWeek, category } = body;
        const { data, error } = await serviceClient.from("coach_program_templates").insert({
          coach_id: adminUserId,
          name,
          description: description || "",
          duration_weeks: durationWeeks || 4,
          days_per_week: daysPerWeek || 4,
          category: category || "strength",
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "update_template": {
        const { templateId, name, description, durationWeeks, daysPerWeek, category, isArchived } = body;
        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (durationWeeks !== undefined) updateData.duration_weeks = durationWeeks;
        if (daysPerWeek !== undefined) updateData.days_per_week = daysPerWeek;
        if (category !== undefined) updateData.category = category;
        if (isArchived !== undefined) updateData.is_archived = isArchived;
        const { data, error } = await serviceClient.from("coach_program_templates").update(updateData).eq("id", templateId).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "delete_template": {
        const { templateId } = body;
        const { error } = await serviceClient.from("coach_program_templates").delete().eq("id", templateId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "get_template_detail": {
        const { templateId } = body;
        const { data: template, error: tErr } = await serviceClient.from("coach_program_templates").select("*").eq("id", templateId).single();
        if (tErr) throw tErr;
        const { data: workouts } = await serviceClient.from("coach_template_workouts").select("*").eq("template_id", templateId).order("week_number").order("day_number");
        return new Response(JSON.stringify({ template, workouts: workouts || [] }), { headers: corsHeaders });
      }

      case "save_template_workout": {
        const { templateWorkoutId, templateId, weekNumber, dayNumber, workoutName, notes, exercises } = body;
        if (templateWorkoutId) {
          const { data, error } = await serviceClient.from("coach_template_workouts").update({
            workout_name: workoutName, notes, exercises, week_number: weekNumber, day_number: dayNumber,
          }).eq("id", templateWorkoutId).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } else {
          const { data, error } = await serviceClient.from("coach_template_workouts").insert({
            template_id: templateId, week_number: weekNumber, day_number: dayNumber,
            workout_name: workoutName, notes: notes || "", exercises: exercises || [],
          }).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        }
      }

      case "delete_template_workout": {
        const { templateWorkoutId } = body;
        const { error } = await serviceClient.from("coach_template_workouts").delete().eq("id", templateWorkoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "duplicate_template_week": {
        const { templateId, sourceWeek, targetWeek, progression } = body;
        const { data: sourceWorkouts, error: sErr } = await serviceClient.from("coach_template_workouts")
          .select("*").eq("template_id", templateId).eq("week_number", sourceWeek);
        if (sErr) throw sErr;
        // Delete existing target week workouts
        await serviceClient.from("coach_template_workouts").delete().eq("template_id", templateId).eq("week_number", targetWeek);
        const newWorkouts = [];
        for (const w of (sourceWorkouts || [])) {
          let exercises = w.exercises as any[];
          if (progression && exercises) {
            exercises = exercises.map((ex: any) => {
              const updated = { ...ex };
              if (progression.type === "weight_increase" && updated.percentage) {
                updated.percentage = Math.round((updated.percentage + (progression.value || 2.5)) * 100) / 100;
              }
              if (progression.type === "reps_increase" && updated.reps) {
                const repsNum = parseInt(updated.reps);
                if (!isNaN(repsNum)) updated.reps = String(repsNum + (progression.value || 1));
              }
              if (progression.type === "rir_decrease" && updated.rir !== undefined && updated.rir !== null) {
                updated.rir = Math.max(0, updated.rir - (progression.value || 1));
              }
              return updated;
            });
          }
          const { data: nw, error: nwErr } = await serviceClient.from("coach_template_workouts").insert({
            template_id: templateId, week_number: targetWeek, day_number: w.day_number,
            workout_name: w.workout_name, notes: w.notes, exercises,
          }).select().single();
          if (!nwErr && nw) newWorkouts.push(nw);
        }
        return new Response(JSON.stringify(newWorkouts), { headers: corsHeaders });
      }

      // ==================== ASSIGN TEMPLATE TO CLIENT ====================
      case "assign_template": {
        const { templateId, targetUserId, startDate, trainingDays } = body;
        // Get template + workouts
        const { data: template } = await serviceClient.from("coach_program_templates").select("*").eq("id", templateId).single();
        if (!template) throw new Error("Template not found");
        const { data: templateWorkouts } = await serviceClient.from("coach_template_workouts").select("*").eq("template_id", templateId).order("week_number").order("day_number");
        if (!templateWorkouts?.length) throw new Error("Template has no workouts");

        // Get client PRs for % of 1RM resolution
        const { data: clientPRs } = await serviceClient.from("personal_records").select("exercise_name, max_weight").eq("user_id", targetUserId);
        const prMap: Record<string, number> = {};
        for (const pr of (clientPRs || [])) {
          const key = pr.exercise_name.toLowerCase();
          if (!prMap[key] || pr.max_weight > prMap[key]) prMap[key] = pr.max_weight;
        }

        // Create assignment record
        const { data: assignment } = await serviceClient.from("coach_client_assignments").insert({
          coach_id: adminUserId, client_user_id: targetUserId, template_id: templateId, start_date: startDate, status: "active",
        }).select().single();

        // Schedule workouts using look-ahead algorithm
        const days = trainingDays || [1, 3, 5]; // default Mon/Wed/Fri
        const start = new Date(startDate + "T12:00:00");
        let currentDate = new Date(start);
        let workoutIndex = 0;

        // Group template workouts by week, then day
        const weekMap: Record<number, any[]> = {};
        for (const tw of templateWorkouts) {
          if (!weekMap[tw.week_number]) weekMap[tw.week_number] = [];
          weekMap[tw.week_number].push(tw);
        }

        for (let week = 1; week <= template.duration_weeks; week++) {
          const weekWorkouts = weekMap[week] || [];
          if (!weekWorkouts.length) continue;
          let dayIdx = 0;
          for (const tw of weekWorkouts) {
            // Find next training day
            while (currentDate.getDay() === 0 || !days.includes(currentDate.getDay())) {
              currentDate.setDate(currentDate.getDate() + 1);
            }
            // Resolve exercises with %1RM
            const resolvedExercises = (tw.exercises as any[]).map((ex: any) => {
              if (ex.percentage && ex.name) {
                const pr = prMap[ex.name.toLowerCase()];
                if (pr) {
                  const resolved = Math.round((pr * ex.percentage / 100) / 2.5) * 2.5;
                  return { ...ex, resolvedWeight: resolved };
                }
              }
              return ex;
            });

            // Create actual workout for client
            const dateStr = currentDate.toISOString().split("T")[0];
            const { data: newWorkout } = await serviceClient.from("workouts").insert({
              user_id: targetUserId, workout_name: tw.workout_name, date: dateStr, is_completed: false, notes: tw.notes || "",
            }).select().single();

            if (newWorkout) {
              // Create exercises and sets
              for (let i = 0; i < resolvedExercises.length; i++) {
                const ex = resolvedExercises[i];
                const { data: newEx } = await serviceClient.from("workout_exercises").insert({
                  workout_id: newWorkout.id, exercise_name: ex.name, order_index: i, exercise_type: ex.exercise_type || "strength", notes: ex.notes || "",
                }).select().single();
                if (newEx) {
                  const numSets = ex.sets || 3;
                  for (let s = 1; s <= numSets; s++) {
                    await serviceClient.from("exercise_sets").insert({
                      exercise_id: newEx.id, set_number: s,
                      weight: ex.resolvedWeight || null,
                      reps: ex.reps ? parseInt(ex.reps) || null : null,
                      rpe: ex.rpe || null, rir: ex.rir ?? null,
                      set_type: ex.set_type || "working",
                    });
                  }
                }
              }
            }
            currentDate.setDate(currentDate.getDate() + 1);
            dayIdx++;
          }
        }
        return new Response(JSON.stringify({ success: true, assignmentId: assignment?.id }), { headers: corsHeaders });
      }

      // ==================== CLIENT WEEK (full exercises + sets) ====================
      case "get_client_week": {
        const { userId, startDate, endDate } = body;
        if (!userId || !startDate || !endDate) throw new Error("userId, startDate, endDate required");
        const { data: weekWorkouts, error: wwErr } = await serviceClient
          .from("workouts")
          .select("id, workout_name, date, is_completed, total_volume, notes")
          .eq("user_id", userId)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date");
        if (wwErr) throw wwErr;
        // Fetch exercises + sets for all workouts in one go
        const workoutIds = (weekWorkouts || []).map((w: any) => w.id);
        let exercises: any[] = [];
        if (workoutIds.length > 0) {
          const { data: exData } = await serviceClient
            .from("workout_exercises")
            .select("*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)")
            .in("workout_id", workoutIds)
            .order("order_index");
          exercises = exData || [];
        }
        // Group exercises by workout_id
        const exByWorkout: Record<string, any[]> = {};
        for (const ex of exercises) {
          if (!exByWorkout[ex.workout_id]) exByWorkout[ex.workout_id] = [];
          exByWorkout[ex.workout_id].push(ex);
        }
        const result = (weekWorkouts || []).map((w: any) => ({
          ...w,
          exercises: exByWorkout[w.id] || [],
        }));
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      // ==================== DELETE WORKOUT ====================
      case "delete_workout": {
        const { workoutId } = body;
        if (!workoutId) throw new Error("workoutId required");
        const { error } = await serviceClient.from("workouts").delete().eq("id", workoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // ==================== UPDATE WORKOUT NAME ====================
      case "update_workout_name": {
        const { workoutId, workoutName } = body;
        const { error } = await serviceClient.from("workouts").update({ workout_name: workoutName }).eq("id", workoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // ==================== CLIENT CALENDAR ====================
      case "get_client_calendar": {
        const { userId, month, year } = body;
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endMonth = month === 12 ? 1 : month + 1;
        const endYear = month === 12 ? year + 1 : year;
        const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
        const { data, error } = await serviceClient.from("workouts").select("id, workout_name, date, is_completed, total_volume")
          .eq("user_id", userId).gte("date", startDate).lt("date", endDate).order("date");
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "reschedule_workout": {
        const { workoutId, newDate } = body;
        const { error } = await serviceClient.from("workouts").update({ date: newDate }).eq("id", workoutId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // ==================== TOUCHPOINTS ====================
      case "add_touchpoint": {
        const { clientUserId, touchpointType, content } = body;
        const { data, error } = await serviceClient.from("coach_touchpoints").insert({
          coach_id: adminUserId, client_user_id: clientUserId, touchpoint_type: touchpointType || "note", content,
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case "get_touchpoints": {
        const { clientUserId, limit: tpLimit } = body;
        const { data, error } = await serviceClient.from("coach_touchpoints").select("*")
          .eq("client_user_id", clientUserId).order("created_at", { ascending: false }).limit(tpLimit || 50);
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      // ==================== LIST ALL USERS (for copy workout picker) ====================
      case "list_all_users": {
        const { data, error } = await serviceClient.from("user_profiles").select("id, display_name, avatar_url").order("display_name");
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      // ==================== CLIENT PERFORMANCE REPORT ====================
      case "get_client_report": {
        const { userId, weeks } = body;
        const numWeeks = weeks || 8;
        const reportStart = new Date(Date.now() - numWeeks * 7 * 86400000).toISOString().split("T")[0];

        // Fetch all data in parallel
        const [workoutsRes, prsRes, checkinsRes, bodyRes] = await Promise.all([
          serviceClient.from("workouts").select("id, date, total_volume, is_completed, workout_name").eq("user_id", userId).gte("date", reportStart).order("date"),
          serviceClient.from("personal_records").select("exercise_name, max_weight, max_reps, achieved_at").eq("user_id", userId).order("achieved_at"),
          serviceClient.from("user_daily_checkins").select("check_date, sleep_score, stress_score, energy_score, drive_score").eq("user_id", userId).gte("check_date", reportStart).order("check_date"),
          serviceClient.from("user_body_entries").select("entry_date, weight_kg, body_fat_percent, uses_imperial").eq("user_id", userId).order("entry_date"),
        ]);

        // Weekly volume aggregation
        const weeklyVolume: { week: string; volume: number; workouts: number }[] = [];
        const volumeMap: Record<string, { volume: number; workouts: number }> = {};
        for (const w of (workoutsRes.data || [])) {
          if (!w.is_completed) continue;
          const d = new Date(w.date + "T12:00:00");
          const dayOfWeek = d.getDay() || 7;
          const monday = new Date(d);
          monday.setDate(d.getDate() - dayOfWeek + 1);
          const weekKey = monday.toISOString().split("T")[0];
          if (!volumeMap[weekKey]) volumeMap[weekKey] = { volume: 0, workouts: 0 };
          volumeMap[weekKey].volume += Number(w.total_volume) || 0;
          volumeMap[weekKey].workouts += 1;
        }
        for (const [week, data] of Object.entries(volumeMap).sort((a, b) => a[0].localeCompare(b[0]))) {
          weeklyVolume.push({ week, volume: Math.round(data.volume), workouts: data.workouts });
        }

        // Weekly readiness aggregation
        const weeklyReadiness: { week: string; sleep: number; energy: number; stress: number; drive: number }[] = [];
        const readinessMap: Record<string, { sleep: number[]; energy: number[]; stress: number[]; drive: number[] }> = {};
        for (const c of (checkinsRes.data || [])) {
          const d = new Date(c.check_date + "T12:00:00");
          const dayOfWeek = d.getDay() || 7;
          const monday = new Date(d);
          monday.setDate(d.getDate() - dayOfWeek + 1);
          const weekKey = monday.toISOString().split("T")[0];
          if (!readinessMap[weekKey]) readinessMap[weekKey] = { sleep: [], energy: [], stress: [], drive: [] };
          readinessMap[weekKey].sleep.push(c.sleep_score);
          readinessMap[weekKey].energy.push(c.energy_score);
          readinessMap[weekKey].stress.push(c.stress_score);
          readinessMap[weekKey].drive.push(c.drive_score);
        }
        for (const [week, data] of Object.entries(readinessMap).sort((a, b) => a[0].localeCompare(b[0]))) {
          const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length * 10) / 10 : 0;
          weeklyReadiness.push({ week, sleep: avg(data.sleep), energy: avg(data.energy), stress: avg(data.stress), drive: avg(data.drive) });
        }

        // PR timeline
        const prTimeline = (prsRes.data || []).map(pr => ({
          exercise: pr.exercise_name,
          weight: pr.max_weight,
          reps: pr.max_reps,
          date: pr.achieved_at,
        }));

        // Body composition
        const bodyComposition = (bodyRes.data || []).map(e => ({
          date: e.entry_date,
          weight: e.weight_kg,
          bodyFat: e.body_fat_percent,
          usesImperial: e.uses_imperial,
        }));

        // Compliance: completed vs total workouts in period
        const totalWorkouts = (workoutsRes.data || []).length;
        const completedWorkouts = (workoutsRes.data || []).filter(w => w.is_completed).length;
        const compliance = totalWorkouts > 0 ? Math.round(completedWorkouts / totalWorkouts * 100) : 0;

        return new Response(JSON.stringify({
          weeklyVolume,
          weeklyReadiness,
          prTimeline,
          bodyComposition,
          compliance,
          totalWorkouts,
          completedWorkouts,
        }), { headers: corsHeaders });
      }

      // ==================== BATCH ASSIGN TEMPLATE ====================
      case "batch_assign_template": {
        const { templateId, targetUserIds, startDate, trainingDays } = body;
        const results: { userId: string; success: boolean; error?: string }[] = [];

        const { data: template } = await serviceClient.from("coach_program_templates").select("*").eq("id", templateId).single();
        if (!template) throw new Error("Template not found");
        const { data: templateWorkouts } = await serviceClient.from("coach_template_workouts").select("*").eq("template_id", templateId).order("week_number").order("day_number");
        if (!templateWorkouts?.length) throw new Error("Template has no workouts");

        for (const targetUserId of targetUserIds) {
          try {
            // Get client PRs
            const { data: clientPRs } = await serviceClient.from("personal_records").select("exercise_name, max_weight").eq("user_id", targetUserId);
            const prMap: Record<string, number> = {};
            for (const pr of (clientPRs || [])) {
              const key = pr.exercise_name.toLowerCase();
              if (!prMap[key] || pr.max_weight > prMap[key]) prMap[key] = pr.max_weight;
            }

            await serviceClient.from("coach_client_assignments").insert({
              coach_id: adminUserId, client_user_id: targetUserId, template_id: templateId, start_date: startDate, status: "active",
            });

            const days = trainingDays || [1, 3, 5];
            const currentDate = new Date(startDate + "T12:00:00");
            const weekMap: Record<number, any[]> = {};
            for (const tw of templateWorkouts) {
              if (!weekMap[tw.week_number]) weekMap[tw.week_number] = [];
              weekMap[tw.week_number].push(tw);
            }

            for (let week = 1; week <= template.duration_weeks; week++) {
              const weekWorkouts = weekMap[week] || [];
              for (const tw of weekWorkouts) {
                while (currentDate.getDay() === 0 || !days.includes(currentDate.getDay())) {
                  currentDate.setDate(currentDate.getDate() + 1);
                }
                const resolvedExercises = (tw.exercises as any[]).map((ex: any) => {
                  if (ex.percentage && ex.name) {
                    const pr = prMap[ex.name.toLowerCase()];
                    if (pr) return { ...ex, resolvedWeight: Math.round((pr * ex.percentage / 100) / 2.5) * 2.5 };
                  }
                  return ex;
                });
                const dateStr = currentDate.toISOString().split("T")[0];
                const { data: newWorkout } = await serviceClient.from("workouts").insert({
                  user_id: targetUserId, workout_name: tw.workout_name, date: dateStr, is_completed: false, notes: tw.notes || "",
                }).select().single();
                if (newWorkout) {
                  for (let i = 0; i < resolvedExercises.length; i++) {
                    const ex = resolvedExercises[i];
                    const { data: newEx } = await serviceClient.from("workout_exercises").insert({
                      workout_id: newWorkout.id, exercise_name: ex.name, order_index: i, exercise_type: ex.exercise_type || "strength", notes: ex.notes || "",
                    }).select().single();
                    if (newEx) {
                      for (let s = 1; s <= (ex.sets || 3); s++) {
                        await serviceClient.from("exercise_sets").insert({
                          exercise_id: newEx.id, set_number: s, weight: ex.resolvedWeight || null,
                          reps: ex.reps ? parseInt(ex.reps) || null : null, rpe: ex.rpe || null, rir: ex.rir ?? null, set_type: ex.set_type || "working",
                        });
                      }
                    }
                  }
                }
                currentDate.setDate(currentDate.getDate() + 1);
              }
            }
            results.push({ userId: targetUserId, success: true });
          } catch (e) {
            results.push({ userId: targetUserId, success: false, error: e.message });
          }
        }
        return new Response(JSON.stringify({ results }), { headers: corsHeaders });
      }

      // ==================== COACHING ANALYTICS DASHBOARD ====================
      case "get_coaching_dashboard": {
        const { userId, fromDate, toDate } = body;
        if (!userId) throw new Error("userId required");

        const from = fromDate || new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];
        const to = toDate || new Date().toISOString().split("T")[0];

        // Weekly volume from view
        const { data: volumeData, error: volErr } = await serviceClient
          .from("weekly_volume_summary")
          .select("*")
          .eq("user_id", userId)
          .gte("week_start", from)
          .lte("week_start", to)
          .order("week_start", { ascending: true });
        if (volErr) throw volErr;

        // Weekly RIR from view
        const { data: rirData, error: rirErr } = await serviceClient
          .from("weekly_rir_summary")
          .select("*")
          .eq("user_id", userId)
          .gte("week_start", from)
          .lte("week_start", to)
          .order("week_start", { ascending: true });
        if (rirErr) throw rirErr;

        // Compliance: completed vs total workouts in range
        const { data: allWorkouts, error: compErr } = await serviceClient
          .from("workouts")
          .select("id, is_completed")
          .eq("user_id", userId)
          .gte("date", from)
          .lte("date", to);
        if (compErr) throw compErr;

        const total = allWorkouts?.length || 0;
        const completed = allWorkouts?.filter((w: any) => w.is_completed).length || 0;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return new Response(JSON.stringify({
          weeklyVolume: volumeData || [],
          weeklyRir: rirData || [],
          compliance: { completed, total, incomplete: total - completed, percentage },
        }), { headers: corsHeaders });
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
