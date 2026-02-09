-- Fix 1: Add content length constraint to community_messages
ALTER TABLE public.community_messages 
ADD CONSTRAINT community_messages_content_length 
CHECK (length(content) <= 5000);

-- Fix 2: Add display_name length constraint to user_profiles
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_display_name_length 
CHECK (length(display_name) <= 100);