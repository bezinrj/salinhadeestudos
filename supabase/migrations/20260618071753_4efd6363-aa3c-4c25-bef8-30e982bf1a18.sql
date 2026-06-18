
CREATE OR REPLACE FUNCTION public.update_atualizado_em_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_vm_leis_updated ON public.vm_leis;
CREATE TRIGGER trg_vm_leis_updated
  BEFORE UPDATE ON public.vm_leis
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();

DROP TRIGGER IF EXISTS trg_vm_notas_updated ON public.vm_notas;
CREATE TRIGGER trg_vm_notas_updated
  BEFORE UPDATE ON public.vm_notas
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();

DROP TRIGGER IF EXISTS trg_vm_cadernos_updated ON public.vm_cadernos;
CREATE TRIGGER trg_vm_cadernos_updated
  BEFORE UPDATE ON public.vm_cadernos
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();

DROP TRIGGER IF EXISTS trg_vm_caderno_notas_updated ON public.vm_caderno_notas;
CREATE TRIGGER trg_vm_caderno_notas_updated
  BEFORE UPDATE ON public.vm_caderno_notas
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();

DROP TRIGGER IF EXISTS trg_vm_caderno_pastas_updated ON public.vm_caderno_pastas;
CREATE TRIGGER trg_vm_caderno_pastas_updated
  BEFORE UPDATE ON public.vm_caderno_pastas
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();
