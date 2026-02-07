-- Create table for user nutrition data
CREATE TABLE public.user_nutrition_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    biometrics jsonb DEFAULT '{}'::jsonb,
    activity jsonb DEFAULT '{}'::jsonb,
    goals jsonb DEFAULT '{}'::jsonb,
    dietary jsonb DEFAULT '{}'::jsonb,
    results jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Create table for user saved meals
CREATE TABLE public.user_meals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    foods jsonb NOT NULL DEFAULT '[]'::jsonb,
    totals jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for user audit data
CREATE TABLE public.user_audit_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    results jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_nutrition_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audit_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_nutrition_data
CREATE POLICY "Users can view their own nutrition data"
ON public.user_nutrition_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition data"
ON public.user_nutrition_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition data"
ON public.user_nutrition_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition data"
ON public.user_nutrition_data FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for user_meals
CREATE POLICY "Users can view their own meals"
ON public.user_meals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
ON public.user_meals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
ON public.user_meals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
ON public.user_meals FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for user_audit_data
CREATE POLICY "Users can view their own audit data"
ON public.user_audit_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit data"
ON public.user_audit_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audit data"
ON public.user_audit_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audit data"
ON public.user_audit_data FOR DELETE
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_nutrition_data_updated_at
BEFORE UPDATE ON public.user_nutrition_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_audit_data_updated_at
BEFORE UPDATE ON public.user_audit_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();