
-- ============ ENUM TYPES ============
DO $$ BEGIN CREATE TYPE public.service_tier AS ENUM ('tier_1','tier_2'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.relationship_status AS ENUM ('active','archived','pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.invite_status AS ENUM ('pending','accepted','revoked','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.weight_unit AS ENUM ('kg','lb'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.workout_format AS ENUM ('straight','superset','circuit','interval','amrap','emom','for_time','conditioning'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.log_source AS ENUM ('manual','voice','photo','database'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.message_kind AS ENUM ('text','voice'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ COACH-CLIENT RELATIONSHIPS ============
CREATE TABLE IF NOT EXISTS public.coach_client_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  client_id uuid NOT NULL,
  service_tier public.service_tier NOT NULL DEFAULT 'tier_1',
  status public.relationship_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  restored_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, client_id)
);
CREATE INDEX IF NOT EXISTS ccr_client_idx ON public.coach_client_relationships (client_id);
CREATE INDEX IF NOT EXISTS ccr_coach_status_idx ON public.coach_client_relationships (coach_id, status);
GRANT SELECT, INSERT, UPDATE ON public.coach_client_relationships TO authenticated;
GRANT ALL ON public.coach_client_relationships TO service_role;
ALTER TABLE public.coach_client_relationships ENABLE ROW LEVEL SECURITY;

-- ============ CORE ACCESS FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.is_coach_of(_coach_id uuid, _client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_client_relationships r
    WHERE r.coach_id = _coach_id AND r.client_id = _client_id
      AND r.status IN ('active','archived')
  )
$$;

-- Access to a client's data: their coach, or an admin (Andy today).
CREATE OR REPLACE FUNCTION public.has_client_access(_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_coach_of(auth.uid(), _client_id)
      OR public.has_role(auth.uid(), 'admin'::app_role)
$$;

CREATE OR REPLACE FUNCTION public.is_any_coach(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.coach_client_relationships r WHERE r.coach_id = _user_id)
$$;

-- Two users share a coach (used for limited profile visibility).
CREATE OR REPLACE FUNCTION public.shares_coach_with(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_client_relationships ra
    JOIN public.coach_client_relationships rb ON rb.coach_id = ra.coach_id
    WHERE ra.client_id = _a AND rb.client_id = _b
  )
$$;

CREATE POLICY "Clients can view their own relationship"
  ON public.coach_client_relationships FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR coach_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Coaches manage their relationships insert"
  ON public.coach_client_relationships FOR INSERT TO authenticated
  WITH CHECK (coach_id = auth.uid() AND public.is_any_coach(auth.uid()));
CREATE POLICY "Coaches manage their relationships update"
  ON public.coach_client_relationships FOR UPDATE TO authenticated
  USING (coach_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (coach_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER ccr_updated_at BEFORE UPDATE ON public.coach_client_relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CLIENT INVITES ============
CREATE TABLE IF NOT EXISTS public.client_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  service_tier public.service_tier NOT NULL DEFAULT 'tier_1',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  status public.invite_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz NOT NULL DEFAULT now(),
  resent_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_invites_coach_idx ON public.client_invites (coach_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS client_invites_open_email_idx
  ON public.client_invites (coach_id, lower(email)) WHERE status = 'pending';
GRANT SELECT, INSERT, UPDATE ON public.client_invites TO authenticated;
GRANT ALL ON public.client_invites TO service_role;
ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches view their invites" ON public.client_invites FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Coaches create invites" ON public.client_invites FOR INSERT TO authenticated
  WITH CHECK (coach_id = auth.uid() AND public.is_any_coach(auth.uid()));
CREATE POLICY "Coaches update their invites" ON public.client_invites FOR UPDATE TO authenticated
  USING (coach_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (coach_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER client_invites_updated_at BEFORE UPDATE ON public.client_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROGRAM AVAILABILITY (Tier 2 curated / Tier 1 individual) ============
CREATE TABLE IF NOT EXISTS public.program_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  service_tier public.service_tier,
  client_id uuid,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (service_tier IS NOT NULL OR client_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS program_availability_lookup_idx ON public.program_availability (program_id, service_tier, client_id);
GRANT SELECT ON public.program_availability TO authenticated;
GRANT ALL ON public.program_availability TO service_role;
ALTER TABLE public.program_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage program availability" ON public.program_availability FOR ALL TO authenticated
  USING (coach_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (coach_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Clients view programs available to them" ON public.program_availability FOR SELECT TO authenticated
  USING (
    is_available AND (
      client_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.coach_client_relationships r
        WHERE r.client_id = auth.uid() AND r.coach_id = program_availability.coach_id
          AND r.status = 'active' AND r.service_tier = program_availability.service_tier
      )
    )
  );

-- ============ TRAINING SCHEMA ADDITIONS ============
ALTER TABLE public.exercise_sets
  ADD COLUMN IF NOT EXISTS unit public.weight_unit NOT NULL DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS tempo text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_prescribed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prescribed_reps integer,
  ADD COLUMN IF NOT EXISTS prescribed_weight numeric,
  ADD COLUMN IF NOT EXISTS prescribed_rpe numeric,
  ADD COLUMN IF NOT EXISTS estimated_1rm numeric;

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS format public.workout_format NOT NULL DEFAULT 'straight',
  ADD COLUMN IF NOT EXISTS group_id uuid,
  ADD COLUMN IF NOT EXISTS group_order integer,
  ADD COLUMN IF NOT EXISTS group_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS coach_instructions text;

ALTER TABLE public.conditioning_sets
  ADD COLUMN IF NOT EXISTS modality text,
  ADD COLUMN IF NOT EXISTS avg_watts numeric,
  ADD COLUMN IF NOT EXISTS avg_speed numeric,
  ADD COLUMN IF NOT EXISTS speed_unit text,
  ADD COLUMN IF NOT EXISTS cadence_rpm numeric,
  ADD COLUMN IF NOT EXISTS max_heart_rate integer,
  ADD COLUMN IF NOT EXISTS hr_zone text,
  ADD COLUMN IF NOT EXISTS rpe numeric,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS target_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS target_distance numeric,
  ADD COLUMN IF NOT EXISTS target_watts numeric,
  ADD COLUMN IF NOT EXISTS target_hr_zone text,
  ADD COLUMN IF NOT EXISTS target_hr_min integer,
  ADD COLUMN IF NOT EXISTS target_hr_max integer;

ALTER TABLE public.personal_records
  ADD COLUMN IF NOT EXISTS unit public.weight_unit NOT NULL DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS estimated_1rm numeric,
  ADD COLUMN IF NOT EXISTS reps_at_max_weight integer;
CREATE UNIQUE INDEX IF NOT EXISTS personal_records_user_exercise_idx
  ON public.personal_records (user_id, lower(exercise_name));

-- estimated 1RM (Epley), only for sane completed working sets
CREATE OR REPLACE FUNCTION public.calc_estimated_1rm(_weight numeric, _reps integer)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _weight IS NULL OR _reps IS NULL OR _weight <= 0 OR _reps <= 0 OR _reps > 12 THEN NULL
    ELSE round((_weight * (1 + (_reps::numeric / 30)))::numeric, 1)
  END
$$;

CREATE OR REPLACE FUNCTION public.sync_personal_record()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid;
  v_name text;
  v_e1rm numeric;
BEGIN
  IF NEW.is_completed IS NOT TRUE OR NEW.set_type <> 'working'
     OR NEW.weight IS NULL OR NEW.weight <= 0
     OR NEW.reps IS NULL OR NEW.reps <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT w.user_id, we.exercise_name INTO v_user, v_name
  FROM public.workout_exercises we
  JOIN public.workouts w ON w.id = we.workout_id
  WHERE we.id = NEW.exercise_id;

  IF v_user IS NULL OR v_name IS NULL THEN RETURN NEW; END IF;

  NEW.estimated_1rm := public.calc_estimated_1rm(NEW.weight, NEW.reps);
  v_e1rm := NEW.estimated_1rm;

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

  RETURN NEW;
END;
$$;

CREATE TRIGGER exercise_sets_sync_pr
  BEFORE INSERT OR UPDATE ON public.exercise_sets
  FOR EACH ROW EXECUTE FUNCTION public.sync_personal_record();

-- ============ NUTRITION FOUNDATION ============
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fats_g numeric,
  fiber_g numeric,
  notes text,
  set_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, effective_from)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_targets TO authenticated;
GRANT ALL ON public.nutrition_targets TO service_role;
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or client nutrition targets" ON public.nutrition_targets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_client_access(user_id));
CREATE POLICY "Insert own or client nutrition targets" ON public.nutrition_targets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_client_access(user_id));
CREATE POLICY "Update own or client nutrition targets" ON public.nutrition_targets FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_client_access(user_id))
  WITH CHECK (user_id = auth.uid() OR public.has_client_access(user_id));
CREATE POLICY "Delete own nutrition targets" ON public.nutrition_targets FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_client_access(user_id));
CREATE TRIGGER nutrition_targets_updated_at BEFORE UPDATE ON public.nutrition_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_food_diary
  ADD COLUMN IF NOT EXISTS source public.log_source NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS photo_path text,
  ADD COLUMN IF NOT EXISTS transcript text,
  ADD COLUMN IF NOT EXISTS ai_estimate jsonb,
  ADD COLUMN IF NOT EXISTS is_confirmed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS coach_comment text,
  ADD COLUMN IF NOT EXISTS coach_reviewed_at timestamptz;

-- ============ PROGRESS ============
ALTER TABLE public.user_body_entries
  ADD COLUMN IF NOT EXISTS photo_paths text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS entry_source text;

-- ============ MESSAGING ============
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS kind public.message_kind NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS audio_path text,
  ADD COLUMN IF NOT EXISTS audio_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS context_type text,
  ADD COLUMN IF NOT EXISTS context_id uuid;

-- ============ COACH ACCESS TO CLIENT DATA (additive policies) ============
CREATE POLICY "Coaches can view client workouts" ON public.workouts FOR SELECT TO authenticated
  USING (public.has_client_access(user_id));
CREATE POLICY "Coaches can manage client workouts" ON public.workouts FOR INSERT TO authenticated
  WITH CHECK (public.has_client_access(user_id));
CREATE POLICY "Coaches can update client workouts" ON public.workouts FOR UPDATE TO authenticated
  USING (public.has_client_access(user_id)) WITH CHECK (public.has_client_access(user_id));

CREATE POLICY "Coaches can view client workout exercises" ON public.workout_exercises FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_exercises.workout_id AND public.has_client_access(w.user_id)));
CREATE POLICY "Coaches can manage client workout exercises" ON public.workout_exercises FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_exercises.workout_id AND public.has_client_access(w.user_id)));
CREATE POLICY "Coaches can update client workout exercises" ON public.workout_exercises FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_exercises.workout_id AND public.has_client_access(w.user_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_exercises.workout_id AND public.has_client_access(w.user_id)));

CREATE POLICY "Coaches can view client sets" ON public.exercise_sets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
                 WHERE we.id = exercise_sets.exercise_id AND public.has_client_access(w.user_id)));
CREATE POLICY "Coaches can insert client sets" ON public.exercise_sets FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
                 WHERE we.id = exercise_sets.exercise_id AND public.has_client_access(w.user_id)));
