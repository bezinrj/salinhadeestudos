-- 1) profiles: restrict client UPDATE to user-editable columns only
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;
GRANT UPDATE (username, name, bio, avatar_url, target_career, active_badge_id) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2) weekly_questions: hide answer key columns from client roles
REVOKE SELECT ON public.weekly_questions FROM authenticated;
REVOKE SELECT ON public.weekly_questions FROM anon;
GRANT SELECT (id, title, career, discipline, statement, difficulty, deadline, is_active, created_at, created_by, is_weekly, is_premium, participants, banca, subject, year, public_id, album_id, disciplines, subjects) ON public.weekly_questions TO authenticated;
GRANT SELECT (id, title, career, discipline, statement, difficulty, deadline, is_active, created_at, created_by, is_weekly, is_premium, participants, banca, subject, year, public_id, album_id, disciplines, subjects) ON public.weekly_questions TO anon;
GRANT INSERT, UPDATE, DELETE ON public.weekly_questions TO authenticated;
GRANT ALL ON public.weekly_questions TO service_role;

-- 3) Gated access to the answer key
CREATE OR REPLACE FUNCTION public.get_question_answer_key(_question_id uuid)
RETURNS TABLE(barema jsonb, mirror_text text, ideal_answer text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _q public.weekly_questions%ROWTYPE;
  _allowed boolean := false;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _q FROM public.weekly_questions WHERE id = _question_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF public.has_role(_uid, 'admin') OR public.has_role(_uid, 'moderator') THEN
    _allowed := true;
  ELSIF EXISTS (SELECT 1 FROM public.weekly_answers WHERE user_id = _uid AND question_id = _question_id) THEN
    _allowed := true;
  ELSIF EXISTS (SELECT 1 FROM public.turmas_respostas WHERE user_id = _uid AND question_id = _question_id AND is_study_attempt = false) THEN
    _allowed := true;
  ELSIF NOT (COALESCE(_q.is_weekly, false) AND _q.deadline IS NOT NULL AND _q.deadline > now()) THEN
    _allowed := true;
  END IF;

  IF NOT _allowed THEN
    RAISE EXCEPTION 'Answer key not available yet';
  END IF;

  RETURN QUERY SELECT _q.barema, _q.mirror_text, _q.ideal_answer;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_question_answer_key(uuid) TO authenticated;

-- 4) Admin-only bulk access for the admin panel
CREATE OR REPLACE FUNCTION public.admin_list_question_answer_keys()
RETURNS TABLE(id uuid, barema jsonb, mirror_text text, ideal_answer text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT q.id, q.barema, q.mirror_text, q.ideal_answer
  FROM public.weekly_questions q
  WHERE public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator');
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_question_answer_keys() TO authenticated;