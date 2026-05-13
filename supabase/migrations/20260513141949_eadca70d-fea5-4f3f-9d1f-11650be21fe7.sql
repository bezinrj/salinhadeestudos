
-- Function to recompute liberado_em for all questions in an album, in cadastro order
CREATE OR REPLACE FUNCTION public.recompute_turma_liberacoes(p_album_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_album public.turmas_albuns%ROWTYPE;
  v_rec record;
  v_idx int := 0;
  v_lote int;
BEGIN
  SELECT * INTO v_album FROM public.turmas_albuns WHERE id = p_album_id;
  IF NOT FOUND THEN RETURN; END IF;

  FOR v_rec IN
    SELECT id FROM public.turmas_questoes
    WHERE album_id = p_album_id
    ORDER BY created_at ASC, id ASC
  LOOP
    v_lote := v_idx / GREATEST(v_album.questoes_por_liberacao, 1);
    UPDATE public.turmas_questoes
    SET liberado_em = v_album.data_inicio + (v_lote * v_album.intervalo_dias * INTERVAL '1 day')
    WHERE id = v_rec.id;
    v_idx := v_idx + 1;
  END LOOP;
END;
$$;

-- Trigger function: recompute when album config changes
CREATE OR REPLACE FUNCTION public.fn_album_config_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.questoes_por_liberacao IS DISTINCT FROM OLD.questoes_por_liberacao
     OR NEW.intervalo_dias IS DISTINCT FROM OLD.intervalo_dias
     OR NEW.data_inicio IS DISTINCT FROM OLD.data_inicio THEN
    PERFORM public.recompute_turma_liberacoes(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_album_config_changed ON public.turmas_albuns;
CREATE TRIGGER trg_album_config_changed
AFTER UPDATE ON public.turmas_albuns
FOR EACH ROW EXECUTE FUNCTION public.fn_album_config_changed();

-- Recompute now for all existing albums
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.turmas_albuns LOOP
    PERFORM public.recompute_turma_liberacoes(r.id);
  END LOOP;
END $$;
