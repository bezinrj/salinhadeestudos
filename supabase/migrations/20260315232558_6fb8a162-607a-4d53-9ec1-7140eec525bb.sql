
-- 1. Create comment_votes table
CREATE TABLE public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES public.question_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  vote_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all votes" ON public.comment_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own votes" ON public.comment_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.comment_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.comment_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Add comment_score to profiles
ALTER TABLE public.profiles ADD COLUMN comment_score integer DEFAULT 0;

-- 3. Trigger to sync comment_score
CREATE OR REPLACE FUNCTION public.update_comment_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _author_id uuid;
  _delta integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO _author_id FROM public.question_comments WHERE id = NEW.comment_id;
    _delta := CASE WHEN NEW.vote_type = 'like' THEN 1 ELSE -1 END;
    UPDATE public.profiles SET comment_score = COALESCE(comment_score, 0) + _delta WHERE id = _author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT user_id INTO _author_id FROM public.question_comments WHERE id = OLD.comment_id;
    _delta := CASE WHEN OLD.vote_type = 'like' THEN -1 ELSE 1 END;
    UPDATE public.profiles SET comment_score = COALESCE(comment_score, 0) + _delta WHERE id = _author_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT user_id INTO _author_id FROM public.question_comments WHERE id = NEW.comment_id;
    _delta := CASE WHEN NEW.vote_type = 'like' THEN 2 ELSE -2 END;
    UPDATE public.profiles SET comment_score = COALESCE(comment_score, 0) + _delta WHERE id = _author_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER on_comment_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_score();

-- 4. Validation trigger for vote_type
CREATE OR REPLACE FUNCTION public.validate_vote_type()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.vote_type NOT IN ('like', 'dislike') THEN
    RAISE EXCEPTION 'vote_type must be like or dislike';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_vote_type_trigger
BEFORE INSERT OR UPDATE ON public.comment_votes
FOR EACH ROW EXECUTE FUNCTION public.validate_vote_type();

-- 5. Storage bucket for comment images
INSERT INTO storage.buckets (id, name, public) VALUES ('comment-images', 'comment-images', true);

CREATE POLICY "Authenticated users can upload comment images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'comment-images');
CREATE POLICY "Anyone can read comment images" ON storage.objects FOR SELECT USING (bucket_id = 'comment-images');
CREATE POLICY "Users can delete own comment images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'comment-images' AND (storage.foldername(name))[1] = auth.uid()::text);
