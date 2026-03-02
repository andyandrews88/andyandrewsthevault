
-- Update the handle_new_user_profile function to use email prefix as fallback instead of 'Anonymous'
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        split_part(NEW.email, '@', 1),
        'User'
      )
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$function$;

-- Also fix existing users who have 'Anonymous' display_name by setting it to their email prefix
-- We need a one-time data fix via a function
CREATE OR REPLACE FUNCTION public.fix_anonymous_display_names()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_record RECORD;
  user_email TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id FROM public.user_profiles WHERE display_name = 'Anonymous'
  LOOP
    SELECT email INTO user_email FROM auth.users WHERE id = profile_record.id;
    IF user_email IS NOT NULL THEN
      UPDATE public.user_profiles 
      SET display_name = split_part(user_email, '@', 1)
      WHERE id = profile_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Run the fix
SELECT public.fix_anonymous_display_names();

-- Clean up the temp function
DROP FUNCTION public.fix_anonymous_display_names();
