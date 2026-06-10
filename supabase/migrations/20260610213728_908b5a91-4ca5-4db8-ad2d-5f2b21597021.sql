
-- Remove direct INSERT policy that allowed self-awarding any badge
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;

-- Server-side badge claim with criteria validation
CREATE OR REPLACE FUNCTION public.claim_badge(_badge_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _p public.profiles%ROWTYPE;
  _ok boolean := false;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- already earned? treat as success, no-op
  IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = _uid AND badge_id = _badge_id) THEN
    RETURN true;
  END IF;

  SELECT * INTO _p FROM public.profiles WHERE id = _uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  _ok := CASE _badge_id
    WHEN 'b1'  THEN COALESCE(_p.total_essays,0) >= 1
    WHEN 'b2'  THEN COALESCE(_p.total_essays,0) >= 5
    WHEN 'b3'  THEN COALESCE(_p.total_essays,0) >= 10
    WHEN 'b17' THEN COALESCE(_p.total_essays,0) >= 50
    WHEN 'b18' THEN COALESCE(_p.total_essays,0) >= 100
    WHEN 'b19' THEN COALESCE(_p.total_essays,0) >= 200
    WHEN 'b20' THEN COALESCE(_p.total_essays,0) >= 500
    WHEN 'b21' THEN COALESCE(_p.total_essays,0) >= 1000
    WHEN 'b22' THEN COALESCE(_p.total_essays,0) >= 5000
    WHEN 'b4'  THEN EXISTS (SELECT 1 FROM public.weekly_answers WHERE user_id = _uid AND score >= 8)
    WHEN 'b5'  THEN EXISTS (SELECT 1 FROM public.weekly_answers WHERE user_id = _uid AND score >= 9)
    WHEN 'b6'  THEN _p.rank_position IS NOT NULL AND _p.rank_position BETWEEN 1 AND 10
    WHEN 'b8'  THEN _p.rank_position = 1
    WHEN 'b9'  THEN COALESCE(_p.weekly_hours,0) >= 10
    WHEN 'b10' THEN COALESCE(_p.weekly_hours,0) >= 50
    WHEN 'b11' THEN COALESCE(_p.weekly_hours,0) >= 100
    WHEN 'b12' THEN COALESCE(_p.streak,0) >= 7
    WHEN 'b13' THEN COALESCE(_p.streak,0) >= 30
    WHEN 'b14' THEN COALESCE(_p.streak,0) >= 60
    WHEN 'b15' THEN EXISTS (SELECT 1 FROM public.weekly_answers WHERE user_id = _uid)
    WHEN 'b23' THEN _p.subscription_tier = 'annual'
    ELSE false
  END;

  IF NOT _ok THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (_uid, _badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_badge(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_badge(text) TO authenticated;
