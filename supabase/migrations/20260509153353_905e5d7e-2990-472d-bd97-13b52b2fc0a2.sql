CREATE TABLE IF NOT EXISTS public.hotmart_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  produto_codigo text NOT NULL,
  hotmart_transaction text UNIQUE,
  album_ids uuid[] NOT NULL DEFAULT '{}',
  meses_assinatura int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  processado_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hotmart_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_codigo text NOT NULL UNIQUE,
  descricao text,
  album_ids uuid[] NOT NULL DEFAULT '{}',
  meses_assinatura int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hotmart_pendentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotmart_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotmart_pendentes_select" ON public.hotmart_pendentes FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "hotmart_produtos_select" ON public.hotmart_produtos FOR SELECT USING (true);

CREATE POLICY "hotmart_produtos_admin" ON public.hotmart_produtos FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
);

INSERT INTO public.hotmart_produtos (produto_codigo, descricao, album_ids, meses_assinatura)
VALUES (
  'PCDF2026',
  'Turma PCDF 2026 - Hotmart',
  ARRAY['2d29994e-7938-499a-893d-2343f8f69b9b']::uuid[],
  2
)
ON CONFLICT (produto_codigo) DO NOTHING;