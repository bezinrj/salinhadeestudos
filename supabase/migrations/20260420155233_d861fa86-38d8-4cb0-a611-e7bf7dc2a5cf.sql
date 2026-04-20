-- Tabela de Matérias (disciplinas raiz)
CREATE TABLE public.disciplines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read disciplines"
  ON public.disciplines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage disciplines"
  ON public.disciplines FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Moderador só pode INSERIR direto
CREATE POLICY "Moderators can insert disciplines"
  ON public.disciplines FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE TRIGGER update_disciplines_updated_at
  BEFORE UPDATE ON public.disciplines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fila de aprovação para Moderadores (edit/delete em matérias)
CREATE TYPE public.discipline_request_type AS ENUM ('edit', 'delete');
CREATE TYPE public.discipline_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.discipline_change_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipline_id uuid NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  request_type public.discipline_request_type NOT NULL,
  justification text NOT NULL,
  proposed_data jsonb,
  status public.discipline_request_status NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.discipline_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all discipline requests"
  ON public.discipline_change_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update discipline requests"
  ON public.discipline_change_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators insert own discipline requests"
  ON public.discipline_change_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id AND public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators read own discipline requests"
  ON public.discipline_change_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id);

CREATE INDEX idx_discipline_requests_status ON public.discipline_change_requests(status);
CREATE INDEX idx_disciplines_sort ON public.disciplines(sort_order, name);