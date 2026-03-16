
-- Weekly questions table
CREATE TABLE public.weekly_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  career text NOT NULL,
  discipline text NOT NULL,
  statement text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Médio',
  barema jsonb,
  deadline timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.weekly_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on weekly_questions"
  ON public.weekly_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read active weekly questions"
  ON public.weekly_questions FOR SELECT TO authenticated
  USING (is_active = true);

-- Weekly waitlist table
CREATE TABLE public.weekly_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  notified boolean NOT NULL DEFAULT false,
  UNIQUE (user_id)
);

ALTER TABLE public.weekly_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own waitlist entry"
  ON public.weekly_waitlist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own waitlist entry"
  ON public.weekly_waitlist FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own waitlist entry"
  ON public.weekly_waitlist FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own waitlist entry"
  ON public.weekly_waitlist FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on weekly_waitlist"
  ON public.weekly_waitlist FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for waitlist counter
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_waitlist;
