
ALTER TABLE public.weekly_questions ADD COLUMN IF NOT EXISTS banca text DEFAULT null;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT null;
