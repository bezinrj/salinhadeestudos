import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfileLikeButton({ profileId }: { profileId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: liked = false } = useQuery({
    queryKey: ["profile-like", profileId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("profile_likes")
        .select("id")
        .eq("liker_id", user.id)
        .eq("liked_id", profileId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: likesCount = 0 } = useQuery({
    queryKey: ["profile-likes-count", profileId],
    queryFn: async () => {
      const { count } = await supabase
        .from("profile_likes")
        .select("*", { count: "exact", head: true })
        .eq("liked_id", profileId);
      return count || 0;
    },
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (liked) {
        await supabase.from("profile_likes").delete().eq("liker_id", user.id).eq("liked_id", profileId);
      } else {
        await supabase.from("profile_likes").insert({ liker_id: user.id, liked_id: profileId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-like", profileId] });
      queryClient.invalidateQueries({ queryKey: ["profile-likes-count", profileId] });
    },
  });

  if (!user || user.id === profileId) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleLike.mutate()}
      disabled={toggleLike.isPending}
      className={cn(
        "border-border gap-1.5 transition-all",
        liked && "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive"
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      <span>{likesCount}</span>
    </Button>
  );
}
