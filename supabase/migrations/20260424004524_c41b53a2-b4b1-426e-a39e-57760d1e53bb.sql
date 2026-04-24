-- Status enum
DO $$ BEGIN
  CREATE TYPE public.timer_session_status AS ENUM ('running', 'paused', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.study_timer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  discipline text,
  status public.timer_session_status NOT NULL DEFAULT 'running',
  start_time timestamptz NOT NULL DEFAULT now(),
  paused_at timestamptz,
  resumed_at timestamptz,
  end_time timestamptz,
  accumulated_seconds integer NOT NULL DEFAULT 0,
  total_seconds integer,
  original_calculated_seconds integer,
  adjusted_total_seconds integer,
  adjustment_reason text,
  adjusted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_accumulated_nonneg CHECK (accumulated_seconds >= 0),
  CONSTRAINT chk_total_nonneg CHECK (total_seconds IS NULL OR total_seconds >= 0)
);

-- Only one active (running or paused) session per user
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_timer_per_user
  ON public.study_timer_sessions (user_id)
  WHERE status IN ('running', 'paused');

CREATE INDEX IF NOT EXISTS idx_study_timer_user_status
  ON public.study_timer_sessions (user_id, status);

ALTER TABLE public.study_timer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own timer sessions"
  ON public.study_timer_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timer sessions"
  ON public.study_timer_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timer sessions"
  ON public.study_timer_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timer sessions"
  ON public.study_timer_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all timer sessions"
  ON public.study_timer_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_study_timer_sessions_updated_at
  BEFORE UPDATE ON public.study_timer_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();