
REVOKE EXECUTE ON FUNCTION public.media_horas_geral(TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.media_horas_geral(TEXT) TO authenticated;
