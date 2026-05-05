DROP FUNCTION IF EXISTS public.get_turma_ranking_semanal(uuid);
DROP FUNCTION IF EXISTS public.get_turma_ranking_geral(uuid);
DROP FUNCTION IF EXISTS public.get_turma_ranking_por_questao(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_turma_ranking_semanal(p_album_id uuid)
RETURNS TABLE (
  user_id uuid,
  total_score numeric,
  questoes_respondidas bigint,
  respondeu_sem_gabarito boolean
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
    COUNT(*)::bigint AS questoes_respondidas,
    BOOL_AND(NOT tr.gabarito_baixado_antes) AS respondeu_sem_gabarito
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
  questoes_respondidas bigint,
  respondeu_sem_gabarito boolean
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
    COUNT(*)::bigint AS questoes_respondidas,
    BOOL_AND(NOT tr.gabarito_baixado_antes) AS respondeu_sem_gabarito
  FROM public.turmas_respostas tr
  WHERE
    tr.album_id = p_album_id
    AND tr.is_study_attempt = false
    AND tr.score IS NOT NULL
  GROUP BY tr.user_id
  ORDER BY SUM(tr.score) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_turma_ranking_por_questao(p_album_id uuid, p_question_id uuid)
RETURNS TABLE (
  user_id uuid,
  score numeric,
  respondeu_sem_gabarito boolean
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
    tr.score,
    NOT tr.gabarito_baixado_antes AS respondeu_sem_gabarito
  FROM public.turmas_respostas tr
  WHERE
    tr.album_id = p_album_id
    AND tr.question_id = p_question_id
    AND tr.is_study_attempt = false
    AND tr.score IS NOT NULL
  ORDER BY tr.score DESC;
END;
$$;