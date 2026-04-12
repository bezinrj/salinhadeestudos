
-- Add image/PDF upload fields to weekly_answers
ALTER TABLE public.weekly_answers
  ADD COLUMN IF NOT EXISTS submission_type text NOT NULL DEFAULT 'texto_manual',
  ADD COLUMN IF NOT EXISTS uploaded_file_url text,
  ADD COLUMN IF NOT EXISTS uploaded_file_name text,
  ADD COLUMN IF NOT EXISTS ocr_text text,
  ADD COLUMN IF NOT EXISTS transcription_reviewed_text text,
  ADD COLUMN IF NOT EXISTS direct_correction_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS handwriting_legibility_note text,
  ADD COLUMN IF NOT EXISTS handwriting_legibility_level text,
  ADD COLUMN IF NOT EXISTS ocr_confidence numeric,
  ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'completed';

-- Storage bucket for answer uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('answer-uploads', 'answer-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own answer files
CREATE POLICY "Users can upload own answer files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'answer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read their own answer files
CREATE POLICY "Users can read own answer files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'answer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can read all answer files
CREATE POLICY "Admins can read all answer files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'answer-uploads' AND has_role(auth.uid(), 'admin'::app_role));
