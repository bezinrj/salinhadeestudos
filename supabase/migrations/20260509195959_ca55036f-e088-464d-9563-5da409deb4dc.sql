CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome text NOT NULL,
  cargo text NOT NULL,
  texto text NOT NULL,
  estrelas int NOT NULL CHECK (estrelas BETWEEN 1 AND 5),
  publico boolean NOT NULL DEFAULT false,
  aprovado boolean NOT NULL DEFAULT false,
  exibir_carrossel boolean NOT NULL DEFAULT false,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedbacks_insert" ON public.feedbacks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "feedbacks_select_public" ON public.feedbacks
  FOR SELECT USING (
    (publico = true AND aprovado = true)
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "feedbacks_select_carrossel_anon" ON public.feedbacks
  FOR SELECT TO anon USING (publico = true AND aprovado = true AND exibir_carrossel = true);

CREATE POLICY "feedbacks_update_admin" ON public.feedbacks
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "feedbacks_delete_admin" ON public.feedbacks
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_carrossel ON public.feedbacks(exibir_carrossel) WHERE exibir_carrossel = true;