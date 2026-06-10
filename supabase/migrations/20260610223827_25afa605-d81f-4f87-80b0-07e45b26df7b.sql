CREATE OR REPLACE FUNCTION public.fn_vm_artigos_set_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vm_artigos_updated ON public.vm_artigos;
CREATE TRIGGER trg_vm_artigos_updated
BEFORE UPDATE ON public.vm_artigos
FOR EACH ROW EXECUTE FUNCTION public.fn_vm_artigos_set_atualizado_em();