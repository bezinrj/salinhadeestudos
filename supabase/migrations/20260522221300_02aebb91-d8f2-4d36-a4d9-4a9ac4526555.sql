
DROP POLICY IF EXISTS "weekly_questions_select" ON public.weekly_questions;

CREATE POLICY "weekly_questions_select"
ON public.weekly_questions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR (album_id IS NULL AND is_active = true)
  OR (
    album_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.turmas_acessos ta
      WHERE ta.user_id = auth.uid() AND ta.album_id = weekly_questions.album_id
    )
  )
);
