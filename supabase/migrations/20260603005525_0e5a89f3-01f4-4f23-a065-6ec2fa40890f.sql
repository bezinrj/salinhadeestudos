ALTER TABLE public.juris_julgados ADD COLUMN IF NOT EXISTS topicos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: para cada julgado existente sem tópicos, criar pares (matéria, assunto)
-- emparelhando cada matéria com cada assunto existente.
UPDATE public.juris_julgados j
SET topicos = COALESCE((
  SELECT jsonb_agg(jsonb_build_object('materia', m, 'assunto', COALESCE(a, '')))
  FROM (
    SELECT unnest(CASE WHEN array_length(j.areas,1) > 0 THEN j.areas ELSE ARRAY[NULLIF(j.area,'')] END) AS m
  ) mm
  CROSS JOIN LATERAL (
    SELECT unnest(
      CASE WHEN array_length(j.assuntos,1) > 0 THEN j.assuntos
           WHEN NULLIF(j.assunto,'') IS NOT NULL THEN ARRAY[j.assunto]
           ELSE ARRAY[NULL]::text[] END
    ) AS a
  ) aa
  WHERE m IS NOT NULL
), '[]'::jsonb)
WHERE (topicos IS NULL OR topicos = '[]'::jsonb)
  AND (array_length(j.areas,1) > 0 OR NULLIF(j.area,'') IS NOT NULL);