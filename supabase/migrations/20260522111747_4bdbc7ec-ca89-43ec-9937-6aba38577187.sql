
ALTER TABLE public.weekly_questions
  ADD COLUMN IF NOT EXISTS disciplines text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS subjects text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_weekly_questions_disciplines ON public.weekly_questions USING GIN (disciplines);
CREATE INDEX IF NOT EXISTS idx_weekly_questions_subjects ON public.weekly_questions USING GIN (subjects);
