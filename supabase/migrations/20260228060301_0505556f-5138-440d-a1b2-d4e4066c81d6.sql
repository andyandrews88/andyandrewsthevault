
-- Coach Program Templates
CREATE TABLE public.coach_program_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  duration_weeks integer NOT NULL DEFAULT 4,
  days_per_week integer NOT NULL DEFAULT 4,
  category text NOT NULL DEFAULT 'strength',
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_program_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access templates" ON public.coach_program_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Coach Template Workouts
CREATE TABLE public.coach_template_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.coach_program_templates(id) ON DELETE CASCADE,
  week_number integer NOT NULL DEFAULT 1,
  day_number integer NOT NULL DEFAULT 1,
  workout_name text NOT NULL DEFAULT 'Workout',
  notes text DEFAULT '',
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_template_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access template workouts" ON public.coach_template_workouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Coach Client Assignments
CREATE TABLE public.coach_client_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  template_id uuid REFERENCES public.coach_program_templates(id) ON DELETE SET NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access assignments" ON public.coach_client_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Coach Touchpoints
CREATE TABLE public.coach_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  touchpoint_type text NOT NULL DEFAULT 'note',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access touchpoints" ON public.coach_touchpoints FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger for templates
CREATE TRIGGER update_coach_templates_updated_at
  BEFORE UPDATE ON public.coach_program_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
