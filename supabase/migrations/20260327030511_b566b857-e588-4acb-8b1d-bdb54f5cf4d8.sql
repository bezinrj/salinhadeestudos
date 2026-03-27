ALTER TABLE public.discipline_subjects ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Backfill existing rows with sequential order grouped by discipline+category
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY discipline ORDER BY category NULLS LAST, subject) AS rn
  FROM public.discipline_subjects
)
UPDATE public.discipline_subjects ds
SET sort_order = numbered.rn
FROM numbered
WHERE ds.id = numbered.id;