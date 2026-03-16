
-- Add new columns to weekly_questions for unified question management
ALTER TABLE public.weekly_questions 
  ADD COLUMN IF NOT EXISTS is_weekly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS participants integer NOT NULL DEFAULT 0;

-- Make deadline nullable (regular questions don't need deadlines)
ALTER TABLE public.weekly_questions ALTER COLUMN deadline DROP NOT NULL;

-- Update existing weekly questions to have is_weekly = true
UPDATE public.weekly_questions SET is_weekly = true WHERE is_weekly = false;

-- Allow all authenticated users to read all questions (not just active ones)
DROP POLICY IF EXISTS "Authenticated can read active weekly questions" ON public.weekly_questions;
CREATE POLICY "Authenticated can read all questions" ON public.weekly_questions
  FOR SELECT TO authenticated USING (true);
