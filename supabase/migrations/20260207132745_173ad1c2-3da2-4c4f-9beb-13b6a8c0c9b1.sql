-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for resource types
CREATE TYPE public.resource_type AS ENUM ('youtube', 'vimeo', 'spotify', 'apple_podcast', 'article', 'pdf');

-- Create enum for resource categories
CREATE TYPE public.resource_category AS ENUM ('physics', 'physiology', 'process');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles (only admins can manage roles, users can view their own)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create vault_resources table
CREATE TABLE public.vault_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    type resource_type NOT NULL,
    category resource_category NOT NULL,
    embed_url text,
    content text,
    leak_tags text[] DEFAULT '{}',
    duration text,
    pages integer,
    is_premium boolean NOT NULL DEFAULT false,
    file_path text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on vault_resources
ALTER TABLE public.vault_resources ENABLE ROW LEVEL SECURITY;

-- RLS policies for vault_resources
CREATE POLICY "Anyone can view resources"
ON public.vault_resources
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert resources"
ON public.vault_resources
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update resources"
ON public.vault_resources
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resources"
ON public.vault_resources
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create vault_podcasts table
CREATE TABLE public.vault_podcasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    episode_number integer,
    spotify_url text,
    apple_url text,
    youtube_url text,
    duration text,
    published_at timestamp with time zone,
    is_premium boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on vault_podcasts
ALTER TABLE public.vault_podcasts ENABLE ROW LEVEL SECURITY;

-- RLS policies for vault_podcasts
CREATE POLICY "Anyone can view podcasts"
ON public.vault_podcasts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert podcasts"
ON public.vault_podcasts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update podcasts"
ON public.vault_podcasts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete podcasts"
ON public.vault_podcasts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_vault_resources_updated_at
BEFORE UPDATE ON public.vault_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vault_podcasts_updated_at
BEFORE UPDATE ON public.vault_podcasts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for vault files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vault-files', 'vault-files', true);

-- Storage policies for vault-files bucket
CREATE POLICY "Anyone can view vault files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vault-files');

CREATE POLICY "Admins can upload vault files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vault-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vault files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'vault-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vault files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vault-files' AND public.has_role(auth.uid(), 'admin'));