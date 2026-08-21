CREATE OR REPLACE FUNCTION public.claim_referral_trial(_indicacoes jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _my_email text;
  _p public.profiles%ROWTYPE;
  _item jsonb;
  _emails text[] := ARRAY[]::text[];
  _valid jsonb := '[]'::jsonb;
  _name text;
  _email text;
  _wpp text;
  _expires timestamptz := now() + interval '3 days';
  _area text;
  _started timestamptz := now();
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Não autenticado.');
  END IF;

  SELECT * INTO _p FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Perfil não encontrado.');
  END IF;

  IF _p.trial_claimed_at IS NOT NULL AND _p.trial_claimed_at > now() - interval '30 days' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você poderá resgatar uma nova degustação 30 dias após o último resgate.');
  END IF;

  SELECT lower(email) INTO _my_email FROM auth.users WHERE id = _uid;

  FOR _item IN SELECT * FROM jsonb_array_elements(coalesce(_indicacoes, '[]'::jsonb))
  LOOP
    _name := btrim(coalesce(_item->>'name', ''));
    _email := lower(btrim(coalesce(_item->>'email', '')));
    _wpp := nullif(regexp_replace(coalesce(_item->>'whatsapp',''), '\D', '', 'g'), '');

    IF _name = '' OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
      CONTINUE;
    END IF;
    IF _email = _my_email OR _email = ANY(_emails) THEN
      CONTINUE;
    END IF;
    IF _wpp IS NULL OR length(_wpp) < 10 OR length(_wpp) > 13 THEN
      CONTINUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.referrals r
      WHERE r.referrer_id = _uid AND lower(r.friend_email) = _email
    ) THEN
      CONTINUE;
    END IF;

    _emails := _emails || _email;
    _valid := _valid || jsonb_build_object('name', _name, 'email', _email, 'whatsapp', _wpp);
  END LOOP;

  IF jsonb_array_length(_valid) < 2 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Informe ao menos 2 amigos novos com nome, e-mail válido e WhatsApp com DDD.');
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_valid)
  LOOP
    INSERT INTO public.referrals (referrer_id, friend_name, friend_email, friend_whatsapp)
    VALUES (_uid, _item->>'name', _item->>'email', _item->>'whatsapp');
  END LOOP;

  FOREACH _area IN ARRAY ARRAY['discursivas','vade','juris','cadernos'] LOOP
    INSERT INTO public.content_access (user_id, area, expires_at, source)
    VALUES (_uid, _area, _expires, 'trial')
    ON CONFLICT (user_id, area) DO UPDATE
      SET expires_at = GREATEST(public.content_access.expires_at, _expires),
          source = CASE WHEN public.content_access.expires_at > _expires THEN public.content_access.source ELSE 'trial' END;
  END LOOP;

  UPDATE public.profiles SET trial_claimed_at = now() WHERE id = _uid;

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', _expires,
    'invites', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'name', r.friend_name, 'email', r.friend_email,
        'whatsapp', r.friend_whatsapp, 'token', r.invite_token
      ) ORDER BY r.created_at), '[]'::jsonb)
      FROM public.referrals r
      WHERE r.referrer_id = _uid AND r.created_at >= _started
    )
  );
END;
$function$;