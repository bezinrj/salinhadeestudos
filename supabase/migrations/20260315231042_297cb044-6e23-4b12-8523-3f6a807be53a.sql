
-- Create profile_likes table
CREATE TABLE public.profile_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  liked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);

ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all likes" ON public.profile_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own likes" ON public.profile_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can delete own likes" ON public.profile_likes
  FOR DELETE TO authenticated USING (auth.uid() = liker_id);

-- Create question_comments table
CREATE TABLE public.question_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.question_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all comments" ON public.question_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own comments" ON public.question_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.question_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add likes_count to profiles
ALTER TABLE public.profiles ADD COLUMN likes_count integer DEFAULT 0;

-- Create trigger to auto-update likes_count
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.liked_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.liked_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_profile_like_change
AFTER INSERT OR DELETE ON public.profile_likes
FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();
