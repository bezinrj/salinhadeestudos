import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsModerator() {
  const { user } = useAuth();

  const { data: isModerator = false, isLoading: loading } = useQuery({
    queryKey: ["is-moderator", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "moderator",
      });
      if (error) {
        console.error("Error checking moderator role:", error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { isModerator, loading };
}
