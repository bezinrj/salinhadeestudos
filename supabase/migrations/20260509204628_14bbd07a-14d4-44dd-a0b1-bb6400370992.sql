CREATE TABLE IF NOT EXISTS public.configuracoes_site (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  valor text NOT NULL,
  descricao text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.configuracoes_site ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_select" ON public.configuracoes_site FOR SELECT USING (true);
CREATE POLICY "config_update" ON public.configuracoes_site FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
);
CREATE POLICY "config_insert" ON public.configuracoes_site FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
);

INSERT INTO public.configuracoes_site (chave, valor, descricao) VALUES
  ('discord_url', 'https://discord.gg/', 'Link do servidor Discord'),
  ('whatsapp_url', 'https://wa.me/', 'Link do grupo WhatsApp')
ON CONFLICT (chave) DO NOTHING;