REVOKE EXECUTE ON FUNCTION public.register_coupon_use(text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.register_coupon_use(text, text) TO authenticated, service_role;