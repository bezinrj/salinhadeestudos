
-- Allow moderators to insert new questions
CREATE POLICY "Moderators can insert questions"
ON public.weekly_questions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to update questions
CREATE POLICY "Moderators can update questions"
ON public.weekly_questions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));
