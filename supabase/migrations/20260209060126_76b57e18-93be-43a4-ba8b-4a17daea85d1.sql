-- Workout Tracker Tables

-- Main workouts table
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  workout_name text NOT NULL,
  total_volume numeric DEFAULT 0,
  notes text,
  is_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Exercises within a workout
CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Individual sets within an exercise
CREATE TABLE public.exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL DEFAULT 1,
  weight numeric,
  reps integer,
  rpe numeric,
  is_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Personal records tracking
CREATE TABLE public.personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_name text NOT NULL,
  max_weight numeric NOT NULL,
  max_reps integer,
  workout_id uuid REFERENCES public.workouts(id) ON DELETE SET NULL,
  set_id uuid REFERENCES public.exercise_sets(id) ON DELETE SET NULL,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_date ON public.workouts(date);
CREATE INDEX idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX idx_exercise_sets_exercise_id ON public.exercise_sets(exercise_id);
CREATE INDEX idx_personal_records_user_id ON public.personal_records(user_id);
CREATE INDEX idx_personal_records_exercise ON public.personal_records(exercise_name);

-- Enable RLS on all tables
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workouts
CREATE POLICY "Users can view their own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON public.workouts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for workout_exercises (via join to workouts)
CREATE POLICY "Users can view their workout exercises"
  ON public.workout_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their workout exercises"
  ON public.workout_exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their workout exercises"
  ON public.workout_exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their workout exercises"
  ON public.workout_exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()
  ));

-- RLS Policies for exercise_sets (via join through workout_exercises to workouts)
CREATE POLICY "Users can view their exercise sets"
  ON public.exercise_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = exercise_id AND w.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their exercise sets"
  ON public.exercise_sets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = exercise_id AND w.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their exercise sets"
  ON public.exercise_sets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = exercise_id AND w.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their exercise sets"
  ON public.exercise_sets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = exercise_id AND w.user_id = auth.uid()
  ));

-- RLS Policies for personal_records
CREATE POLICY "Users can view their own PRs"
  ON public.personal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PRs"
  ON public.personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PRs"
  ON public.personal_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PRs"
  ON public.personal_records FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update workout updated_at
CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update workout total_volume when sets change
CREATE OR REPLACE FUNCTION public.update_workout_volume()
RETURNS TRIGGER AS $$
DECLARE
  workout_uuid uuid;
BEGIN
  -- Get the workout_id through workout_exercises
  SELECT we.workout_id INTO workout_uuid
  FROM public.workout_exercises we
  WHERE we.id = COALESCE(NEW.exercise_id, OLD.exercise_id);
  
  -- Update the workout's total_volume
  UPDATE public.workouts w
  SET total_volume = (
    SELECT COALESCE(SUM(s.weight * s.reps), 0)
    FROM public.exercise_sets s
    JOIN public.workout_exercises e ON s.exercise_id = e.id
    WHERE e.workout_id = workout_uuid AND s.is_completed = true
  )
  WHERE w.id = workout_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for volume updates
CREATE TRIGGER update_volume_on_set_change
  AFTER INSERT OR UPDATE OR DELETE ON public.exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workout_volume();

-- Enable Realtime for personal_records
ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_records;