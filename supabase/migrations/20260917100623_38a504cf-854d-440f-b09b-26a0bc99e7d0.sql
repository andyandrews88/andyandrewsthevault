UPDATE public.exercise_sets SET unit = 'lb'::weight_unit WHERE unit <> 'lb'::weight_unit;
UPDATE public.personal_records SET unit = 'lb'::weight_unit WHERE unit <> 'lb'::weight_unit;
ALTER TABLE public.exercise_sets ALTER COLUMN unit SET DEFAULT 'lb'::weight_unit;
ALTER TABLE public.personal_records ALTER COLUMN unit SET DEFAULT 'lb'::weight_unit;