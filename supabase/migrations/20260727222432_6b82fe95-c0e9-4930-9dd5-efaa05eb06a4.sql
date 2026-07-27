CREATE OR REPLACE FUNCTION public.refresh_my_total_essays()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _total integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT
    (SELECT COUNT(*) FROM public.weekly_answers WHERE user_id = _uid)
    + (SELECT COUNT(*) FROM public.turmas_respostas WHERE user_id = _uid AND is_study_attempt = false)
  INTO _total;

  UPDATE public.profiles SET total_essays = _total WHERE id = _uid;
  RETURN _total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_my_total_essays() TO authenticated;