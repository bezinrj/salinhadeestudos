CREATE POLICY "Moderators can update waitlist"
ON public.weekly_waitlist
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));