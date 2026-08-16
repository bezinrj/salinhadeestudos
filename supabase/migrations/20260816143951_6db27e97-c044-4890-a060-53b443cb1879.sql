REVOKE EXECUTE ON FUNCTION public.crono_match_materia(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.crono_match_assunto(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.crono_relink_all() FROM anon;
REVOKE EXECUTE ON FUNCTION public.crono_pendencias() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_media_horas_por_materia(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_media_horas_por_assunto(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.crono_materias_autolink() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.crono_assuntos_autolink() FROM anon, authenticated;