CREATE POLICY "Coaches can update client sets" ON public.exercise_sets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
                 WHERE we.id = exercise_sets.exercise_id AND public.has_client_access(w.user_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
                 WHERE we.id = exercise_sets.exercise_id AND public.has_client_access(w.user_id)));

CREATE POLICY "Coaches can view client conditioning" ON public.conditioning_sets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
                 WHERE we.id = conditioning_sets.exercise_id AND public.has_client_access(w.user_id)));
CREATE POLICY "Coaches can insert client conditioning" ON public.conditioning_sets FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
                 WHERE we.id = conditioning_sets.exercise_id AND public.has_client_access(w.user_id)));
CREATE POLICY "Coaches can update client conditioning" ON public.conditioning_sets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
                 WHERE we.id = conditioning_sets.exercise_id AND public.has_client_access(w.user_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
                 WHERE we.id = conditioning_sets.exercise_id AND public.has_client_access(w.user_id)));

CREATE POLICY "Coaches can view client food diary" ON public.user_food_diary FOR SELECT TO authenticated
  USING (public.has_client_access(user_id));
CREATE POLICY "Coaches can comment on client food diary" ON public.user_food_diary FOR UPDATE TO authenticated
  USING (public.has_client_access(user_id)) WITH CHECK (public.has_client_access(user_id));

