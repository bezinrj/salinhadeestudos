ALTER TABLE public.coupon_redemptions
  ADD COLUMN IF NOT EXISTS percent_off integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'granted';

UPDATE public.coupon_redemptions SET percent_off = 100, status = 'granted' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);

CREATE OR REPLACE FUNCTION public.register_coupon_use(_code text, _plan_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Não autenticado.');
  END IF;

  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(btrim(_code)) FOR UPDATE;
  IF NOT FOUND OR NOT c.is_active
     OR (c.expires_at IS NOT NULL AND c.expires_at < now())
     OR (c.max_uses IS NOT NULL AND c.used_count >= c.max_uses)
     OR lower(c.plan_key) <> lower(coalesce(_plan_key,'')) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cupom inválido.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.coupon_redemptions r WHERE r.coupon_id = c.id AND r.user_id = _uid) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você já utilizou este cupom.');
  END IF;

  INSERT INTO public.coupon_redemptions (coupon_id, user_id, percent_off, status)
  VALUES (c.id, _uid, c.percent_off, 'checkout');
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = c.id;

  RETURN jsonb_build_object('success', true, 'percent_off', c.percent_off);
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

  INSERT INTO public.coupon_redemptions (coupon_id, user_id, percent_off, status)
  VALUES (c.id, _uid, 100, 'granted');
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = c.id;

  SELECT max(expires_at) INTO _new_exp FROM public.content_access WHERE user_id = _uid;
  RETURN jsonb_build_object('success', true, 'expires_at', _new_exp);
END;
$$;