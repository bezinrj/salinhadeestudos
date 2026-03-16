
CREATE TABLE public.weekly_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.weekly_questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.weekly_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own answers" ON public.weekly_answers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON public.weekly_answers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all answers" ON public.weekly_answers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
