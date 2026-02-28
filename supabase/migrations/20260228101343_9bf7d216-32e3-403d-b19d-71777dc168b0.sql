CREATE OR REPLACE FUNCTION public.update_workout_volume()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  workout_uuid uuid;
BEGIN
  SELECT we.workout_id INTO workout_uuid
  FROM public.workout_exercises we
  WHERE we.id = COALESCE(NEW.exercise_id, OLD.exercise_id);
  
  UPDATE public.workouts w
  SET total_volume = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN s.duration_seconds IS NOT NULL AND s.duration_seconds > 0 
        THEN COALESCE(s.weight, 0) * (s.duration_seconds::numeric / 30)
        ELSE COALESCE(s.weight, 0) * COALESCE(s.reps, 0)
      END
    ), 0)
    FROM public.exercise_sets s
    JOIN public.workout_exercises e ON s.exercise_id = e.id
    WHERE e.workout_id = workout_uuid AND s.is_completed = true AND s.set_type = 'working'
  )
  WHERE w.id = workout_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;