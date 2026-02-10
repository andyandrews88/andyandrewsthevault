CREATE POLICY "Anyone can view resources public"
  ON public.vault_resources
  FOR SELECT
  TO anon
  USING (true);