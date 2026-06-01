
-- vm_comentarios
CREATE TABLE IF NOT EXISTS public.vm_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id UUID NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.vm_comentarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vm_comentarios_artigo ON public.vm_comentarios(artigo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_comentarios TO authenticated;
GRANT ALL ON public.vm_comentarios TO service_role;
ALTER TABLE public.vm_comentarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vm_com_select_all" ON public.vm_comentarios;
CREATE POLICY "vm_com_select_all" ON public.vm_comentarios FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "vm_com_insert_own" ON public.vm_comentarios;
CREATE POLICY "vm_com_insert_own" ON public.vm_comentarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "vm_com_update_own" ON public.vm_comentarios;
CREATE POLICY "vm_com_update_own" ON public.vm_comentarios FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "vm_com_delete_own_or_admin" ON public.vm_comentarios;
CREATE POLICY "vm_com_delete_own_or_admin" ON public.vm_comentarios FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
DROP TRIGGER IF EXISTS trg_vm_comentarios_updated ON public.vm_comentarios;
CREATE TRIGGER trg_vm_comentarios_updated BEFORE UPDATE ON public.vm_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- vm_marcacoes
CREATE TABLE IF NOT EXISTS public.vm_marcacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id UUID NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  paragrafo_id UUID REFERENCES public.vm_paragrafos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  trecho TEXT NOT NULL,
  offset_inicio INT NOT NULL,
  offset_fim INT NOT NULL,
  cor TEXT NOT NULL DEFAULT 'amarelo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vm_marcacoes_user_art ON public.vm_marcacoes(user_id, artigo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_marcacoes TO authenticated;
GRANT ALL ON public.vm_marcacoes TO service_role;
ALTER TABLE public.vm_marcacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vm_marc_own" ON public.vm_marcacoes;
CREATE POLICY "vm_marc_own" ON public.vm_marcacoes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- vm_notas_professor
CREATE TABLE IF NOT EXISTS public.vm_notas_professor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id UUID NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL,
  autor_nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vm_notas_prof_artigo ON public.vm_notas_professor(artigo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_notas_professor TO authenticated;
GRANT ALL ON public.vm_notas_professor TO service_role;
ALTER TABLE public.vm_notas_professor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vm_np_select_all" ON public.vm_notas_professor;
CREATE POLICY "vm_np_select_all" ON public.vm_notas_professor FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "vm_np_write_admin" ON public.vm_notas_professor;
CREATE POLICY "vm_np_write_admin" ON public.vm_notas_professor FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
DROP POLICY IF EXISTS "vm_np_update_admin" ON public.vm_notas_professor;
CREATE POLICY "vm_np_update_admin" ON public.vm_notas_professor FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
DROP POLICY IF EXISTS "vm_np_delete_admin" ON public.vm_notas_professor;
CREATE POLICY "vm_np_delete_admin" ON public.vm_notas_professor FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
DROP TRIGGER IF EXISTS trg_vm_notas_prof_updated ON public.vm_notas_professor;
CREATE TRIGGER trg_vm_notas_prof_updated BEFORE UPDATE ON public.vm_notas_professor
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- vm_notas_privadas
CREATE TABLE IF NOT EXISTS public.vm_notas_privadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id UUID NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, artigo_id)
);
CREATE INDEX IF NOT EXISTS idx_vm_notas_priv_user_art ON public.vm_notas_privadas(user_id, artigo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_notas_privadas TO authenticated;
GRANT ALL ON public.vm_notas_privadas TO service_role;
ALTER TABLE public.vm_notas_privadas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vm_npriv_own" ON public.vm_notas_privadas;
CREATE POLICY "vm_npriv_own" ON public.vm_notas_privadas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_vm_notas_priv_updated ON public.vm_notas_privadas;
CREATE TRIGGER trg_vm_notas_priv_updated BEFORE UPDATE ON public.vm_notas_privadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
