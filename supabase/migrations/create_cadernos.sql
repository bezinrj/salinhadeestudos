-- Script de Migração: Cadernos e Notas
-- Execute este script no painel SQL da Lovable (ou Supabase) para criar a estrutura dos Cadernos.

-- 1) Tabela de Cadernos
CREATE TABLE IF NOT EXISTS public.vm_cadernos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Índices e Segurança para Cadernos
CREATE INDEX IF NOT EXISTS idx_vm_cadernos_user ON public.vm_cadernos(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_cadernos TO authenticated;
ALTER TABLE public.vm_cadernos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vm_cadernos_owner" ON public.vm_cadernos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) Tabela de Notas de Caderno
CREATE TABLE IF NOT EXISTS public.vm_caderno_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caderno_id uuid NOT NULL REFERENCES public.vm_cadernos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  artigo_id uuid REFERENCES public.vm_artigos(id) ON DELETE SET NULL,
  conteudo_html text NOT NULL,
  tags text[] DEFAULT '{}',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Índices e Segurança para Notas
CREATE INDEX IF NOT EXISTS idx_vm_caderno_notas_caderno ON public.vm_caderno_notas(caderno_id);
CREATE INDEX IF NOT EXISTS idx_vm_caderno_notas_user ON public.vm_caderno_notas(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_caderno_notas TO authenticated;
ALTER TABLE public.vm_caderno_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vm_caderno_notas_owner" ON public.vm_caderno_notas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger de updated_at para Cadernos
CREATE TRIGGER trg_vm_cadernos_updated BEFORE UPDATE ON public.vm_cadernos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de updated_at para Notas
CREATE TRIGGER trg_vm_caderno_notas_updated BEFORE UPDATE ON public.vm_caderno_notas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
