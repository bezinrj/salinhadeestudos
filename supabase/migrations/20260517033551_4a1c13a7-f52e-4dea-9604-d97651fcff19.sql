ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_end timestamptz,
  ADD COLUMN IF NOT EXISTS price_id text;

CREATE OR REPLACE FUNCTION public.sync_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.manual_subscriptions
  SET is_active = false
  WHERE is_active = true
    AND expires_at < now();

  UPDATE public.profiles
  SET subscription_tier = NULL,
      subscription_end = NULL,
      price_id = NULL
  WHERE subscription_tier IS NOT NULL
    AND subscription_end IS NOT NULL
    AND subscription_end < now();

  UPDATE public.profiles
  SET subscription_tier = NULL
  WHERE subscription_tier IS NOT NULL
    AND subscription_end IS NULL
    AND banco_geral_expires_at IS NOT NULL
    AND banco_geral_expires_at < now();
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'sync-expired-subscriptions-hourly'
  ) THEN
    PERFORM cron.schedule(
      'sync-expired-subscriptions-hourly',
      '0 * * * *',
      'SELECT public.sync_expired_subscriptions();'
    );
  END IF;
END $$;

SELECT public.sync_expired_subscriptions();