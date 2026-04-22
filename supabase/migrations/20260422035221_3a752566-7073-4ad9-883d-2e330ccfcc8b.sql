-- Function to get general ranking (sum of scores per user)
CREATE OR REPLACE FUNCTION public.get_general_ranking()
RETURNS TABLE (user_id uuid, total_score numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, SUM(score)::numeric AS total_score
  FROM public.weekly_answers
  GROUP BY user_id
  HAVING SUM(score) > 0;
$$;

-- Function to get weekly ranking for a specific question
CREATE OR REPLACE FUNCTION public.get_weekly_ranking(_question_id uuid)
RETURNS TABLE (user_id uuid, score numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, score::numeric
  FROM public.weekly_answers
  WHERE question_id = _question_id AND score > 0;
$$;

GRANT EXECUTE ON FUNCTION public.get_general_ranking() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_ranking(uuid) TO authenticated;