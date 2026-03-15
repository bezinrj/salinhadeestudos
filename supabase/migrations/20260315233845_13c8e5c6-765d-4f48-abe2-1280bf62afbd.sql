-- Add foreign key from question_comments to profiles
ALTER TABLE public.question_comments
  ADD CONSTRAINT question_comments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from comment_votes to profiles
ALTER TABLE public.comment_votes
  ADD CONSTRAINT comment_votes_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;