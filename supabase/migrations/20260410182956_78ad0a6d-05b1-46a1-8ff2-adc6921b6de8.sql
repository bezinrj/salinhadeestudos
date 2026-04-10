-- Add new columns to schedules
ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS career text,
  ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Create storage bucket for schedule covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('schedule-covers', 'schedule-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for schedule covers
CREATE POLICY "Anyone can view schedule covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'schedule-covers');

CREATE POLICY "Admins can upload schedule covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'schedule-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update schedule covers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'schedule-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete schedule covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'schedule-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow all authenticated users to view published schedules (for library page)
DROP POLICY IF EXISTS "Users can read published schedules they have access to" ON public.schedules;
CREATE POLICY "Authenticated can read published schedules"
ON public.schedules FOR SELECT TO authenticated
USING (
  status = 'published'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM schedule_access sa
    WHERE sa.schedule_id = schedules.id AND sa.user_id = auth.uid()
  )
);

-- Allow admins to delete schedules (currently ALL policy covers it, but let's ensure delete on blocks too)
CREATE POLICY "Admins can delete schedule blocks"
ON public.schedule_blocks FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));