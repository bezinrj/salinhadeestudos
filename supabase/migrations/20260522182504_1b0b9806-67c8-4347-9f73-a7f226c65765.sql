
-- ============================================
-- 1. PROFILES: column-level revoke for sensitive billing fields
-- ============================================
REVOKE SELECT (subscription_end, price_id, banco_geral_expires_at) ON public.profiles FROM authenticated, anon;

-- SECURITY DEFINER function so user can read own billing
CREATE OR REPLACE FUNCTION public.get_my_billing()
RETURNS TABLE(subscription_tier text, subscription_end timestamptz, price_id text, banco_geral_expires_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT subscription_tier, subscription_end, price_id, banco_geral_expires_at
  FROM public.profiles
  WHERE id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_billing() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_billing() TO authenticated;

-- ============================================
-- 2. TURMAS_RESPOSTAS: remove vazamento de respostas alheias
-- ============================================
DROP POLICY IF EXISTS turmas_respostas_select ON public.turmas_respostas;
CREATE POLICY turmas_respostas_select ON public.turmas_respostas
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- ============================================
-- 3. WEEKLY_QUESTIONS: remover política permissiva
-- ============================================
DROP POLICY IF EXISTS "Authenticated can read all questions" ON public.weekly_questions;

-- ============================================
-- 4. TURMAS_ACESSOS: restringir INSERT
-- ============================================
DROP POLICY IF EXISTS turmas_acessos_insert ON public.turmas_acessos;
CREATE POLICY turmas_acessos_insert ON public.turmas_acessos
FOR INSERT TO public
WITH CHECK (
  auth.role() = 'service_role'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- ============================================
-- 5. TURMAS_ASSINATURAS: restringir INSERT
-- ============================================
DROP POLICY IF EXISTS turmas_assinaturas_insert ON public.turmas_assinaturas;
CREATE POLICY turmas_assinaturas_insert ON public.turmas_assinaturas
FOR INSERT TO public
WITH CHECK (
  auth.role() = 'service_role'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- ============================================
-- 6. STORAGE: report-attachments privado + path checks
-- ============================================
UPDATE storage.buckets SET public = false WHERE id = 'report-attachments';

DROP POLICY IF EXISTS "Anyone can read report attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload report attachments" ON storage.objects;

CREATE POLICY "Report attachments: owner and admins read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'report-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  )
);

CREATE POLICY "Report attachments: users upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'report-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 7. STORAGE: comment-images path check on upload
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can upload comment images" ON storage.objects;
CREATE POLICY "Comment images: users upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'comment-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 8. FUNCTION SEARCH PATH (pgmq helpers)
-- ============================================
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
