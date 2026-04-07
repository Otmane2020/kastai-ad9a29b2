
-- S&OP Products
CREATE TABLE public.sop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  family TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sop_products" ON public.sop_products FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- S&OP Production Lines
CREATE TABLE public.sop_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  site TEXT DEFAULT '',
  capacity_per_day INTEGER NOT NULL DEFAULT 480,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sop_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sop_lines" ON public.sop_lines FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- S&OP Mappings (Product → Line)
CREATE TABLE public.sop_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.sop_products(id) ON DELETE CASCADE NOT NULL,
  line_id UUID REFERENCES public.sop_lines(id) ON DELETE CASCADE NOT NULL,
  unit_time DOUBLE PRECISION NOT NULL DEFAULT 5,
  yield_pct DOUBLE PRECISION NOT NULL DEFAULT 95,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sop_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sop_mappings" ON public.sop_mappings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- S&OP Scenarios
CREATE TABLE public.sop_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'demand_up',
  param DOUBLE PRECISION NOT NULL DEFAULT 0,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sop_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sop_scenarios" ON public.sop_scenarios FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
