REVOKE SELECT (phone) ON public.profiles FROM authenticated;
REVOKE SELECT (phone) ON public.profiles FROM anon;
GRANT SELECT (
  id, username, name, bio, avatar_url, target_career,
  total_score, rank_position, weekly_hours, total_essays,
  average_grade, streak, likes_count, comment_score,
  subscription_tier, subscription_end, price_id,
  active_badge_id, banco_geral_expires_at, created_at
) ON public.profiles TO authenticated;