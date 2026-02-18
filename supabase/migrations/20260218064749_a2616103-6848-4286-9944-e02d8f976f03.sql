-- Migration 1: Add video_url to programs table
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS video_url text;

-- Migration 2: Create exercise_library table with RLS
CREATE TABLE IF NOT EXISTS public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'strength',
  muscle_group text,
  video_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exercise library"
  ON public.exercise_library FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert exercise library"
  ON public.exercise_library FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update exercise library"
  ON public.exercise_library FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete exercise library"
  ON public.exercise_library FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_exercise_library_updated_at
  BEFORE UPDATE ON public.exercise_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();