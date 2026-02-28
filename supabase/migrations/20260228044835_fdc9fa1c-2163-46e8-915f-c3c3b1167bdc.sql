
ALTER TABLE exercise_sets ADD COLUMN set_type text NOT NULL DEFAULT 'working';
ALTER TABLE workout_exercises ADD COLUMN superset_group text DEFAULT NULL;

-- Update the volume trigger to only count working sets
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
    SELECT COALESCE(SUM(s.weight * s.reps), 0)
    FROM public.exercise_sets s
    JOIN public.workout_exercises e ON s.exercise_id = e.id
    WHERE e.workout_id = workout_uuid AND s.is_completed = true AND s.set_type = 'working'
  )
  WHERE w.id = workout_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
