-- 1. BEFORE trigger now only stamps the estimated 1RM on the row.
CREATE OR REPLACE FUNCTION public.set_estimated_1rm()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_completed IS TRUE AND NEW.set_type = 'working'
     AND NEW.weight IS NOT NULL AND NEW.weight > 0
     AND NEW.reps IS NOT NULL AND NEW.reps > 0 THEN
    NEW.estimated_1rm := public.calc_estimated_1rm(NEW.weight, NEW.reps);
  END IF;
  RETURN NEW;
END;
$$;

-- 2. PR upsert moves to AFTER, so NEW.id already exists for the FK.
CREATE OR REPLACE FUNCTION public.sync_personal_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_name text;
  v_e1rm numeric;
BEGIN
  IF NEW.is_completed IS NOT TRUE OR NEW.set_type <> 'working'
     OR NEW.weight IS NULL OR NEW.weight <= 0
     OR NEW.reps IS NULL OR NEW.reps <= 0 THEN
    RETURN NULL;
  END IF;

  SELECT w.user_id, we.exercise_name INTO v_user, v_name
  FROM public.workout_exercises we
  JOIN public.workouts w ON w.id = we.workout_id
  WHERE we.id = NEW.exercise_id;

  IF v_user IS NULL OR v_name IS NULL THEN RETURN NULL; END IF;

  v_e1rm := public.calc_estimated_1rm(NEW.weight, NEW.reps);

  INSERT INTO public.personal_records
    (user_id, exercise_name, max_weight, max_reps, reps_at_max_weight, unit, estimated_1rm, set_id, achieved_at)
  VALUES (v_user, v_name, NEW.weight, NEW.reps, NEW.reps, NEW.unit, v_e1rm, NEW.id, now())
  ON CONFLICT (user_id, lower(exercise_name)) DO UPDATE SET
    max_weight = GREATEST(public.personal_records.max_weight, EXCLUDED.max_weight),
    max_reps = GREATEST(COALESCE(public.personal_records.max_reps,0), COALESCE(EXCLUDED.max_reps,0)),
    reps_at_max_weight = CASE WHEN EXCLUDED.max_weight > public.personal_records.max_weight
                              THEN EXCLUDED.reps_at_max_weight ELSE public.personal_records.reps_at_max_weight END,
    estimated_1rm = GREATEST(COALESCE(public.personal_records.estimated_1rm,0), COALESCE(EXCLUDED.estimated_1rm,0)),
    set_id = CASE WHEN EXCLUDED.max_weight > public.personal_records.max_weight
                  THEN EXCLUDED.set_id ELSE public.personal_records.set_id END,
    achieved_at = CASE WHEN EXCLUDED.max_weight > public.personal_records.max_weight
                  THEN EXCLUDED.achieved_at ELSE public.personal_records.achieved_at END;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS exercise_sets_sync_pr ON public.exercise_sets;
CREATE TRIGGER exercise_sets_set_e1rm
  BEFORE INSERT OR UPDATE ON public.exercise_sets
  FOR EACH ROW EXECUTE FUNCTION public.set_estimated_1rm();
CREATE TRIGGER exercise_sets_sync_pr
  AFTER INSERT OR UPDATE ON public.exercise_sets
  FOR EACH ROW EXECUTE FUNCTION public.sync_personal_record();

REVOKE EXECUTE ON FUNCTION public.set_estimated_1rm() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.sync_personal_record() FROM authenticated, anon;