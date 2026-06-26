
-- Revoke column-level SELECT on sensitive profile fields from client roles.
-- These fields are accessible only via SECURITY DEFINER RPCs (get_my_billing, get_my_phone).
REVOKE SELECT (phone, price_id, subscription_end, banco_geral_expires_at)
  ON public.profiles FROM anon, authenticated, PUBLIC;

-- Revoke column-level SELECT on Stripe internal IDs from client roles.
REVOKE SELECT (stripe_payment_intent_id, stripe_checkout_session_id)
  ON public.turmas_assinaturas FROM anon, authenticated, PUBLIC;

-- Ensure no UPDATE/DELETE is possible on weekly_answers by client roles.
-- Single-shot submissions: RLS already lacks UPDATE/DELETE policy; revoke table-level
-- privileges as defense in depth so the privilege itself is gone.
REVOKE UPDATE, DELETE ON public.weekly_answers FROM anon, authenticated, PUBLIC;
