
ALTER TABLE public.vm_remissoes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS vm_remissoes_user_id_idx ON public.vm_remissoes(user_id);

DROP POLICY IF EXISTS vm_remissoes_select ON public.vm_remissoes;
DROP POLICY IF EXISTS vm_remissoes_admin_write ON public.vm_remissoes;

CREATE POLICY vm_remissoes_select ON public.vm_remissoes
  FOR SELECT
  USING (
    user_id IS NULL
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY vm_remissoes_insert_own ON public.vm_remissoes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (user_id IS NULL AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)))
  );

CREATE POLICY vm_remissoes_delete_own_or_admin ON public.vm_remissoes
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY vm_remissoes_update_admin ON public.vm_remissoes
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));
