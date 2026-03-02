
-- PT Packages
CREATE TABLE public.pt_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  sessions_purchased integer NOT NULL DEFAULT 10,
  sessions_used integer NOT NULL DEFAULT 0,
  package_name text NOT NULL DEFAULT 'PT Package',
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pt_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access pt_packages" ON public.pt_packages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PT Sessions
CREATE TABLE public.pt_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.pt_packages(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  workout_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pt_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access pt_sessions" ON public.pt_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PT Invoices
CREATE TABLE public.pt_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES public.pt_packages(id) ON DELETE SET NULL,
  client_user_id uuid NOT NULL,
  invoice_url text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AUD',
  status text NOT NULL DEFAULT 'pending',
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pt_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access pt_invoices" ON public.pt_invoices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
