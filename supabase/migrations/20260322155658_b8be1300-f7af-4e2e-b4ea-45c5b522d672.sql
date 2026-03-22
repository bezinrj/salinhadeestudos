
-- Table for managing subjects per discipline
CREATE TABLE public.discipline_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline text NOT NULL,
  subject text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(discipline, subject)
);

ALTER TABLE public.discipline_subjects ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage discipline_subjects"
ON public.discipline_subjects
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can read
CREATE POLICY "Authenticated can read discipline_subjects"
ON public.discipline_subjects
FOR SELECT
TO authenticated
USING (true);

-- Add subject column to weekly_questions
ALTER TABLE public.weekly_questions ADD COLUMN IF NOT EXISTS subject text;
