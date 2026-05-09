ALTER TABLE public.turmas_albuns 
  ADD COLUMN IF NOT EXISTS whatsapp_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_ativo boolean NOT NULL DEFAULT false;