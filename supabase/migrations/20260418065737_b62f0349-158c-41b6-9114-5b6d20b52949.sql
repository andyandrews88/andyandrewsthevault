-- Step 1: Remove duplicates (keep oldest per lower(name))
DELETE FROM public.exercise_library a
USING public.exercise_library b
WHERE a.id <> b.id
  AND lower(a.name) = lower(b.name)
  AND a.created_at > b.created_at;

-- Step 2: Drop existing case-sensitive unique constraint/index if present
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.exercise_library'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.exercise_library DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

DROP INDEX IF EXISTS public.exercise_library_name_key;
DROP INDEX IF EXISTS public.exercise_library_name_unique;

-- Step 3: Create new case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS exercise_library_name_lower_unique
  ON public.exercise_library (lower(name));