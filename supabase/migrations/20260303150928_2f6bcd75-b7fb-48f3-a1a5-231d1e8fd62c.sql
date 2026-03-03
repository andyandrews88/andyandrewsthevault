
CREATE POLICY "Clients can view their own invoices"
ON public.pt_invoices FOR SELECT TO authenticated
USING (auth.uid() = client_user_id);
