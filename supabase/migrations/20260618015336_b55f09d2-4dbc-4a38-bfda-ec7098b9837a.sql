REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;
GRANT SELECT (phone) ON public.profiles TO service_role;