
-- 1. Cronogramas (catálogo de cronogramas)
CREATE TABLE public.cronogramas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text,
  imagem_url text,
  premium boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cronogramas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read cronogramas"
  ON public.cronogramas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage cronogramas"
  ON public.cronogramas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can manage cronogramas"
  ON public.cronogramas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'moderator'));

-- 2. Matriz de tópicos do cronograma
CREATE TABLE public.cronograma_matriz (
  id serial PRIMARY KEY,
  cronograma_id uuid NOT NULL REFERENCES public.cronogramas(id) ON DELETE CASCADE,
  ordem int NOT NULL DEFAULT 0,
  materia text NOT NULL,
  assunto text,
  fonte_legal text,
  link_questoes text,
  link_dod text,
  horas_estimadas int NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cronograma_matriz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read matriz"
  ON public.cronograma_matriz FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage matriz"
  ON public.cronograma_matriz FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can manage matriz"
  ON public.cronograma_matriz FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'moderator'));

-- 3. Progresso do aluno por tópico
CREATE TABLE public.user_topico_progress (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  topico_id int NOT NULL REFERENCES public.cronograma_matriz(id) ON DELETE CASCADE,
  concluido boolean NOT NULL DEFAULT false,
  para_revisao boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topico_id)
);

ALTER TABLE public.user_topico_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.user_topico_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_topico_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_topico_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.user_topico_progress FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all progress"
  ON public.user_topico_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can read all progress"
  ON public.user_topico_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- 4. Calendário pessoal do aluno
CREATE TABLE public.user_calendar_events (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  topico_id int NOT NULL REFERENCES public.cronograma_matriz(id) ON DELETE CASCADE,
  data date NOT NULL,
  horas_dia int NOT NULL DEFAULT 3,
  is_revisao boolean NOT NULL DEFAULT false,
  concluido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own calendar"
  ON public.user_calendar_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar"
  ON public.user_calendar_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar"
  ON public.user_calendar_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar"
  ON public.user_calendar_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all calendar"
  ON public.user_calendar_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can read all calendar"
  ON public.user_calendar_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- 5. Sessões de estudo
CREATE TABLE public.study_sessions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  topico_id int NOT NULL REFERENCES public.cronograma_matriz(id) ON DELETE CASCADE,
  tempo_estudado text,
  questoes int DEFAULT 0,
  acertos int DEFAULT 0,
  percentual_acerto int DEFAULT 0,
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON public.study_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.study_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.study_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.study_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all sessions"
  ON public.study_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can read all sessions"
  ON public.study_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- Trigger para atualizar updated_at no progresso
CREATE TRIGGER update_user_topico_progress_updated_at
  BEFORE UPDATE ON public.user_topico_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
