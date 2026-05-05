CREATE OR REPLACE FUNCTION public.fn_turma_questao_inserida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.weekly_questions
  SET is_active = false
  WHERE id = NEW.question_id
    AND banca = 'INÉDITA';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_turma_questao_inserida ON public.turmas_questoes;
CREATE TRIGGER trg_turma_questao_inserida
  AFTER INSERT ON public.turmas_questoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_turma_questao_inserida();

CREATE OR REPLACE FUNCTION public.fn_turma_questao_removida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_em_outro_album boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.turmas_questoes
    WHERE question_id = OLD.question_id
      AND id != OLD.id
  ) INTO v_em_outro_album;

  IF NOT v_em_outro_album THEN
    UPDATE public.weekly_questions
    SET is_active = true
    WHERE id = OLD.question_id
      AND banca = 'INÉDITA';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_turma_questao_removida ON public.turmas_questoes;
CREATE TRIGGER trg_turma_questao_removida
  AFTER DELETE ON public.turmas_questoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_turma_questao_removida();

UPDATE public.weekly_questions wq
SET is_active = false
WHERE wq.banca = 'INÉDITA'
  AND EXISTS (
    SELECT 1 FROM public.turmas_questoes tq
    WHERE tq.question_id = wq.id
  );