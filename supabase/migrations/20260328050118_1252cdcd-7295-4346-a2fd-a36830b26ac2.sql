
-- Add public_id column as a serial integer
ALTER TABLE public.weekly_questions ADD COLUMN public_id serial;

-- Backfill existing questions ordered by creation date
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.weekly_questions
)
UPDATE public.weekly_questions q
SET public_id = n.rn
FROM numbered n
WHERE q.id = n.id;

-- Reset sequence to max + 1
SELECT setval(pg_get_serial_sequence('public.weekly_questions', 'public_id'), COALESCE((SELECT MAX(public_id) FROM public.weekly_questions), 0) + 1);

-- Make it unique
ALTER TABLE public.weekly_questions ADD CONSTRAINT weekly_questions_public_id_unique UNIQUE (public_id);
