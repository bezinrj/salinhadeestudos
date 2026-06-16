-- Script de Migração: Matérias e Assuntos por Usuário
-- Execute este script no painel SQL da Lovable ou Supabase

-- 1) Tabela de Matérias do Usuário
CREATE TABLE IF NOT EXISTS public.user_materias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 2) Tabela de Assuntos do Usuário
CREATE TABLE IF NOT EXISTS public.user_assuntos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_id uuid NOT NULL REFERENCES public.user_materias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_materias_user ON public.user_materias(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assuntos_user ON public.user_assuntos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assuntos_materia ON public.user_assuntos(materia_id);

-- Segurança para Matérias
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_materias TO authenticated;
ALTER TABLE public.user_materias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_materias_owner" ON public.user_materias FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Segurança para Assuntos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_assuntos TO authenticated;
ALTER TABLE public.user_assuntos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_assuntos_owner" ON public.user_assuntos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
