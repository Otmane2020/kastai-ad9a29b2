ALTER TABLE public.uploaded_files ADD COLUMN IF NOT EXISTS ai_mapping jsonb DEFAULT NULL;
ALTER TABLE public.uploaded_files ADD COLUMN IF NOT EXISTS columns_hash text DEFAULT NULL;