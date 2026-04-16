
CREATE TABLE public.user_fonte_progress (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  topico_id integer NOT NULL REFERENCES public.cronograma_matriz(id) ON DELETE CASCADE,
  sigla text NOT NULL,
  concluido boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topico_id, sigla)
);

ALTER TABLE public.user_fonte_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own fonte progress" ON public.user_fonte_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fonte progress" ON public.user_fonte_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fonte progress" ON public.user_fonte_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fonte progress" ON public.user_fonte_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all fonte progress" ON public.user_fonte_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Moderators can read all fonte progress" ON public.user_fonte_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'moderator'));
