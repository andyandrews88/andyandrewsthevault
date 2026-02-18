
-- Create programs table (metadata)
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'strength',
  duration_weeks integer NOT NULL DEFAULT 12,
  days_per_week integer NOT NULL,
  difficulty text NOT NULL DEFAULT 'intermediate',
  program_style text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create program_workouts table (templates)
CREATE TABLE public.program_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  day_number integer NOT NULL,
  workout_name text NOT NULL,
  exercises jsonb NOT NULL DEFAULT '[]',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_program_enrollments table
CREATE TABLE public.user_program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  training_days integer[] NOT NULL DEFAULT '{1,3,5}',
  status text NOT NULL DEFAULT 'active',
  addon_placement text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

-- Create user_calendar_workouts table
CREATE TABLE public.user_calendar_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  enrollment_id uuid NOT NULL REFERENCES public.user_program_enrollments(id) ON DELETE CASCADE,
  program_workout_id uuid NOT NULL REFERENCES public.program_workouts(id),
  scheduled_date date NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: programs (public read, admin write)
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Admins can insert programs" ON public.programs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update programs" ON public.programs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete programs" ON public.programs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: program_workouts (public read, admin write)
ALTER TABLE public.program_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view program workouts" ON public.program_workouts FOR SELECT USING (true);
CREATE POLICY "Admins can insert program workouts" ON public.program_workouts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update program workouts" ON public.program_workouts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete program workouts" ON public.program_workouts FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: user_program_enrollments (user-scoped)
ALTER TABLE public.user_program_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own enrollments" ON public.user_program_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own enrollments" ON public.user_program_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own enrollments" ON public.user_program_enrollments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own enrollments" ON public.user_program_enrollments FOR DELETE USING (auth.uid() = user_id);

-- RLS: user_calendar_workouts (user-scoped)
ALTER TABLE public.user_calendar_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own calendar workouts" ON public.user_calendar_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar workouts" ON public.user_calendar_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calendar workouts" ON public.user_calendar_workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calendar workouts" ON public.user_calendar_workouts FOR DELETE USING (auth.uid() = user_id);

-- Seed programs
INSERT INTO public.programs (name, slug, description, category, duration_weeks, days_per_week, difficulty, program_style, is_active) VALUES
(
  'Wendler 5/3/1',
  'wendler',
  'The gold standard of strength programming. Built around four main lifts — squat, deadlift, bench, and overhead press — with progressive monthly loading cycles. Simple, effective, proven.',
  'strength',
  12,
  4,
  'intermediate',
  'wendler',
  true
),
(
  'Functional Bodybuilding',
  'fbb',
  'Tempo-based hypertrophy training that builds both size and movement quality. Combines controlled eccentric work with accessory progressions designed to look good and perform better.',
  'functional',
  12,
  4,
  'intermediate',
  'fbb',
  true
),
(
  'Olympic Weightlifting Foundations',
  'oly',
  'A structured 12-week introduction to the snatch and clean & jerk. Covers positional work, pulling mechanics, and overhead strength to build a solid technical foundation.',
  'oly',
  12,
  4,
  'intermediate',
  'oly',
  true
),
(
  'Strength Foundation',
  'foundation',
  'A beginner-friendly 3-day program focused on the fundamental movement patterns: squat, hinge, push, and pull. Perfect for building your base before moving to more advanced programming.',
  'strength',
  12,
  3,
  'beginner',
  'foundation',
  true
),
(
  'Running Add-on',
  'running',
  'A structured 12-week running progression designed to complement your strength training. Builds aerobic base, improves lactate threshold, and develops running economy without interfering with recovery.',
  'conditioning',
  12,
  3,
  'beginner',
  'running',
  true
),
(
  'Rowing Add-on',
  'rowing',
  'A 12-week rowing-based conditioning add-on. Develops aerobic capacity and power endurance through progressive interval work, steady-state rowing, and technique drills on the erg.',
  'conditioning',
  12,
  3,
  'beginner',
  'rowing',
  true
);

