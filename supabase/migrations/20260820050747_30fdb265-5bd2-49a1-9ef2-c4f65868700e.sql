CREATE TABLE public.vm_sumulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribunal text NOT NULL,
  numero integer NOT NULL,
  materia text NOT NULL,
  assunto text NOT NULL,
  texto text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vm_sumulas TO anon;
GRANT SELECT ON public.vm_sumulas TO authenticated;
GRANT ALL ON public.vm_sumulas TO service_role;

ALTER TABLE public.vm_sumulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sumulas sao publicas para leitura"
ON public.vm_sumulas FOR SELECT USING (true);

CREATE POLICY "Admins e moderadores gerenciam sumulas"
ON public.vm_sumulas FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE INDEX idx_vm_sumulas_filtros ON public.vm_sumulas (tribunal, materia, assunto);
CREATE INDEX idx_vm_sumulas_ordem ON public.vm_sumulas (ordem);

CREATE TRIGGER trg_vm_sumulas_updated_at
BEFORE UPDATE ON public.vm_sumulas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();