-- 1) configuracoes_site: standardize on has_role()
DROP POLICY IF EXISTS config_insert ON public.configuracoes_site;
DROP POLICY IF EXISTS config_update ON public.configuracoes_site;

CREATE POLICY config_insert ON public.configuracoes_site
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY config_update ON public.configuracoes_site
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- 2) profiles: block client-side tampering with system-computed columns
CREATE OR REPLACE FUNCTION public.protect_profile_system_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only guard direct Data API updates; SECURITY DEFINER routines run as the
  -- function owner and are allowed to maintain these values.
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.total_score := OLD.total_score;
    NEW.rank_position := OLD.rank_position;
    NEW.likes_count := OLD.likes_count;
    NEW.comment_score := OLD.comment_score;
    NEW.total_essays := OLD.total_essays;
    NEW.average_grade := OLD.average_grade;
    NEW.weekly_hours := OLD.weekly_hours;
    NEW.streak := OLD.streak;
    NEW.subscription_tier := OLD.subscription_tier;
    NEW.subscription_end := OLD.subscription_end;
    NEW.price_id := OLD.price_id;
    NEW.banco_geral_expires_at := OLD.banco_geral_expires_at;
    NEW.trial_claimed_at := OLD.trial_claimed_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_system_columns ON public.profiles;
CREATE TRIGGER protect_profile_system_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_system_columns();

-- 3) turmas_respostas: block tampering with score / answer-key-download flag
CREATE OR REPLACE FUNCTION public.protect_turmas_respostas_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.user_id := OLD.user_id;
    NEW.album_id := OLD.album_id;
    NEW.question_id := OLD.question_id;
    NEW.score := OLD.score;
    NEW.gabarito_baixado_antes := OLD.gabarito_baixado_antes;
    NEW.is_study_attempt := OLD.is_study_attempt;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_turmas_respostas_columns ON public.turmas_respostas;
CREATE TRIGGER protect_turmas_respostas_columns
BEFORE UPDATE ON public.turmas_respostas
FOR EACH ROW EXECUTE FUNCTION public.protect_turmas_respostas_columns();

-- 4) weekly_questions: hide answer-key columns from direct table reads.
-- Answer keys remain available through the existing protected functions
-- get_question_answer_key() and admin_list_question_answer_keys().
REVOKE SELECT ON public.weekly_questions FROM authenticated;
REVOKE SELECT ON public.weekly_questions FROM anon;

GRANT SELECT (
  id, title, career, discipline, statement, difficulty, deadline, is_active,
  created_at, created_by, is_weekly, is_premium, participants, banca, subject,
  year, public_id, album_id, disciplines, subjects
) ON public.weekly_questions TO authenticated;

GRANT ALL ON public.weekly_questions TO service_role;