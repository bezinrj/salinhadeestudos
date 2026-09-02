ALTER TABLE public.vm_incidencias
  ADD COLUMN IF NOT EXISTS paragrafo_id uuid NULL REFERENCES public.vm_paragrafos(id) ON DELETE CASCADE;

ALTER TABLE public.vm_incidencias ALTER COLUMN quantidade SET DEFAULT 1;
ALTER TABLE public.vm_incidencias ALTER COLUMN concursos DROP NOT NULL;
ALTER TABLE public.vm_incidencias ALTER COLUMN concursos SET DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS vm_incidencias_artigo_cargo_uniq
  ON public.vm_incidencias (artigo_id, cargo) WHERE paragrafo_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vm_incidencias_paragrafo_cargo_uniq
  ON public.vm_incidencias (paragrafo_id, cargo) WHERE paragrafo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS vm_incidencias_paragrafo_idx ON public.vm_incidencias (paragrafo_id);