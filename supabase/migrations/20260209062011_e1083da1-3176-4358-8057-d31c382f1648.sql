-- Add exercise_type column to workout_exercises
ALTER TABLE public.workout_exercises 
ADD COLUMN IF NOT EXISTS exercise_type text DEFAULT 'strength' CHECK (exercise_type IN ('strength', 'conditioning'));

-- Create conditioning_sets table for cardio exercises
CREATE TABLE IF NOT EXISTS public.conditioning_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id uuid NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL DEFAULT 1,
  duration_seconds integer,
  distance numeric,
  distance_unit text DEFAULT 'miles' CHECK (distance_unit IN ('miles', 'km', 'meters')),
  calories integer,
  avg_heart_rate integer,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conditioning_sets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conditioning_sets
CREATE POLICY "Users can view their conditioning sets" 
ON public.conditioning_sets 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM workout_exercises we
  JOIN workouts w ON w.id = we.workout_id
  WHERE we.id = conditioning_sets.exercise_id AND w.user_id = auth.uid()
));

CREATE POLICY "Users can insert their conditioning sets" 
ON public.conditioning_sets 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM workout_exercises we
  JOIN workouts w ON w.id = we.workout_id
  WHERE we.id = conditioning_sets.exercise_id AND w.user_id = auth.uid()
));

CREATE POLICY "Users can update their conditioning sets" 
ON public.conditioning_sets 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM workout_exercises we
  JOIN workouts w ON w.id = we.workout_id
  WHERE we.id = conditioning_sets.exercise_id AND w.user_id = auth.uid()
));

CREATE POLICY "Users can delete their conditioning sets" 
ON public.conditioning_sets 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM workout_exercises we
  JOIN workouts w ON w.id = we.workout_id
  WHERE we.id = conditioning_sets.exercise_id AND w.user_id = auth.uid()
));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conditioning_sets_exercise_id ON public.conditioning_sets(exercise_id);