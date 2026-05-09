
CREATE TABLE public.user_contact_info (
  user_id uuid PRIMARY KEY,
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_contact_select_own_or_admin"
  ON public.user_contact_info FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "user_contact_insert_own"
  ON public.user_contact_info FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_contact_update_own_or_admin"
  ON public.user_contact_info FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "user_contact_delete_admin"
  ON public.user_contact_info FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_contact_info_updated_at
  BEFORE UPDATE ON public.user_contact_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
