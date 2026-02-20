
-- Create user_food_diary table for per-date, per-slot food entries
CREATE TABLE public.user_food_diary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  meal_slot text NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  food_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  amount numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'piece',
  calculated_macros jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast per-user per-date lookups
CREATE INDEX idx_user_food_diary_user_date ON public.user_food_diary (user_id, entry_date);

-- Enable RLS
ALTER TABLE public.user_food_diary ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own diary entries"
  ON public.user_food_diary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diary entries"
  ON public.user_food_diary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries"
  ON public.user_food_diary FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries"
  ON public.user_food_diary FOR DELETE
  USING (auth.uid() = user_id);
