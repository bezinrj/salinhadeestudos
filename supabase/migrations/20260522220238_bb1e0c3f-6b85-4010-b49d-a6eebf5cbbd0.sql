
-- 1) Helper: active subscription check
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND (
        (p.subscription_tier IS NOT NULL AND p.subscription_end IS NOT NULL AND p.subscription_end > now())
        OR (p.banco_geral_expires_at IS NOT NULL AND p.banco_geral_expires_at > now())
      )
  ) OR EXISTS (
    SELECT 1 FROM public.manual_subscriptions m
    WHERE m.user_id = _user_id
      AND m.is_active = true
      AND m.expires_at > now()
  );
$$;

-- 2) weekly_questions: gate premium content
DROP POLICY IF EXISTS "weekly_questions_select" ON public.weekly_questions;

CREATE POLICY "weekly_questions_select"
ON public.weekly_questions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR (
    album_id IS NULL
    AND is_active = true
    AND (
      COALESCE(is_premium, false) = false
      OR public.has_active_subscription(auth.uid())
    )
  )
  OR (
    album_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.turmas_acessos ta
      WHERE ta.user_id = auth.uid() AND ta.album_id = weekly_questions.album_id
    )
  )
);

-- 3) turmas_planos: require authenticated
DROP POLICY IF EXISTS "turmas_planos_select" ON public.turmas_planos;

CREATE POLICY "turmas_planos_select"
ON public.turmas_planos
FOR SELECT
TO authenticated
USING (true);

-- 4) schedule_blocks: align with schedules read policy (allow free published + access grants + admins)
DROP POLICY IF EXISTS "Users can read blocks of accessible schedules" ON public.schedule_blocks;

CREATE POLICY "Users can read blocks of accessible schedules"
ON public.schedule_blocks
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.schedules s
    WHERE s.id = schedule_blocks.schedule_id
      AND s.status = 'published'
      AND (
        s.access_type = 'free'
        OR EXISTS (
          SELECT 1 FROM public.schedule_access sa
          WHERE sa.schedule_id = s.id AND sa.user_id = auth.uid()
        )
      )
  )
);
