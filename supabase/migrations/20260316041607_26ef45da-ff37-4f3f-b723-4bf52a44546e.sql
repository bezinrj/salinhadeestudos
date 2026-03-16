
ALTER TABLE public.weekly_questions 
  ADD COLUMN mirror_text text,
  ADD COLUMN ideal_answer text;
