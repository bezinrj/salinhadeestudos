
-- Create enum for report problem types
CREATE TYPE public.report_problem_type AS ENUM (
  'gabarito_errado',
  'correcao_inconsistente',
  'problema_enunciado',
  'materia_errada',
  'barema_incoerente',
  'erro_digitacao',
  'outro'
);

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM (
  'pendente',
  'em_analise',
  'procedente',
  'improcedente',
  'corrigido'
);

-- Create table
CREATE TABLE public.question_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid NOT NULL REFERENCES public.weekly_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  problem_type public.report_problem_type NOT NULL,
  description text NOT NULL,
  status public.report_status NOT NULL DEFAULT 'pendente',
  admin_note text,
  attachment_url text,
  attachment_path text,
  attachment_name text,
  attachment_size integer,
  attachment_type text,
  attachment_expires_at timestamp with time zone,
  attachment_deleted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own reports"
  ON public.question_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own reports"
  ON public.question_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all reports"
  ON public.question_reports FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reports"
  ON public.question_reports FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for anti-spam lookups
CREATE INDEX idx_question_reports_user_question
  ON public.question_reports (user_id, question_id, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_question_reports_updated_at
  BEFORE UPDATE ON public.question_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-attachments', 'report-attachments', true);

-- Storage policies
CREATE POLICY "Users can upload report attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'report-attachments');

CREATE POLICY "Anyone can read report attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-attachments');

CREATE POLICY "Admins can delete report attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'report-attachments' AND public.has_role(auth.uid(), 'admin'::app_role));
