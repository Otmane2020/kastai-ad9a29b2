-- Workspaces: each user can have multiple workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'briefcase',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workspaces" ON public.workspaces
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add workspace_id to existing tables
ALTER TABLE public.uploaded_files ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.forecast_runs ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Events & Promotions table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'promo',         -- promo | season | holiday | launch | disruption | other
  impact_type TEXT NOT NULL DEFAULT 'percent', -- percent | absolute
  impact_value DOUBLE PRECISION DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  sku TEXT,                                    -- SKU / référence produit ciblé
  famille TEXT,                                -- famille produit
  sous_famille TEXT,                           -- sous-famille produit
  affected_products TEXT[],                    -- null = all
  affected_categories TEXT[],
  notes TEXT,
  source TEXT DEFAULT 'manual',               -- manual | csv
  color TEXT DEFAULT '#f59e0b',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create default workspace on first sign-in
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.workspaces (user_id, name, is_default)
  VALUES (NEW.id, 'Mon Workspace', true);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_workspace AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace();
