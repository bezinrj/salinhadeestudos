
DROP POLICY IF EXISTS vm_remissoes_select ON public.vm_remissoes;
DROP POLICY IF EXISTS vm_remissoes_insert_own ON public.vm_remissoes;
DROP POLICY IF EXISTS vm_remissoes_delete_own_or_admin ON public.vm_remissoes;
DROP POLICY IF EXISTS vm_remissoes_update_admin ON public.vm_remissoes;

CREATE POLICY vm_remissoes_select_own ON public.vm_remissoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY vm_remissoes_insert_own ON public.vm_remissoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY vm_remissoes_update_own ON public.vm_remissoes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY vm_remissoes_delete_own ON public.vm_remissoes
  FOR DELETE USING (auth.uid() = user_id);
