ALTER TABLE public.vault_resources ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.vault_podcasts ADD COLUMN is_featured boolean NOT NULL DEFAULT false;