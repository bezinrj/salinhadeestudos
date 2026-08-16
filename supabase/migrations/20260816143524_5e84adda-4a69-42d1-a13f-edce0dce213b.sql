CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- ============ Catálogo canônico ============
CREATE TABLE public.crono_materias_canon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#3b82f6',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX crono_materias_canon_nome_key ON public.crono_materias_canon (lower(nome));

GRANT SELECT ON public.crono_materias_canon TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crono_materias_canon TO authenticated;
GRANT ALL ON public.crono_materias_canon TO service_role;
ALTER TABLE public.crono_materias_canon ENABLE ROW LEVEL SECURITY;

CREATE POLICY "canon materias legiveis" ON public.crono_materias_canon
  FOR SELECT USING (true);
CREATE POLICY "canon materias admin" ON public.crono_materias_canon
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE TABLE public.crono_assuntos_canon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_canon_id uuid NOT NULL REFERENCES public.crono_materias_canon(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX crono_assuntos_canon_nome_key ON public.crono_assuntos_canon (materia_canon_id, lower(nome));

GRANT SELECT ON public.crono_assuntos_canon TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crono_assuntos_canon TO authenticated;
GRANT ALL ON public.crono_assuntos_canon TO service_role;
ALTER TABLE public.crono_assuntos_canon ENABLE ROW LEVEL SECURITY;

CREATE POLICY "canon assuntos legiveis" ON public.crono_assuntos_canon
  FOR SELECT USING (true);
CREATE POLICY "canon assuntos admin" ON public.crono_assuntos_canon
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- ============ Normalização ============
CREATE OR REPLACE FUNCTION public.crono_norm(_txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT btrim(regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(translate(coalesce(_txt,''),
          'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
          'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
        '[^a-z0-9 ]', ' ', 'g'),
      '^(direito|dir)\s+(de\s+|do\s+|da\s+|dos\s+|das\s+)?', '', 'g'),
    '\s+', ' ', 'g'));
$$;

CREATE TABLE public.crono_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('materia','assunto')),
  canon_id uuid NOT NULL,
  texto_norm text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX crono_aliases_key ON public.crono_aliases (tipo, texto_norm);
CREATE INDEX crono_aliases_trgm ON public.crono_aliases USING gin (texto_norm extensions.gin_trgm_ops);

GRANT SELECT ON public.crono_aliases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crono_aliases TO authenticated;
GRANT ALL ON public.crono_aliases TO service_role;
ALTER TABLE public.crono_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aliases legiveis" ON public.crono_aliases FOR SELECT USING (true);
CREATE POLICY "aliases admin" ON public.crono_aliases
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- ============ Vínculo nas tabelas do aluno ============
ALTER TABLE public.crono_materias ADD COLUMN IF NOT EXISTS materia_canon_id uuid REFERENCES public.crono_materias_canon(id) ON DELETE SET NULL;
ALTER TABLE public.crono_assuntos ADD COLUMN IF NOT EXISTS assunto_canon_id uuid REFERENCES public.crono_assuntos_canon(id) ON DELETE SET NULL;

-- ============ Matching ============
CREATE OR REPLACE FUNCTION public.crono_match_materia(_texto text)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  n text := public.crono_norm(_texto);
  r uuid;
