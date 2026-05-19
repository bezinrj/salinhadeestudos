-- Free plan usage tracker: free users get 3 premium question attempts per calendar month
CREATE TABLE IF NOT EXISTS public.free_plan_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_free_plan_usage_user_month
  ON public.free_plan_usage (user_id, used_at);

ALTER TABLE public.free_plan_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own free usage"
  ON public.free_plan_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own free usage"
  ON public.free_plan_usage FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage free usage"
  ON public.free_plan_usage FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));