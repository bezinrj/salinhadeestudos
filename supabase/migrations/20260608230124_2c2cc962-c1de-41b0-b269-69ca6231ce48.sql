
CREATE TABLE public.juris_user_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  julgado_id uuid NOT NULL REFERENCES public.juris_julgados(id) ON DELETE CASCADE,
  lido boolean NOT NULL DEFAULT false,
  favorito boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, julgado_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.juris_user_marks TO authenticated;
GRANT ALL ON public.juris_user_marks TO service_role;

ALTER TABLE public.juris_user_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own juris marks"
ON public.juris_user_marks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_juris_user_marks_user ON public.juris_user_marks(user_id);
CREATE INDEX idx_juris_user_marks_julgado ON public.juris_user_marks(julgado_id);

CREATE TRIGGER update_juris_user_marks_updated_at
BEFORE UPDATE ON public.juris_user_marks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
