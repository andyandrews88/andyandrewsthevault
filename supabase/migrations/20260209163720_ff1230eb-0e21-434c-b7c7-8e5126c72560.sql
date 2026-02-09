
-- Create user_daily_checkins table
CREATE TABLE public.user_daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  check_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_score integer NOT NULL,
  stress_score integer NOT NULL,
  energy_score integer NOT NULL,
  drive_score integer NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, check_date)
);

-- Enable RLS
ALTER TABLE public.user_daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own checkins"
ON public.user_daily_checkins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins"
ON public.user_daily_checkins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins"
ON public.user_daily_checkins FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkins"
ON public.user_daily_checkins FOR DELETE
USING (auth.uid() = user_id);
