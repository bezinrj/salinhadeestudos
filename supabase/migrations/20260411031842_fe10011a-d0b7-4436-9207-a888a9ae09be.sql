
-- Add study_time to schedule_blocks
ALTER TABLE public.schedule_blocks ADD COLUMN IF NOT EXISTS study_time text DEFAULT '';

-- Student planner settings (available time per schedule)
CREATE TABLE IF NOT EXISTS public.student_planner_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  schedule_id uuid NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  weekly_hours numeric NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, schedule_id)
);

ALTER TABLE public.student_planner_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own planner settings"
  ON public.student_planner_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own planner settings"
  ON public.student_planner_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planner settings"
  ON public.student_planner_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all planner settings"
  ON public.student_planner_settings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Student planner entries
CREATE TABLE IF NOT EXISTS public.student_planner_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  schedule_id uuid NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  block_id uuid NOT NULL REFERENCES public.schedule_blocks(id) ON DELETE CASCADE,
  planned_date date,
  planned_duration text DEFAULT '',
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.student_planner_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own planner entries"
  ON public.student_planner_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planner entries"
  ON public.student_planner_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planner entries"
  ON public.student_planner_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own planner entries"
  ON public.student_planner_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all planner entries"
  ON public.student_planner_entries FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
