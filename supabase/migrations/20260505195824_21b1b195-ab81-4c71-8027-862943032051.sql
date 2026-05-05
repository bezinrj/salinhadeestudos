ALTER TABLE public.turmas_albuns
  ADD COLUMN IF NOT EXISTS cor text NOT NULL DEFAULT '#6366f1';

CREATE TABLE IF NOT EXISTS public.turmas_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.turmas_albuns(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.weekly_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resposta text NOT NULL,
  score numeric(5,2),
  is_study_attempt boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(album_id, question_id, user_id, is_study_attempt)
);

ALTER TABLE public.turmas_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turmas_respostas_select" ON public.turmas_respostas
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'moderator'::app_role)
      OR is_study_attempt = false
    )
  );

CREATE POLICY "turmas_respostas_insert" ON public.turmas_respostas
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "turmas_respostas_update" ON public.turmas_respostas
  FOR UPDATE USING (user_id = auth.uid() AND is_study_attempt = true);

CREATE OR REPLACE FUNCTION public.get_turma_ranking_semanal(p_album_id uuid)
RETURNS TABLE (
  user_id uuid,
  total_score numeric,
  questoes_respondidas bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tr.user_id,
    SUM(tr.score)::numeric AS total_score,
    COUNT(*)::bigint AS questoes_respondidas
  FROM public.turmas_respostas tr
  WHERE
    tr.album_id = p_album_id
    AND tr.is_study_attempt = false
    AND tr.score IS NOT NULL
    AND tr.created_at >= date_trunc('week', now())
  GROUP BY tr.user_id
  ORDER BY SUM(tr.score) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_turma_ranking_geral(p_album_id uuid)
RETURNS TABLE (
  user_id uuid,
  total_score numeric,
  questoes_respondidas bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tr.user_id,
    SUM(tr.score)::numeric AS total_score,
    COUNT(*)::bigint AS questoes_respondidas
  FROM public.turmas_respostas tr
  WHERE
    tr.album_id = p_album_id
    AND tr.is_study_attempt = false
    AND tr.score IS NOT NULL
  GROUP BY tr.user_id
  ORDER BY SUM(tr.score) DESC;
END;
$$;