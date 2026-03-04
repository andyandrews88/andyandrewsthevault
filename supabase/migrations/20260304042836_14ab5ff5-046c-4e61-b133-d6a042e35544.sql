
-- Add workout_section column to workout_exercises
ALTER TABLE public.workout_exercises 
ADD COLUMN workout_section text NOT NULL DEFAULT 'main';

-- Add check constraint
ALTER TABLE public.workout_exercises 
ADD CONSTRAINT workout_exercises_section_check 
CHECK (workout_section IN ('warmup', 'main', 'cooldown'));
