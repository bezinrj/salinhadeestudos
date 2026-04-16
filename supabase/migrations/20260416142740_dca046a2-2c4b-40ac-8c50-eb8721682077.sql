
CREATE POLICY "Moderators can manage discipline_subjects"
ON public.discipline_subjects
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));
