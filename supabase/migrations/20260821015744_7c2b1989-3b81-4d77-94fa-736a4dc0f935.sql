-- 1. referrals
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_name text NOT NULL,
  friend_email text NOT NULL,
  friend_whatsapp text,
  invite_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  email_sent_at timestamptz,
  whatsapp_opened_at timestamptz,
  signed_up_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX referrals_invite_token_key ON public.referrals(invite_token);
CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_id);
CREATE INDEX referrals_email_idx ON public.referrals(lower(friend_email));

GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users insert own referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Users update own referrals" ON public.referrals
  FOR UPDATE TO authenticated
  USING (referrer_id = auth.uid())
  WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Admins manage referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. trial claim marker
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_claimed_at timestamptz;

-- 3. claim RPC
CREATE OR REPLACE FUNCTION public.claim_referral_trial(_indicacoes jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  _row public.referrals%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Não autenticado.');
  END IF;

  SELECT * INTO _p FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Perfil não encontrado.');
  END IF;

  IF _p.trial_claimed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você já utilizou sua degustação gratuita.');
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

    _emails := _emails || _email;
    _valid := _valid || jsonb_build_object('name', _name, 'email', _email, 'whatsapp', _wpp);
  END LOOP;

  IF jsonb_array_length(_valid) < 2 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Informe ao menos 2 amigos com nome, e-mail válido e WhatsApp com DDD.');
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_valid)
  LOOP
    INSERT INTO public.referrals (referrer_id, friend_name, friend_email, friend_whatsapp)
    VALUES (_uid, _item->>'name', _item->>'email', _item->>'whatsapp')
    RETURNING * INTO _row;
    _valid := jsonb_set(_valid, ARRAY[(jsonb_array_length(_valid) - 1)::text], _valid->-1);
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
      WHERE r.referrer_id = _uid AND r.created_at > now() - interval '1 minute'
    )
  );
END;
$$;

-- 4. link signups to referrals + backfill contact info
CREATE OR REPLACE FUNCTION public.link_referral_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  SELECT lower(email) INTO _email FROM auth.users WHERE id = NEW.id;
  IF _email IS NOT NULL THEN
    UPDATE public.referrals
    SET signed_up_user_id = NEW.id
    WHERE lower(friend_email) = _email AND signed_up_user_id IS NULL;
  END IF;

  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    INSERT INTO public.user_contact_info (user_id, whatsapp)
    VALUES (NEW.id, NEW.phone)
    ON CONFLICT (user_id) DO UPDATE
      SET whatsapp = COALESCE(NULLIF(public.user_contact_info.whatsapp, ''), EXCLUDED.whatsapp);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_referral_signup ON public.profiles;
CREATE TRIGGER trg_link_referral_signup
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.link_referral_signup();

INSERT INTO public.user_contact_info (user_id, whatsapp)
SELECT p.id, p.phone
FROM public.profiles p
WHERE p.phone IS NOT NULL AND p.phone <> ''
ON CONFLICT (user_id) DO UPDATE
  SET whatsapp = COALESCE(NULLIF(public.user_contact_info.whatsapp, ''), EXCLUDED.whatsapp);