CREATE POLICY "Coaches can view client nutrition data" ON public.user_nutrition_data FOR SELECT TO authenticated
  USING (public.has_client_access(user_id));
CREATE POLICY "Coaches can view client checkins" ON public.user_daily_checkins FOR SELECT TO authenticated
  USING (public.has_client_access(user_id));
CREATE POLICY "Coaches can view client body entries" ON public.user_body_entries FOR SELECT TO authenticated
  USING (public.has_client_access(user_id));
CREATE POLICY "Coaches can view client PRs" ON public.personal_records FOR SELECT TO authenticated
  USING (public.has_client_access(user_id));
CREATE POLICY "Coaches can view client calendar" ON public.user_calendar_workouts FOR SELECT TO authenticated
  USING (public.has_client_access(user_id));
CREATE POLICY "Coaches can manage client calendar" ON public.user_calendar_workouts FOR INSERT TO authenticated
  WITH CHECK (public.has_client_access(user_id));
CREATE POLICY "Coaches can update client calendar" ON public.user_calendar_workouts FOR UPDATE TO authenticated
  USING (public.has_client_access(user_id)) WITH CHECK (public.has_client_access(user_id));
CREATE POLICY "Coaches can view client enrollments" ON public.user_program_enrollments FOR SELECT TO authenticated
  USING (public.has_client_access(user_id));
CREATE POLICY "Coaches can manage client enrollments" ON public.user_program_enrollments FOR INSERT TO authenticated
  WITH CHECK (public.has_client_access(user_id));
CREATE POLICY "Coaches can update client enrollments" ON public.user_program_enrollments FOR UPDATE TO authenticated
  USING (public.has_client_access(user_id)) WITH CHECK (public.has_client_access(user_id));

-- ============ PROFILE VISIBILITY NARROWED ============
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.user_profiles;
CREATE POLICY "View own, coach, and shared-coach profiles" ON public.user_profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.has_role(auth.uid(),'admin'::app_role)
    OR public.is_coach_of(auth.uid(), id)
    OR public.is_coach_of(id, auth.uid())
    OR public.shares_coach_with(auth.uid(), id)
  );
