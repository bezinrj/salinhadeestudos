
-- ============================================
-- SALINHA JURIS
-- ============================================

CREATE TABLE public.juris_julgados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tribunal text DEFAULT '',
  numero text DEFAULT '',
  relator text DEFAULT '',
  data text DEFAULT '',
  info text DEFAULT '',
  area text DEFAULT '',
  nocoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  conceitual text DEFAULT '',
  problema text DEFAULT '',
  solucao text DEFAULT '',
  antes text DEFAULT '',
  depois text DEFAULT '',
  conclusoes text DEFAULT '',
  principios text DEFAULT '',
  doutrina text DEFAULT '',
  jurisprudencia text DEFAULT '',
  abertura text DEFAULT '',
  tese text DEFAULT '',
  integra_texto text DEFAULT '',
  integra_ref text DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_juris_julgados_published ON public.juris_julgados (published, created_at DESC);
CREATE INDEX idx_juris_julgados_area ON public.juris_julgados (area);
CREATE INDEX idx_juris_julgados_tribunal ON public.juris_julgados (tribunal);

CREATE TRIGGER trg_juris_julgados_updated_at
BEFORE UPDATE ON public.juris_julgados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.juris_julgados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read published julgados"
ON public.juris_julgados FOR SELECT TO authenticated
USING (
  published = true
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins/mods insert julgados"
ON public.juris_julgados FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins/mods update julgados"
ON public.juris_julgados FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins/mods delete julgados"
ON public.juris_julgados FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- ============================================
-- Chat usage daily limit
-- ============================================

CREATE TABLE public.juris_chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_juris_chat_usage_user_date ON public.juris_chat_usage (user_id, date);

CREATE TRIGGER trg_juris_chat_usage_updated_at
BEFORE UPDATE ON public.juris_chat_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.juris_chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own juris chat usage"
ON public.juris_chat_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own juris chat usage"
ON public.juris_chat_usage FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own juris chat usage"
ON public.juris_chat_usage FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all juris chat usage"
ON public.juris_chat_usage FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
