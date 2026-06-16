
-- 1. PASTAS
CREATE TABLE public.vm_caderno_pastas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vm_caderno_pastas_user ON public.vm_caderno_pastas(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_caderno_pastas TO authenticated;
GRANT ALL ON public.vm_caderno_pastas TO service_role;

ALTER TABLE public.vm_caderno_pastas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own pastas select" ON public.vm_caderno_pastas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own pastas insert" ON public.vm_caderno_pastas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pastas update" ON public.vm_caderno_pastas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pastas delete" ON public.vm_caderno_pastas FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_vm_caderno_pastas_updated
BEFORE UPDATE ON public.vm_caderno_pastas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. CADERNOS
CREATE TABLE public.vm_cadernos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pasta_id uuid REFERENCES public.vm_caderno_pastas(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vm_cadernos_user ON public.vm_cadernos(user_id);
CREATE INDEX idx_vm_cadernos_pasta ON public.vm_cadernos(pasta_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_cadernos TO authenticated;
GRANT ALL ON public.vm_cadernos TO service_role;

ALTER TABLE public.vm_cadernos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own cadernos select" ON public.vm_cadernos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own cadernos insert" ON public.vm_cadernos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cadernos update" ON public.vm_cadernos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cadernos delete" ON public.vm_cadernos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_vm_cadernos_updated
BEFORE UPDATE ON public.vm_cadernos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. NOTAS
CREATE TABLE public.vm_caderno_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caderno_id uuid NOT NULL REFERENCES public.vm_cadernos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artigo_id uuid REFERENCES public.vm_artigos(id) ON DELETE SET NULL,
  conteudo_html text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vm_caderno_notas_caderno ON public.vm_caderno_notas(caderno_id);
CREATE INDEX idx_vm_caderno_notas_user ON public.vm_caderno_notas(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_caderno_notas TO authenticated;
GRANT ALL ON public.vm_caderno_notas TO service_role;

ALTER TABLE public.vm_caderno_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notas select" ON public.vm_caderno_notas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notas insert" ON public.vm_caderno_notas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notas update" ON public.vm_caderno_notas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notas delete" ON public.vm_caderno_notas FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_vm_caderno_notas_updated
BEFORE UPDATE ON public.vm_caderno_notas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
