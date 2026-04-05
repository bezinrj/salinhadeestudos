
-- Drop tables if partially created from failed migration
DROP TABLE IF EXISTS public.schedule_access CASCADE;
DROP TABLE IF EXISTS public.schedule_blocks CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;

-- 1. Create all tables first
CREATE TABLE public.schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  color_theme text DEFAULT 'blue',
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.schedule_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id uuid NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  discipline text NOT NULL,
  subject text DEFAULT '',
  dod_url text DEFAULT '',
  questions_url text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  color text DEFAULT '#3b82f6',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.schedule_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id uuid NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  granted_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(schedule_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_access ENABLE ROW LEVEL SECURITY;

-- 3. Policies for schedules
CREATE POLICY "Admins can do everything on schedules"
  ON public.schedules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can read published schedules they have access to"
  ON public.schedules FOR SELECT TO authenticated
  USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM public.schedule_access sa
      WHERE sa.schedule_id = id AND sa.user_id = auth.uid()
    )
  );

-- 4. Policies for schedule_blocks
CREATE POLICY "Admins can do everything on schedule_blocks"
  ON public.schedule_blocks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can read blocks of accessible schedules"
  ON public.schedule_blocks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.schedules s
      JOIN public.schedule_access sa ON sa.schedule_id = s.id
      WHERE s.id = schedule_id AND s.status = 'published' AND sa.user_id = auth.uid()
    )
  );

-- 5. Policies for schedule_access
CREATE POLICY "Admins can do everything on schedule_access"
  ON public.schedule_access FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can read own access"
  ON public.schedule_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 6. Indexes
CREATE INDEX idx_schedule_blocks_schedule_date ON public.schedule_blocks(schedule_id, block_date);
CREATE INDEX idx_schedule_access_user ON public.schedule_access(user_id);

-- 7. Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_blocks_updated_at
  BEFORE UPDATE ON public.schedule_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
