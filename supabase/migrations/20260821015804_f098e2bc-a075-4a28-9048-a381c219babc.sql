REVOKE EXECUTE ON FUNCTION public.link_referral_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_referral_trial(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral_trial(jsonb) TO authenticated;