-- Create user_profiles table for community display names
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text NOT NULL DEFAULT 'Anonymous',
    avatar_url text,
    is_coach boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create community_messages table with threading support
CREATE TABLE public.community_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_id uuid REFERENCES public.community_messages(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_thread_root boolean NOT NULL DEFAULT true,
    likes_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create community_likes table
CREATE TABLE public.community_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message_id uuid REFERENCES public.community_messages(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, message_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Anyone can view profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Community messages policies
CREATE POLICY "Authenticated users can view all messages" ON public.community_messages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create messages" ON public.community_messages
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON public.community_messages
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages or admins" ON public.community_messages
    FOR DELETE TO authenticated USING (
        auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
    );

-- Community likes policies
CREATE POLICY "Anyone can view likes" ON public.community_likes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can add likes" ON public.community_likes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON public.community_likes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create trigger to auto-create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous'))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Create trigger to update likes_count on community_messages
CREATE OR REPLACE FUNCTION public.update_message_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_messages 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.message_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_messages 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.message_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON public.community_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_message_likes_count();

-- Create trigger to update updated_at on messages
CREATE TRIGGER update_community_messages_updated_at
    BEFORE UPDATE ON public.community_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;