CREATE POLICY "Admins can delete any comment"
ON public.question_comments FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));