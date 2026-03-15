
CREATE OR REPLACE FUNCTION public.validate_vote_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.vote_type NOT IN ('like', 'dislike') THEN
    RAISE EXCEPTION 'vote_type must be like or dislike';
  END IF;
  RETURN NEW;
END;
$$;
