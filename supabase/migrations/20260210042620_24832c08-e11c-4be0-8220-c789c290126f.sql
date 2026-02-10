
-- Create user_goals table
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  exercise_name TEXT,
  target_value NUMERIC NOT NULL,
  start_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  target_date DATE NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  achieved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own goals"
  ON public.user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
  ON public.user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.user_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.user_goals FOR DELETE
  USING (auth.uid() = user_id);
