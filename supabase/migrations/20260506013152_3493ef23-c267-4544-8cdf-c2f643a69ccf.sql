
CREATE TABLE IF NOT EXISTS public.turmas_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  price_id_stripe text NOT NULL UNIQUE,
  valor numeric(10,2) NOT NULL,
  meses_banco_geral int NOT NULL DEFAULT 1,
  album_ids uuid[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.turmas_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plano_id uuid REFERENCES public.turmas_planos(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  status text NOT NULL DEFAULT 'active',
  banco_geral_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.turmas_acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  album_id uuid NOT NULL REFERENCES public.turmas_albuns(id) ON DELETE CASCADE,
  assinatura_id uuid REFERENCES public.turmas_assinaturas(id) ON DELETE SET NULL,
  is_manual boolean NOT NULL DEFAULT false,
  notas text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, album_id)
);

CREATE TABLE IF NOT EXISTS public.turmas_gabarito_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.turmas_albuns(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.weekly_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  downloaded_at timestamptz DEFAULT now(),
  UNIQUE(album_id, question_id, user_id)
);

ALTER TABLE public.turmas_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_gabarito_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turmas_planos_select" ON public.turmas_planos FOR SELECT USING (true);
CREATE POLICY "turmas_planos_insert" ON public.turmas_planos FOR INSERT WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));
CREATE POLICY "turmas_planos_update" ON public.turmas_planos FOR UPDATE USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));
CREATE POLICY "turmas_planos_delete" ON public.turmas_planos FOR DELETE USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

CREATE POLICY "turmas_assinaturas_select" ON public.turmas_assinaturas FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));
CREATE POLICY "turmas_assinaturas_insert" ON public.turmas_assinaturas FOR INSERT WITH CHECK (true);
CREATE POLICY "turmas_assinaturas_update" ON public.turmas_assinaturas FOR UPDATE USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

CREATE POLICY "turmas_acessos_select" ON public.turmas_acessos FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));
CREATE POLICY "turmas_acessos_insert" ON public.turmas_acessos FOR INSERT WITH CHECK (true);
CREATE POLICY "turmas_acessos_update" ON public.turmas_acessos FOR UPDATE USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));
CREATE POLICY "turmas_acessos_delete" ON public.turmas_acessos FOR DELETE USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

CREATE POLICY "gabarito_downloads_insert" ON public.turmas_gabarito_downloads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "gabarito_downloads_select" ON public.turmas_gabarito_downloads FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

INSERT INTO public.turmas_planos (nome, descricao, price_id_stripe, valor, meses_banco_geral, album_ids) VALUES
('Turma PCDF 2026','Acesso à Turma PCDF 2026 + 3 meses de banco geral de questões','price_1TTshQLy0axdgWvJWnq1swso',269.90,3,ARRAY['2d29994e-7938-499a-893d-2343f8f69b9b']::uuid[]),
('Turma EMERJ 2026','Acesso à Turma EMERJ 2026 + 1 mês de banco geral de questões','price_1TTskdLy0axdgWvJG2XcYGJh',99.90,1,ARRAY['70b910a7-fcaa-42ee-8f67-79f5df212e46']::uuid[]),
('Turma EMERJ 2025','Acesso à Turma EMERJ 2025 + 1 mês de banco geral de questões','price_1TTsmPLy0axdgWvJIyq8hRDX',79.90,1,ARRAY['23cdec52-1fc3-4b1c-81ea-02d54ab5cb3c']::uuid[]),
('Combo EMERJ 2025/2026','Acesso às Turmas EMERJ 2025 e EMERJ 2026 + 1 mês de banco geral de questões','price_1TTsmhLy0axdgWvJZWOwBQ9W',149.90,1,ARRAY['70b910a7-fcaa-42ee-8f67-79f5df212e46','23cdec52-1fc3-4b1c-81ea-02d54ab5cb3c']::uuid[])
ON CONFLICT (price_id_stripe) DO NOTHING;
