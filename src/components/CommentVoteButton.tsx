import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  commentId: string;
}

export function CommentVoteButton({ commentId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["comment-votes", commentId];

  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [{ data: votes }, { data: myVote }] = await Promise.all([
        supabase
          .from("comment_votes")
          .select("vote_type")
          .eq("comment_id", commentId),
        user
          ? supabase
              .from("comment_votes")
              .select("vote_type")
              .eq("comment_id", commentId)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const likes = (votes || []).filter((v) => v.vote_type === "like").length;
      const dislikes = (votes || []).filter((v) => v.vote_type === "dislike").length;
      return { likes, dislikes, myVote: myVote?.vote_type as "like" | "dislike" | null };
    },
  });

  const vote = useMutation({
    mutationFn: async (type: "like" | "dislike") => {
      if (!user) return;
      if (data?.myVote === type) {
        await supabase
          .from("comment_votes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else if (data?.myVote) {
        await supabase
          .from("comment_votes")
          .update({ vote_type: type })
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("comment_votes")
          .insert({ comment_id: commentId, user_id: user.id, vote_type: type });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const likes = data?.likes ?? 0;
  const dislikes = data?.dislikes ?? 0;
  const myVote = data?.myVote ?? null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => vote.mutate("like")}
        disabled={!user || vote.isPending}
        className={cn(
          "flex items-center gap-0.5 text-xs transition-colors",
          myVote === "like"
            ? "text-primary"
            : "text-muted-foreground hover:text-primary"
        )}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        {likes > 0 && <span>{likes}</span>}
      </button>
      <button
        onClick={() => vote.mutate("dislike")}
        disabled={!user || vote.isPending}
        className={cn(
          "flex items-center gap-0.5 text-xs transition-colors",
          myVote === "dislike"
            ? "text-destructive"
            : "text-muted-foreground hover:text-destructive"
        )}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        {dislikes > 0 && <span>{dislikes}</span>}
      </button>
    </div>
  );
}
