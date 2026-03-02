
-- Add plyometric metrics to exercise_sets
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS distance_m numeric DEFAULT NULL;
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS height_cm numeric DEFAULT NULL;
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS speed_mps numeric DEFAULT NULL;

-- Add is_plyometric flag to exercise_library
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS is_plyometric boolean NOT NULL DEFAULT false;
