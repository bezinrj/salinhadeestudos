
-- ============================================================
-- VADE MECUM — Fase 1: Schema completo
-- ============================================================

-- 1) vm_leis
CREATE TABLE public.vm_leis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  sigla text NOT NULL,
  descricao text,
  categoria text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  publicada boolean NOT NULL DEFAULT true,
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_leis TO authenticated;
GRANT ALL ON public.vm_leis TO service_role;
ALTER TABLE public.vm_leis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vm_leis_select" ON public.vm_leis FOR SELECT TO authenticated
  USING (publicada = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "vm_leis_admin_write" ON public.vm_leis FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 2) vm_artigos
CREATE TABLE public.vm_artigos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lei_id uuid NOT NULL REFERENCES public.vm_leis(id) ON DELETE CASCADE,
  numero text NOT NULL,
  rotulo text NOT NULL DEFAULT '',
  texto text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vm_artigos_lei ON public.vm_artigos(lei_id, ordem);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_artigos TO authenticated;
GRANT ALL ON public.vm_artigos TO service_role;
ALTER TABLE public.vm_artigos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vm_artigos_select" ON public.vm_artigos FOR SELECT TO authenticated USING (true);
CREATE POLICY "vm_artigos_admin_write" ON public.vm_artigos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 3) vm_paragrafos
CREATE TABLE public.vm_paragrafos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id uuid NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('paragrafo','inciso','alinea','paragrafo_unico')),
  rotulo text NOT NULL DEFAULT '',
  texto text NOT NULL,
  ordem integer NOT NULL DEFAULT 0
);
CREATE INDEX idx_vm_paragrafos_artigo ON public.vm_paragrafos(artigo_id, ordem);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_paragrafos TO authenticated;
GRANT ALL ON public.vm_paragrafos TO service_role;
ALTER TABLE public.vm_paragrafos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vm_paragrafos_select" ON public.vm_paragrafos FOR SELECT TO authenticated USING (true);
CREATE POLICY "vm_paragrafos_admin_write" ON public.vm_paragrafos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 4) vm_incidencias
CREATE TABLE public.vm_incidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id uuid NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  cargo text NOT NULL CHECK (cargo IN ('magistratura','defensoria','mp','delegado')),
  quantidade integer NOT NULL DEFAULT 1,
  concursos text[] NOT NULL DEFAULT '{}',
  UNIQUE(artigo_id, cargo)
);
CREATE INDEX idx_vm_incidencias_artigo ON public.vm_incidencias(artigo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_incidencias TO authenticated;
GRANT ALL ON public.vm_incidencias TO service_role;
ALTER TABLE public.vm_incidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vm_incidencias_select" ON public.vm_incidencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "vm_incidencias_admin_write" ON public.vm_incidencias FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 5) vm_remissoes
CREATE TABLE public.vm_remissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_origem_id uuid NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  artigo_destino_id uuid NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  texto_exibido text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vm_remissoes_origem ON public.vm_remissoes(artigo_origem_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_remissoes TO authenticated;
GRANT ALL ON public.vm_remissoes TO service_role;
ALTER TABLE public.vm_remissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vm_remissoes_select" ON public.vm_remissoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "vm_remissoes_admin_write" ON public.vm_remissoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 6) vm_comentarios
CREATE TABLE public.vm_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id uuid NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  autor_nome text NOT NULL,
  autor_cargo text,
  texto text NOT NULL,
  tipo text NOT NULL DEFAULT 'aluno' CHECK (tipo IN ('aluno','professor')),
  upvotes integer NOT NULL DEFAULT 0,
  visivel boolean NOT NULL DEFAULT true,
  fixado boolean NOT NULL DEFAULT false,
  moderado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vm_comentarios_artigo ON public.vm_comentarios(artigo_id, criado_em DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_comentarios TO authenticated;
GRANT ALL ON public.vm_comentarios TO service_role;
ALTER TABLE public.vm_comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vm_comentarios_select" ON public.vm_comentarios FOR SELECT TO authenticated
  USING (visivel = true OR user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "vm_comentarios_insert" ON public.vm_comentarios FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vm_comentarios_update_own" ON public.vm_comentarios FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "vm_comentarios_delete_own" ON public.vm_comentarios FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));

-- 7) vm_notas
CREATE TABLE public.vm_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  artigo_id uuid NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  cor text NOT NULL DEFAULT 'yellow' CHECK (cor IN ('yellow','blue','pink')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vm_notas_user_artigo ON public.vm_notas(user_id, artigo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_notas TO authenticated;
GRANT ALL ON public.vm_notas TO service_role;
ALTER TABLE public.vm_notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vm_notas_owner" ON public.vm_notas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8) vm_highlights
CREATE TABLE public.vm_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  artigo_id uuid NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  trecho text NOT NULL,
  offset_inicio integer NOT NULL,
  offset_fim integer NOT NULL,
  cor text NOT NULL DEFAULT 'yellow' CHECK (cor IN ('yellow','green','blue')),
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vm_highlights_user_artigo ON public.vm_highlights(user_id, artigo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_highlights TO authenticated;
GRANT ALL ON public.vm_highlights TO service_role;
ALTER TABLE public.vm_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vm_highlights_owner" ON public.vm_highlights FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9) vm_progresso
CREATE TABLE public.vm_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  artigo_id uuid NOT NULL REFERENCES public.vm_artigos(id) ON DELETE CASCADE,
  lido boolean NOT NULL DEFAULT false,
  marcado boolean NOT NULL DEFAULT false,
  data_leitura timestamptz,
  UNIQUE(user_id, artigo_id)
);
CREATE INDEX idx_vm_progresso_user ON public.vm_progresso(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_progresso TO authenticated;
GRANT ALL ON public.vm_progresso TO service_role;
ALTER TABLE public.vm_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vm_progresso_owner" ON public.vm_progresso FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers de updated_at
CREATE TRIGGER trg_vm_leis_updated BEFORE UPDATE ON public.vm_leis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_vm_artigos_updated BEFORE UPDATE ON public.vm_artigos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_vm_notas_updated BEFORE UPDATE ON public.vm_notas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
