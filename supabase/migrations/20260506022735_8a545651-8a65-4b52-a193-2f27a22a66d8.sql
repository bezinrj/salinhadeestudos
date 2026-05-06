DROP POLICY IF EXISTS "turmas_questoes_select" ON turmas_questoes;

CREATE POLICY "turmas_questoes_select" ON turmas_questoes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
    OR
    EXISTS (SELECT 1 FROM turmas_acessos WHERE user_id = auth.uid() AND album_id = turmas_questoes.album_id)
  );