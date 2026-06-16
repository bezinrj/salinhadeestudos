-- Script de Migração: Pastas de Cadernos
-- Execute este script no painel SQL da Lovable (ou Supabase)

-- 1) Criar tabela de pastas
CREATE TABLE IF NOT EXISTS public.vm_caderno_pastas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Índices e Segurança para Pastas
CREATE INDEX IF NOT EXISTS idx_vm_caderno_pastas_user ON public.vm_caderno_pastas(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_caderno_pastas TO authenticated;
ALTER TABLE public.vm_caderno_pastas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vm_caderno_pastas_owner" ON public.vm_caderno_pastas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger de updated_at para Pastas
CREATE TRIGGER trg_vm_caderno_pastas_updated BEFORE UPDATE ON public.vm_caderno_pastas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Adicionar chave estrangeira na tabela vm_cadernos
ALTER TABLE public.vm_cadernos ADD COLUMN IF NOT EXISTS pasta_id uuid REFERENCES public.vm_caderno_pastas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vm_cadernos_pasta ON public.vm_cadernos(pasta_id);
