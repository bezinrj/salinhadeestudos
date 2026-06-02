ALTER TABLE public.juris_julgados
  ADD COLUMN IF NOT EXISTS areas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assuntos text[] NOT NULL DEFAULT '{}';

UPDATE public.juris_julgados
SET areas = ARRAY[area]
WHERE (areas IS NULL OR array_length(areas,1) IS NULL) AND coalesce(area,'') <> '';

UPDATE public.juris_julgados
SET assuntos = ARRAY[assunto]
WHERE (assuntos IS NULL OR array_length(assuntos,1) IS NULL) AND coalesce(assunto,'') <> '';