-- Hide phone column from broad SELECTs on profiles
REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;

-- Allow owners and admins to read their own phone via a secure RPC
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.profiles WHERE id = auth.uid()
$$;

-- Allow service_role (used by webhook edge functions) to update turmas_assinaturas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'turmas_assinaturas'
      AND policyname = 'Service role can update turmas_assinaturas'
  ) THEN
    DROP POLICY "Service role can update turmas_assinaturas" ON public.turmas_assinaturas;
  END IF;
END $$;

CREATE POLICY "Service role can update turmas_assinaturas"
ON public.turmas_assinaturas
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