-- Seed program_workouts for Wendler (representative 12-week template, 4 days/week)
DO $$
DECLARE
  wendler_id uuid;
  fbb_id uuid;
  oly_id uuid;
  foundation_id uuid;
  running_id uuid;
  rowing_id uuid;
  w integer;
  d integer;
  pct_sets text;
BEGIN
  SELECT id INTO wendler_id FROM public.programs WHERE slug = 'wendler';
  SELECT id INTO fbb_id FROM public.programs WHERE slug = 'fbb';
  SELECT id INTO oly_id FROM public.programs WHERE slug = 'oly';
  SELECT id INTO foundation_id FROM public.programs WHERE slug = 'foundation';
  SELECT id INTO running_id FROM public.programs WHERE slug = 'running';
  SELECT id INTO rowing_id FROM public.programs WHERE slug = 'rowing';

  -- Insert Wendler workouts for all 12 weeks
  FOR w IN 1..12 LOOP
    -- Determine the wave (1=5s, 2=3s, 3=1+, deload every 4th in 3-week wave pattern)
    -- Week pattern cycles: 1→5/5/5+, 2→3/3/3+, 3→5/3/1+, (4=deload), repeat
    -- Day 1: Squat
    INSERT INTO public.program_workouts (program_id, week_number, day_number, workout_name, exercises, notes)
    VALUES (wendler_id, w, 1,
      'Squat Day',
      jsonb_build_array(
        jsonb_build_object('name', 'Back Squat', 'sets', 3, 'reps', CASE (w % 3) WHEN 1 THEN '5/5/5+' WHEN 2 THEN '3/3/3+' ELSE '5/3/1+' END, 'percentage_of_1rm', CASE (w % 3) WHEN 1 THEN '65/75/85' WHEN 2 THEN '70/80/90' ELSE '75/85/95' END, 'notes', 'Last set is AMRAP. Log your reps.', 'rest_seconds', 180),
        jsonb_build_object('name', 'Romanian Deadlift', 'sets', 3, 'reps', '10', 'notes', 'Supplemental: 3x10 @ 50% of squat TM', 'rest_seconds', 90),
        jsonb_build_object('name', 'Leg Press', 'sets', 3, 'reps', '10-15', 'notes', 'Accessory', 'rest_seconds', 90),
        jsonb_build_object('name', 'Leg Curl', 'sets', 3, 'reps', '10-15', 'notes', 'Accessory', 'rest_seconds', 60),
        jsonb_build_object('name', 'Plank', 'sets', 3, 'reps', '60s', 'notes', 'Core work', 'rest_seconds', 60)
      ),
      'Focus on bar speed on working sets. Log your AMRAP reps.'
    );
    -- Day 2: Bench
    INSERT INTO public.program_workouts (program_id, week_number, day_number, workout_name, exercises, notes)
    VALUES (wendler_id, w, 2,
      'Bench Press Day',
      jsonb_build_array(
        jsonb_build_object('name', 'Bench Press', 'sets', 3, 'reps', CASE (w % 3) WHEN 1 THEN '5/5/5+' WHEN 2 THEN '3/3/3+' ELSE '5/3/1+' END, 'percentage_of_1rm', CASE (w % 3) WHEN 1 THEN '65/75/85' WHEN 2 THEN '70/80/90' ELSE '75/85/95' END, 'notes', 'Last set AMRAP', 'rest_seconds', 180),
        jsonb_build_object('name', 'Dumbbell Bench Press', 'sets', 3, 'reps', '10', 'notes', 'Supplemental', 'rest_seconds', 90),
        jsonb_build_object('name', 'Dumbbell Row', 'sets', 3, 'reps', '10', 'notes', 'Accessory', 'rest_seconds', 90),
        jsonb_build_object('name', 'Face Pull', 'sets', 3, 'reps', '15', 'notes', 'Shoulder health', 'rest_seconds', 60),
        jsonb_build_object('name', 'Tricep Pushdown', 'sets', 3, 'reps', '15', 'notes', 'Accessory', 'rest_seconds', 60)
      ),
      'Keep rest times consistent. Control the descent on bench.'
    );
    -- Day 3: Deadlift
    INSERT INTO public.program_workouts (program_id, week_number, day_number, workout_name, exercises, notes)
    VALUES (wendler_id, w, 3,
      'Deadlift Day',
      jsonb_build_array(
        jsonb_build_object('name', 'Deadlift', 'sets', 3, 'reps', CASE (w % 3) WHEN 1 THEN '5/5/5+' WHEN 2 THEN '3/3/3+' ELSE '5/3/1+' END, 'percentage_of_1rm', CASE (w % 3) WHEN 1 THEN '65/75/85' WHEN 2 THEN '70/80/90' ELSE '75/85/95' END, 'notes', 'Last set AMRAP. Conventional or sumo.', 'rest_seconds', 240),
        jsonb_build_object('name', 'Front Squat', 'sets', 3, 'reps', '10', 'notes', 'Supplemental', 'rest_seconds', 120),
        jsonb_build_object('name', 'Pull-up', 'sets', 3, 'reps', 'Max', 'notes', 'Bodyweight, add weight if 10+', 'rest_seconds', 90),
        jsonb_build_object('name', 'Hanging Leg Raise', 'sets', 3, 'reps', '15', 'notes', 'Core', 'rest_seconds', 60),
        jsonb_build_object('name', 'Farmer Carry', 'sets', 3, 'reps', '40m', 'notes', 'Loaded carry', 'rest_seconds', 90)
      ),
      'Do not grind deadlifts. If form breaks, stop the AMRAP.'
    );
    -- Day 4: Overhead Press
    INSERT INTO public.program_workouts (program_id, week_number, day_number, workout_name, exercises, notes)
    VALUES (wendler_id, w, 4,
      'Overhead Press Day',
      jsonb_build_array(
        jsonb_build_object('name', 'Overhead Press', 'sets', 3, 'reps', CASE (w % 3) WHEN 1 THEN '5/5/5+' WHEN 2 THEN '3/3/3+' ELSE '5/3/1+' END, 'percentage_of_1rm', CASE (w % 3) WHEN 1 THEN '65/75/85' WHEN 2 THEN '70/80/90' ELSE '75/85/95' END, 'notes', 'Strict press, no leg drive', 'rest_seconds', 180),
        jsonb_build_object('name', 'Dumbbell Overhead Press', 'sets', 3, 'reps', '10', 'notes', 'Supplemental', 'rest_seconds', 90),
        jsonb_build_object('name', 'Chin-up', 'sets', 3, 'reps', 'Max', 'notes', 'Supinated grip', 'rest_seconds', 90),
        jsonb_build_object('name', 'Lateral Raise', 'sets', 3, 'reps', '15', 'notes', 'Accessory', 'rest_seconds', 60),
        jsonb_build_object('name', 'Barbell Curl', 'sets', 3, 'reps', '10', 'notes', 'Accessory', 'rest_seconds', 60)
      ),
      'Brace the core, squeeze glutes on every press rep.'
    );
  END LOOP;

  -- Seed FBB workouts (4 days/week, 12 weeks, tempo-based)
  FOR w IN 1..12 LOOP
    INSERT INTO public.program_workouts (program_id, week_number, day_number, workout_name, exercises, notes)
    VALUES (fbb_id, w, 1, 'Lower Body A',
      jsonb_build_array(
        jsonb_build_object('name', 'Back Squat', 'sets', 4, 'reps', '8', 'tempo', '30X1', 'notes', 'Build to challenging weight', 'rest_seconds', 120),
        jsonb_build_object('name', 'Bulgarian Split Squat', 'sets', 3, 'reps', '10 each', 'tempo', '20X1', 'notes', 'Rear foot elevated', 'rest_seconds', 90),
        jsonb_build_object('name', 'Nordic Curl', 'sets', 3, 'reps', '6-8', 'tempo', '50X0', 'notes', 'Eccentric focus', 'rest_seconds', 90),
        jsonb_build_object('name', 'Calf Raise', 'sets', 3, 'reps', '15', 'tempo', '2011', 'notes', 'Full ROM', 'rest_seconds', 60),
        jsonb_build_object('name', 'Copenhagen Plank', 'sets', 3, 'reps', '20s each', 'notes', 'Hip adductor stability', 'rest_seconds', 60)
      ),
      'Keep tempo strict — this is where the gains come from.'
    ),
    (fbb_id, w, 2, 'Upper Body Push',
      jsonb_build_array(
        jsonb_build_object('name', 'Incline Dumbbell Press', 'sets', 4, 'reps', '10', 'tempo', '30X1', 'notes', 'Full stretch at bottom', 'rest_seconds', 90),
        jsonb_build_object('name', 'Cable Fly', 'sets', 3, 'reps', '12', 'tempo', '2011', 'notes', 'Feel the stretch', 'rest_seconds', 60),
        jsonb_build_object('name', 'Overhead Press', 'sets', 3, 'reps', '10', 'tempo', '20X1', 'notes', 'Dumbbell or barbell', 'rest_seconds', 90),
        jsonb_build_object('name', 'Lateral Raise', 'sets', 3, 'reps', '15', 'tempo', '20X0', 'notes', 'Control the descent', 'rest_seconds', 60),
        jsonb_build_object('name', 'Tricep Rope Pushdown', 'sets', 3, 'reps', '15', 'tempo', '2010', 'notes', 'Full extension', 'rest_seconds', 60)
      ),
      'Tempo is non-negotiable. If you can''t hold it, drop the weight.'
    ),
    (fbb_id, w, 3, 'Lower Body B',
      jsonb_build_array(
        jsonb_build_object('name', 'Romanian Deadlift', 'sets', 4, 'reps', '10', 'tempo', '31X1', 'notes', 'Hinge at hips, feel hamstrings', 'rest_seconds', 120),
        jsonb_build_object('name', 'Leg Press', 'sets', 3, 'reps', '12', 'tempo', '30X1', 'notes', 'Full ROM', 'rest_seconds', 90),
        jsonb_build_object('name', 'Single-Leg Deadlift', 'sets', 3, 'reps', '10 each', 'tempo', '20X1', 'notes', 'Dumbbell, balance focus', 'rest_seconds', 75),
        jsonb_build_object('name', 'Seated Leg Curl', 'sets', 3, 'reps', '15', 'tempo', '2011', 'notes', 'Heel toward glute', 'rest_seconds', 60),
        jsonb_build_object('name', 'Ab Wheel Rollout', 'sets', 3, 'reps', '10', 'notes', 'Core stability', 'rest_seconds', 60)
      ),
      'Hip hinge is the movement pattern of the day. Own it.'
    ),
    (fbb_id, w, 4, 'Upper Body Pull',
      jsonb_build_array(
        jsonb_build_object('name', 'Weighted Pull-up', 'sets', 4, 'reps', '6-8', 'tempo', '30X1', 'notes', 'Full hang at bottom', 'rest_seconds', 120),
        jsonb_build_object('name', 'Chest-Supported Row', 'sets', 3, 'reps', '10', 'tempo', '20X1', 'notes', 'Squeeze at top', 'rest_seconds', 90),
        jsonb_build_object('name', 'Cable Row', 'sets', 3, 'reps', '12', 'tempo', '2011', 'notes', 'Elbows drive back', 'rest_seconds', 75),
        jsonb_build_object('name', 'Face Pull', 'sets', 3, 'reps', '15', 'notes', 'External rotation, shoulder health', 'rest_seconds', 60),
        jsonb_build_object('name', 'Hammer Curl', 'sets', 3, 'reps', '12', 'tempo', '2011', 'notes', 'Neutral grip', 'rest_seconds', 60)
      ),
      'Think vertical and horizontal pulling. Balance your shoulder health.'
    );
  END LOOP;

  -- Seed Oly workouts (4 days/week, 12 weeks)
  FOR w IN 1..12 LOOP
    INSERT INTO public.program_workouts (program_id, week_number, day_number, workout_name, exercises, notes)
    VALUES
    (oly_id, w, 1, 'Snatch Focus',
      jsonb_build_array(
        jsonb_build_object('name', 'Hang Power Snatch', 'sets', 5, 'reps', '3', 'notes', CASE WHEN w <= 4 THEN 'Light: 60-70% 1RM' WHEN w <= 8 THEN 'Moderate: 70-80% 1RM' ELSE 'Heavy: 80-90% 1RM' END, 'rest_seconds', 120),
        jsonb_build_object('name', 'Overhead Squat', 'sets', 4, 'reps', '5', 'notes', 'Work on positional stability', 'rest_seconds', 90),
        jsonb_build_object('name', 'Snatch Pull', 'sets', 3, 'reps', '5', 'notes', '90-100% of snatch', 'rest_seconds', 120),
        jsonb_build_object('name', 'Back Squat', 'sets', 4, 'reps', '5', 'notes', '75-85% 1RM', 'rest_seconds', 180)
      ),
      'Focus on pulling mechanics and catching the bar in balance.'
    ),
    (oly_id, w, 2, 'Clean & Jerk Focus',
      jsonb_build_array(
        jsonb_build_object('name', 'Hang Power Clean', 'sets', 5, 'reps', '3', 'notes', CASE WHEN w <= 4 THEN '65-75% 1RM' WHEN w <= 8 THEN '75-82% 1RM' ELSE '82-90% 1RM' END, 'rest_seconds', 120),
        jsonb_build_object('name', 'Push Jerk', 'sets', 4, 'reps', '4', 'notes', 'From rack, 70-80%', 'rest_seconds', 90),
        jsonb_build_object('name', 'Front Squat', 'sets', 4, 'reps', '5', 'notes', '80-90% of back squat', 'rest_seconds', 120),
        jsonb_build_object('name', 'Romanian Deadlift', 'sets', 3, 'reps', '8', 'notes', 'Strengthen the pull', 'rest_seconds', 90)
      ),
      'Clean receiving position is priority. Rack the bar on the shoulders.'
    ),
    (oly_id, w, 3, 'Positional Work & Strength',
      jsonb_build_array(
        jsonb_build_object('name', 'Snatch Balance', 'sets', 4, 'reps', '3', 'notes', 'Drop under fast', 'rest_seconds', 90),
        jsonb_build_object('name', 'Clean Deadlift', 'sets', 4, 'reps', '5', 'notes', '100-110% of clean', 'rest_seconds', 120),
        jsonb_build_object('name', 'Back Squat', 'sets', 5, 'reps', '3', 'notes', 'Heavy day', 'rest_seconds', 180),
        jsonb_build_object('name', 'Strict Press', 'sets', 3, 'reps', '8', 'notes', 'Overhead strength', 'rest_seconds', 90)
      ),
      'Positional drilling today. Perfection over load.'
    ),
    (oly_id, w, 4, 'Competition Lifts & Accessories',
      jsonb_build_array(
        jsonb_build_object('name', 'Snatch', 'sets', 4, 'reps', '2', 'notes', CASE WHEN w <= 4 THEN 'Building technique @ 70%' WHEN w <= 8 THEN 'Working @ 80-85%' ELSE 'Near max singles @ 88-95%' END, 'rest_seconds', 180),
        jsonb_build_object('name', 'Clean & Jerk', 'sets', 4, 'reps', '1+1', 'notes', 'Same percentage as snatch', 'rest_seconds', 180),
        jsonb_build_object('name', 'Pull-up', 'sets', 3, 'reps', '8', 'notes', 'Upper back strength', 'rest_seconds', 75),
        jsonb_build_object('name', 'GHD Sit-up', 'sets', 3, 'reps', '15', 'notes', 'Core', 'rest_seconds', 60)
      ),
      'Full lifts today. Trust the technique work from the week.'
    );
  END LOOP;

  -- Seed Foundation workouts (3 days/week, 12 weeks)
  FOR w IN 1..12 LOOP
    INSERT INTO public.program_workouts (program_id, week_number, day_number, workout_name, exercises, notes)
    VALUES
    (foundation_id, w, 1, 'Push + Core',
      jsonb_build_array(
        jsonb_build_object('name', 'Goblet Squat', 'sets', 3, 'reps', '10', 'notes', 'Learn the squat pattern', 'rest_seconds', 90),
        jsonb_build_object('name', 'Dumbbell Bench Press', 'sets', 3, 'reps', '10', 'notes', 'Control the weight', 'rest_seconds', 90),
        jsonb_build_object('name', 'Dumbbell Overhead Press', 'sets', 3, 'reps', '10', 'notes', 'Strict form', 'rest_seconds', 90),
        jsonb_build_object('name', 'Push-up', 'sets', 3, 'reps', 'Max', 'notes', 'Quality reps only', 'rest_seconds', 60),
        jsonb_build_object('name', 'Dead Bug', 'sets', 3, 'reps', '10 each', 'notes', 'Core stability', 'rest_seconds', 60)
      ),
      CONCAT('Week ', w, ': Focus on form. Add weight only when technique is solid.')
    ),
    (foundation_id, w, 2, 'Hinge + Pull',
      jsonb_build_array(
        jsonb_build_object('name', 'Trap Bar Deadlift', 'sets', 3, 'reps', '8', 'notes', 'Hip hinge pattern', 'rest_seconds', 120),
        jsonb_build_object('name', 'Dumbbell Row', 'sets', 3, 'reps', '10 each', 'notes', 'Elbow to hip', 'rest_seconds', 90),
        jsonb_build_object('name', 'Lat Pulldown', 'sets', 3, 'reps', '12', 'notes', 'Full ROM', 'rest_seconds', 90),
        jsonb_build_object('name', 'Face Pull', 'sets', 3, 'reps', '15', 'notes', 'Shoulder health', 'rest_seconds', 60),
        jsonb_build_object('name', 'Plank Hold', 'sets', 3, 'reps', '30-60s', 'notes', 'Brace the core', 'rest_seconds', 60)
      ),
      'Own the hinge pattern today.'
    ),
    (foundation_id, w, 3, 'Full Body Strength',
      jsonb_build_array(
        jsonb_build_object('name', 'Barbell Back Squat', 'sets', 3, 'reps', '8', 'notes', 'Add 5lbs from last week', 'rest_seconds', 120),
        jsonb_build_object('name', 'Barbell Romanian Deadlift', 'sets', 3, 'reps', '10', 'notes', 'Feel the hamstrings', 'rest_seconds', 90),
        jsonb_build_object('name', 'Dumbbell Incline Press', 'sets', 3, 'reps', '10', 'notes', 'Control', 'rest_seconds', 90),
        jsonb_build_object('name', 'Cable Row', 'sets', 3, 'reps', '12', 'notes', 'Elbows back', 'rest_seconds', 75),
        jsonb_build_object('name', 'Farmer Carry', 'sets', 3, 'reps', '30m', 'notes', 'Loaded carry finisher', 'rest_seconds', 90)
      ),
      'Full body integration. Move well and add load progressively.'
    );
  END LOOP;

  -- Seed Running Add-on (3 days/week)
  FOR w IN 1..12 LOOP
    INSERT INTO public.program_workouts (program_id, week_number, day_number, workout_name, exercises, notes)
    VALUES
    (running_id, w, 1, 'Easy Run + Drills',
      jsonb_build_array(
        jsonb_build_object('name', 'Easy Run', 'sets', 1, 'reps', CONCAT(GREATEST(20, 20 + (w-1)*2), ' minutes'), 'notes', 'Zone 2 pace — conversational', 'rest_seconds', 0),
        jsonb_build_object('name', 'High Knees', 'sets', 3, 'reps', '20m', 'notes', 'Running drill', 'rest_seconds', 30),
        jsonb_build_object('name', 'Butt Kicks', 'sets', 3, 'reps', '20m', 'notes', 'Running drill', 'rest_seconds', 30),
        jsonb_build_object('name', 'Leg Swing', 'sets', 2, 'reps', '10 each', 'notes', 'Hip mobility', 'rest_seconds', 30)
      ),
      'Keep the pace conversational. This builds your aerobic engine.'
    ),
    (running_id, w, 2, 'Interval Training',
      jsonb_build_array(
        jsonb_build_object('name', 'Warm-up Jog', 'sets', 1, 'reps', '10 minutes', 'notes', 'Easy pace', 'rest_seconds', 0),
        jsonb_build_object('name', 'Intervals', 'sets', LEAST(3 + w, 8), 'reps', CASE WHEN w <= 4 THEN '400m' WHEN w <= 8 THEN '600m' ELSE '800m' END, 'notes', '85-90% effort, full recovery between', 'rest_seconds', 180),
        jsonb_build_object('name', 'Cool-down Jog', 'sets', 1, 'reps', '10 minutes', 'notes', 'Easy pace', 'rest_seconds', 0)
      ),
      'Hard effort on the intervals. Take full rest between reps.'
    ),
    (running_id, w, 3, 'Long Run',
      jsonb_build_array(
        jsonb_build_object('name', 'Long Run', 'sets', 1, 'reps', CONCAT(LEAST(30 + w*5, 75), ' minutes'), 'notes', 'Easy, aerobic pace throughout', 'rest_seconds', 0),
        jsonb_build_object('name', 'Calf Stretch', 'sets', 1, 'reps', '2 minutes each', 'notes', 'Post-run', 'rest_seconds', 0),
        jsonb_build_object('name', 'Hip Flexor Stretch', 'sets', 1, 'reps', '2 minutes each', 'notes', 'Post-run', 'rest_seconds', 0)
      ),
      'Long run builds your base. Go slower than you think you need to.'
    );
  END LOOP;

  -- Seed Rowing Add-on (3 days/week)
  FOR w IN 1..12 LOOP
    INSERT INTO public.program_workouts (program_id, week_number, day_number, workout_name, exercises, notes)
    VALUES
    (rowing_id, w, 1, 'Steady State Rowing',
      jsonb_build_array(
        jsonb_build_object('name', 'Erg Row — Steady State', 'sets', 1, 'reps', CONCAT(GREATEST(15, 15 + (w-1)*2), ' minutes'), 'notes', 'Damper 4-6, comfortable pace, focus on technique', 'rest_seconds', 0),
        jsonb_build_object('name', 'Hip Flexor Stretch', 'sets', 1, 'reps', '2 min each', 'notes', 'Post-row mobility', 'rest_seconds', 0)
      ),
      'Catch, drive, finish, recover. Own the stroke.'
    ),
    (rowing_id, w, 2, 'Row Intervals',
      jsonb_build_array(
        jsonb_build_object('name', 'Row Warm-up', 'sets', 1, 'reps', '5 minutes easy', 'notes', 'Get the stroke going', 'rest_seconds', 0),
        jsonb_build_object('name', 'Rowing Intervals', 'sets', LEAST(4 + w, 10), 'reps', CASE WHEN w <= 4 THEN '250m' WHEN w <= 8 THEN '500m' ELSE '750m' END, 'notes', 'Hard effort, 85-90% max, rest 2x work time', 'rest_seconds', 120),
        jsonb_build_object('name', 'Row Cool-down', 'sets', 1, 'reps', '5 minutes easy', 'notes', 'Bring heart rate down', 'rest_seconds', 0)
      ),
      'Attack the intervals. Your power output will improve week over week.'
    ),
    (rowing_id, w, 3, 'Long Row + Technique',
      jsonb_build_array(
        jsonb_build_object('name', 'Erg Row', 'sets', 1, 'reps', CONCAT(LEAST(20 + w*3, 60), ' minutes'), 'notes', 'Moderate pace, sustainable effort', 'rest_seconds', 0),
        jsonb_build_object('name', 'Pause Rowing', 'sets', 5, 'reps', '10 strokes', 'notes', 'Pause at the catch — technique drill', 'rest_seconds', 60)
      ),
      'Long aerobic effort. Focus on a clean catch and full drive through the stroke.'
    );
  END LOOP;

END $$;
