-- ============ content_access ============
CREATE TABLE public.content_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area text NOT NULL,
  expires_at timestamptz NOT NULL,
  source text NOT NULL DEFAULT 'coupon',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, area)
);

GRANT SELECT ON public.content_access TO authenticated;
GRANT ALL ON public.content_access TO service_role;
ALTER TABLE public.content_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own content access" ON public.content_access
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage content access" ON public.content_access
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ coupons ============
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  percent_off integer NOT NULL CHECK (percent_off > 0 AND percent_off <= 100),
  plan_key text NOT NULL DEFAULT 'combo',
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins view coupons" ON public.coupons
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- ============ coupon_redemptions ============
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)
);

GRANT SELECT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.plan_areas(_plan_key text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(_plan_key,''))
    WHEN 'vade' THEN ARRAY['vade','cadernos']
    WHEN 'juris' THEN ARRAY['juris']
    WHEN 'combo' THEN ARRAY['vade','cadernos','juris']
    WHEN 'pro' THEN ARRAY['vade','cadernos','juris','discursivas']
    WHEN 'monthly' THEN ARRAY['discursivas']
    WHEN 'quarterly' THEN ARRAY['discursivas']
    WHEN 'annual' THEN ARRAY['discursivas']
    ELSE ARRAY['discursivas']
  END;
$$;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _plan_key text)
RETURNS TABLE(valid boolean, percent_off integer, reason text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Faça login para usar um cupom.'; RETURN;
  END IF;

  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(btrim(_code));
  IF NOT FOUND OR NOT c.is_active THEN
    RETURN QUERY SELECT false, 0, 'Cupom inválido.'; RETURN;
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN QUERY SELECT false, 0, 'Cupom expirado.'; RETURN;
  END IF;
  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
    RETURN QUERY SELECT false, 0, 'Cupom esgotado.'; RETURN;
  END IF;
  IF lower(c.plan_key) <> lower(coalesce(_plan_key,'')) THEN
    RETURN QUERY SELECT false, 0, 'Cupom não válido para este plano.'; RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.coupon_redemptions r WHERE r.coupon_id = c.id AND r.user_id = auth.uid()) THEN
    RETURN QUERY SELECT false, 0, 'Você já utilizou este cupom.'; RETURN;
  END IF;

  RETURN QUERY SELECT true, c.percent_off, NULL::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_full_coupon(_code text, _plan_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  _uid uuid := auth.uid();
  _area text;
  _new_exp timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Não autenticado.');
  END IF;

  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(btrim(_code)) FOR UPDATE;
  IF NOT FOUND OR NOT c.is_active
     OR (c.expires_at IS NOT NULL AND c.expires_at < now())
     OR (c.max_uses IS NOT NULL AND c.used_count >= c.max_uses)
     OR lower(c.plan_key) <> lower(coalesce(_plan_key,''))
     OR c.percent_off < 100 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cupom inválido para resgate integral.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.coupon_redemptions r WHERE r.coupon_id = c.id AND r.user_id = _uid) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você já utilizou este cupom.');
  END IF;

  FOREACH _area IN ARRAY public.plan_areas(c.plan_key) LOOP
    INSERT INTO public.content_access (user_id, area, expires_at, source)
    VALUES (_uid, _area, now() + interval '1 month', 'coupon')
    ON CONFLICT (user_id, area) DO UPDATE
      SET expires_at = GREATEST(public.content_access.expires_at, now()) + interval '1 month',
          source = 'coupon';
  END LOOP;

  INSERT INTO public.coupon_redemptions (coupon_id, user_id) VALUES (c.id, _uid);
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = c.id;

  SELECT max(expires_at) INTO _new_exp FROM public.content_access WHERE user_id = _uid;
  RETURN jsonb_build_object('success', true, 'expires_at', _new_exp);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _p public.profiles%ROWTYPE;
  _areas text[] := ARRAY[]::text[];
  _m record;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('discursivas', false, 'vade', false, 'juris', false, 'cadernos', false);
  END IF;

  IF public.has_role(_uid,'admin') OR public.has_role(_uid,'moderator') THEN
    RETURN jsonb_build_object('discursivas', true, 'vade', true, 'juris', true, 'cadernos', true, 'staff', true);
  END IF;

  SELECT * INTO _p FROM public.profiles WHERE id = _uid;

  IF _p.subscription_tier IS NOT NULL AND _p.subscription_end IS NOT NULL AND _p.subscription_end > now() THEN
    _areas := _areas || public.plan_areas(_p.subscription_tier);
  END IF;

  IF _p.banco_geral_expires_at IS NOT NULL AND _p.banco_geral_expires_at > now() THEN
    _areas := _areas || ARRAY['discursivas'];
  END IF;

  FOR _m IN
    SELECT plan_type FROM public.manual_subscriptions
    WHERE user_id = _uid AND is_active = true AND expires_at > now()
  LOOP
    _areas := _areas || public.plan_areas(_m.plan_type);
  END LOOP;

  SELECT _areas || coalesce(array_agg(area), ARRAY[]::text[]) INTO _areas
  FROM public.content_access WHERE user_id = _uid AND expires_at > now();

  RETURN jsonb_build_object(
    'discursivas', 'discursivas' = ANY(_areas),
    'vade', 'vade' = ANY(_areas),
    'juris', 'juris' = ANY(_areas),
    'cadernos', 'cadernos' = ANY(_areas),
    'staff', false
  );
END;
$$;