BEGIN
  IF n = '' THEN RETURN NULL; END IF;

  SELECT c.id INTO r FROM public.crono_materias_canon c
   WHERE c.ativo AND public.crono_norm(c.nome) = n LIMIT 1;
  IF r IS NOT NULL THEN RETURN r; END IF;

  SELECT a.canon_id INTO r FROM public.crono_aliases a
   WHERE a.tipo = 'materia' AND a.texto_norm = n LIMIT 1;
  IF r IS NOT NULL THEN RETURN r; END IF;

  SELECT c.id INTO r FROM public.crono_materias_canon c
   WHERE c.ativo AND similarity(public.crono_norm(c.nome), n) >= 0.55
   ORDER BY similarity(public.crono_norm(c.nome), n) DESC LIMIT 1;
  RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION public.crono_match_assunto(_texto text, _materia_canon_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  n text := public.crono_norm(_texto);
  r uuid;
BEGIN
  IF n = '' OR _materia_canon_id IS NULL THEN RETURN NULL; END IF;

  SELECT s.id INTO r FROM public.crono_assuntos_canon s
   WHERE s.ativo AND s.materia_canon_id = _materia_canon_id
     AND public.crono_norm(s.nome) = n LIMIT 1;
  IF r IS NOT NULL THEN RETURN r; END IF;

  SELECT a.canon_id INTO r
    FROM public.crono_aliases a
    JOIN public.crono_assuntos_canon s ON s.id = a.canon_id
   WHERE a.tipo = 'assunto' AND a.texto_norm = n
     AND s.materia_canon_id = _materia_canon_id LIMIT 1;
  IF r IS NOT NULL THEN RETURN r; END IF;

  SELECT s.id INTO r FROM public.crono_assuntos_canon s
   WHERE s.ativo AND s.materia_canon_id = _materia_canon_id
     AND similarity(public.crono_norm(s.nome), n) >= 0.55
   ORDER BY similarity(public.crono_norm(s.nome), n) DESC LIMIT 1;
  RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION public.crono_materias_autolink()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.nome IS DISTINCT FROM OLD.nome THEN
    IF NEW.materia_canon_id IS NULL OR (TG_OP = 'UPDATE' AND NEW.materia_canon_id IS NOT DISTINCT FROM OLD.materia_canon_id) THEN
      NEW.materia_canon_id := public.crono_match_materia(NEW.nome);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.crono_assuntos_autolink()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mat uuid;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.nome IS DISTINCT FROM OLD.nome OR NEW.materia_id IS DISTINCT FROM OLD.materia_id THEN
    IF NEW.assunto_canon_id IS NULL OR (TG_OP = 'UPDATE' AND NEW.assunto_canon_id IS NOT DISTINCT FROM OLD.assunto_canon_id) THEN
      SELECT m.materia_canon_id INTO v_mat FROM public.crono_materias m WHERE m.id = NEW.materia_id;
      NEW.assunto_canon_id := public.crono_match_assunto(NEW.nome, v_mat);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crono_materias_autolink
  BEFORE INSERT OR UPDATE ON public.crono_materias
  FOR EACH ROW EXECUTE FUNCTION public.crono_materias_autolink();

CREATE TRIGGER trg_crono_assuntos_autolink
  BEFORE INSERT OR UPDATE ON public.crono_assuntos
  FOR EACH ROW EXECUTE FUNCTION public.crono_assuntos_autolink();

CREATE TRIGGER trg_crono_materias_canon_updated
  BEFORE UPDATE ON public.crono_materias_canon
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();
CREATE TRIGGER trg_crono_assuntos_canon_updated
  BEFORE UPDATE ON public.crono_assuntos_canon
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();

-- ============ Comparação social ============
CREATE OR REPLACE FUNCTION public.crono_periodo_start(_periodo text)
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT CASE lower(coalesce(_periodo,'mes'))
    WHEN 'dia' THEN date_trunc('day', now())
    WHEN 'diario' THEN date_trunc('day', now())
    WHEN 'diário' THEN date_trunc('day', now())
    WHEN 'ano' THEN date_trunc('year', now())
    WHEN 'anual' THEN date_trunc('year', now())
    ELSE date_trunc('month', now())
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_media_horas_por_materia(periodo text)
RETURNS TABLE(materia_canon_id uuid, materia_nome text, cor text, media_horas numeric, minhas_horas numeric, alunos integer, percentil numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start timestamptz := public.crono_periodo_start(periodo);
  v_uid uuid := auth.uid();
BEGIN
  RETURN QUERY
  WITH tot AS (
    SELECT m.materia_canon_id AS cid, s.user_id, SUM(COALESCE(s.total_seconds,0))::numeric / 3600.0 AS horas
    FROM public.study_timer_sessions s
    JOIN public.crono_materias m ON m.id = s.materia_id
    WHERE s.status = 'completed' AND s.end_time >= v_start
      AND m.materia_canon_id IS NOT NULL
      AND COALESCE(s.total_seconds,0) > 0
    GROUP BY 1,2
  )
  SELECT c.id, c.nome, c.cor,
         ROUND(AVG(t.horas)::numeric, 2),
         ROUND(COALESCE(MAX(t.horas) FILTER (WHERE t.user_id = v_uid), 0)::numeric, 2),
         COUNT(DISTINCT t.user_id)::int,
         ROUND((100.0 * COUNT(*) FILTER (
            WHERE t.horas <= COALESCE((SELECT t2.horas FROM tot t2 WHERE t2.cid = c.id AND t2.user_id = v_uid), -1)
         ) / NULLIF(COUNT(*),0))::numeric, 0)
  FROM tot t
  JOIN public.crono_materias_canon c ON c.id = t.cid
  GROUP BY c.id, c.nome, c.cor
  ORDER BY 4 DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_media_horas_por_assunto(periodo text, _materia_canon_id uuid DEFAULT NULL)
RETURNS TABLE(assunto_canon_id uuid, assunto_nome text, materia_canon_id uuid, materia_nome text, media_horas numeric, minhas_horas numeric, alunos integer, percentil numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start timestamptz := public.crono_periodo_start(periodo);
  v_uid uuid := auth.uid();
BEGIN
  RETURN QUERY
  WITH tot AS (
    SELECT a.assunto_canon_id AS cid, s.user_id, SUM(COALESCE(s.total_seconds,0))::numeric / 3600.0 AS horas
    FROM public.study_timer_sessions s
    JOIN public.crono_assuntos a ON a.id = s.assunto_id
    WHERE s.status = 'completed' AND s.end_time >= v_start
      AND a.assunto_canon_id IS NOT NULL
      AND COALESCE(s.total_seconds,0) > 0
    GROUP BY 1,2
  )
  SELECT sc.id, sc.nome, mc.id, mc.nome,
         ROUND(AVG(t.horas)::numeric, 2),
         ROUND(COALESCE(MAX(t.horas) FILTER (WHERE t.user_id = v_uid), 0)::numeric, 2),
         COUNT(DISTINCT t.user_id)::int,
         ROUND((100.0 * COUNT(*) FILTER (
            WHERE t.horas <= COALESCE((SELECT t2.horas FROM tot t2 WHERE t2.cid = sc.id AND t2.user_id = v_uid), -1)
         ) / NULLIF(COUNT(*),0))::numeric, 0)
  FROM tot t
  JOIN public.crono_assuntos_canon sc ON sc.id = t.cid
  JOIN public.crono_materias_canon mc ON mc.id = sc.materia_canon_id
  WHERE _materia_canon_id IS NULL OR sc.materia_canon_id = _materia_canon_id
  GROUP BY sc.id, sc.nome, mc.id, mc.nome
  ORDER BY 5 DESC;
END;
$$;

-- Fila de pendências (somente admin/moderador)
CREATE OR REPLACE FUNCTION public.crono_pendencias()
RETURNS TABLE(tipo text, texto text, texto_norm text, alunos integer, materia_canon_id uuid, materia_nome text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 'materia'::text, min(m.nome), public.crono_norm(m.nome), count(DISTINCT m.user_id)::int, NULL::uuid, NULL::text
  FROM public.crono_materias m
  WHERE m.materia_canon_id IS NULL
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  GROUP BY public.crono_norm(m.nome)
  UNION ALL
  SELECT 'assunto'::text, min(a.nome), public.crono_norm(a.nome), count(DISTINCT a.user_id)::int, mc.id, mc.nome
  FROM public.crono_assuntos a
  JOIN public.crono_materias m ON m.id = a.materia_id
  LEFT JOIN public.crono_materias_canon mc ON mc.id = m.materia_canon_id
  WHERE a.assunto_canon_id IS NULL
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  GROUP BY public.crono_norm(a.nome), mc.id, mc.nome
  ORDER BY 4 DESC;
$$;

-- Reprocessa vínculos após mudanças no catálogo (admin)
CREATE OR REPLACE FUNCTION public.crono_relink_all()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count int := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  UPDATE public.crono_materias m
     SET materia_canon_id = public.crono_match_materia(m.nome)
   WHERE m.materia_canon_id IS DISTINCT FROM public.crono_match_materia(m.nome);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.crono_assuntos a
     SET assunto_canon_id = public.crono_match_assunto(a.nome, (SELECT m.materia_canon_id FROM public.crono_materias m WHERE m.id = a.materia_id))
   WHERE a.assunto_canon_id IS DISTINCT FROM public.crono_match_assunto(a.nome, (SELECT m.materia_canon_id FROM public.crono_materias m WHERE m.id = a.materia_id));

  RETURN v_count;
END;
$$;