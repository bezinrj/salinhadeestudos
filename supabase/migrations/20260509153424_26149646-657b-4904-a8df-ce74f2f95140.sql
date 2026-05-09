CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pend record;
  v_album_id uuid;
  v_now timestamptz := now();
  v_base timestamptz;
  v_new_exp timestamptz;
  v_current_exp timestamptz;
BEGIN
  INSERT INTO public.profiles (id, username, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', '')
  );

  -- Process Hotmart pending purchases for this email
  FOR v_pend IN
    SELECT * FROM public.hotmart_pendentes
    WHERE lower(email) = lower(NEW.email) AND status = 'pending'
  LOOP
    -- Grant access to each album
    IF array_length(v_pend.album_ids, 1) > 0 THEN
      FOREACH v_album_id IN ARRAY v_pend.album_ids LOOP
        INSERT INTO public.turmas_acessos (user_id, album_id, is_manual)
        VALUES (NEW.id, v_album_id, false)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;

    -- Extend banco_geral_expires_at
    SELECT banco_geral_expires_at INTO v_current_exp FROM public.profiles WHERE id = NEW.id;
    v_base := CASE WHEN v_current_exp IS NOT NULL AND v_current_exp > v_now THEN v_current_exp ELSE v_now END;
    v_new_exp := v_base + (v_pend.meses_assinatura || ' months')::interval;
    UPDATE public.profiles SET banco_geral_expires_at = v_new_exp WHERE id = NEW.id;

    -- Mark as processed
    UPDATE public.hotmart_pendentes
    SET status = 'processed', processado_at = v_now
    WHERE id = v_pend.id;
  END LOOP;

  RETURN NEW;
END;
$function$;