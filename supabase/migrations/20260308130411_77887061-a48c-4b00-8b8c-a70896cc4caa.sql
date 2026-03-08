
-- Create custom_foods table
CREATE TABLE public.custom_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  barcode text,
  name text NOT NULL,
  brand text,
  serving_size text NOT NULL DEFAULT '100g',
  serving_grams numeric NOT NULL DEFAULT 100,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fats numeric NOT NULL DEFAULT 0,
  fiber numeric,
  image_url text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view public foods
CREATE POLICY "Anyone can view public custom foods"
  ON public.custom_foods FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

-- Users can insert their own foods
CREATE POLICY "Users can insert custom foods"
  ON public.custom_foods FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can update their own foods
CREATE POLICY "Users can update their own custom foods"
  ON public.custom_foods FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Users can delete their own foods
CREATE POLICY "Users can delete their own custom foods"
  ON public.custom_foods FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Index for barcode lookups
CREATE INDEX idx_custom_foods_barcode ON public.custom_foods (barcode) WHERE barcode IS NOT NULL;

-- Index for name search
CREATE INDEX idx_custom_foods_name ON public.custom_foods USING gin (to_tsvector('english', name));
