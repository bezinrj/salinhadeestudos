
ALTER TABLE public.juris_julgados ADD COLUMN IF NOT EXISTS assunto text DEFAULT '';

CREATE TABLE IF NOT EXISTS public.juris_materias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.juris_materias TO authenticated;
GRANT ALL ON public.juris_materias TO service_role;
ALTER TABLE public.juris_materias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read materias" ON public.juris_materias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/mod insert materias" ON public.juris_materias FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admin/mod update materias" ON public.juris_materias FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admin/mod delete materias" ON public.juris_materias FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE TABLE IF NOT EXISTS public.juris_assuntos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id uuid NOT NULL REFERENCES public.juris_materias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(materia_id, nome)
);
GRANT SELECT ON public.juris_assuntos TO authenticated;
GRANT ALL ON public.juris_assuntos TO service_role;
ALTER TABLE public.juris_assuntos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read assuntos" ON public.juris_assuntos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/mod insert assuntos" ON public.juris_assuntos FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admin/mod update assuntos" ON public.juris_assuntos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admin/mod delete assuntos" ON public.juris_assuntos FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

INSERT INTO public.juris_materias (nome)
SELECT DISTINCT trim(area) FROM public.juris_julgados
WHERE area IS NOT NULL AND trim(area) <> ''
ON CONFLICT (nome) DO NOTHING;
