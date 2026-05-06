DROP POLICY IF EXISTS "weekly_questions_select" ON weekly_questions;

CREATE POLICY "weekly_questions_select" ON weekly_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
    OR
    (album_id IS NULL AND is_active = true)
    OR
    (album_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM turmas_acessos
      WHERE user_id = auth.uid()
      AND album_id = weekly_questions.album_id
    ))
  );