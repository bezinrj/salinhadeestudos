CREATE OR REPLACE FUNCTION public.get_weekly_waitlist_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.weekly_waitlist;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_waitlist_count() TO anon, authenticated;