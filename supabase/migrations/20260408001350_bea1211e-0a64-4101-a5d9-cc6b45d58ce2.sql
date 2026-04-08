
-- Create enum for request types
CREATE TYPE public.moderation_request_type AS ENUM ('edit', 'delete');
CREATE TYPE public.moderation_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create moderation_requests table
CREATE TABLE public.moderation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type moderation_request_type NOT NULL,
  question_id UUID NOT NULL REFERENCES public.weekly_questions(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  justification TEXT NOT NULL,
  proposed_data JSONB,
  status moderation_request_status NOT NULL DEFAULT 'pending',
  decided_by UUID,
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderation_requests ENABLE ROW LEVEL SECURITY;

-- Moderators can create requests
CREATE POLICY "Moderators can insert requests"
ON public.moderation_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requester_id
  AND has_role(auth.uid(), 'moderator')
);

-- Moderators can read own requests
CREATE POLICY "Moderators can read own requests"
ON public.moderation_requests
FOR SELECT
TO authenticated
USING (auth.uid() = requester_id);

-- Admins can read all requests
CREATE POLICY "Admins can read all requests"
ON public.moderation_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
ON public.moderation_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Function to check if a user is the absolute admin
CREATE OR REPLACE FUNCTION public.is_absolute_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = 'ffdb2f38-0e5b-4f29-8cb8-712fcfde53f6'::uuid
$$;

-- Trigger to protect absolute admin role
CREATE OR REPLACE FUNCTION public.protect_absolute_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id = 'ffdb2f38-0e5b-4f29-8cb8-712fcfde53f6'::uuid AND OLD.role = 'admin' THEN
      RAISE EXCEPTION 'Cannot remove admin role from the absolute admin';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id = 'ffdb2f38-0e5b-4f29-8cb8-712fcfde53f6'::uuid AND OLD.role = 'admin' THEN
      RAISE EXCEPTION 'Cannot modify admin role of the absolute admin';
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER protect_absolute_admin
BEFORE DELETE OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_absolute_admin_role();

-- Also allow moderators to manage questions via RLS (for reading to create requests)
CREATE POLICY "Moderators can read all questions"
ON public.weekly_questions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'));
