-- Revoke direct SELECT on billing-private profile columns from anon/authenticated.
-- Users can still read their own billing via the existing get_my_billing() SECURITY DEFINER function.
REVOKE SELECT (subscription_end, price_id, banco_geral_expires_at) ON public.profiles FROM anon, authenticated;