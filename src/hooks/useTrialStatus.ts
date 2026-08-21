import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrialStatus {
  claimed: boolean;
  active: boolean;
  expiresAt: string | null;
  hoursLeft: number;
}

export function useTrialStatus() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["trial-status", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TrialStatus> => {
      const [{ data: prof }, { data: access }] = await Promise.all([
        (supabase as any).from("profiles").select("trial_claimed_at").eq("id", user!.id).maybeSingle(),
        (supabase as any)
          .from("content_access")
          .select("expires_at, source")
          .eq("user_id", user!.id)
          .eq("source", "trial")
          .order("expires_at", { ascending: false })
          .limit(1),
      ]);

      const expiresAt: string | null = access?.[0]?.expires_at ?? null;
      const ms = expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0;

      return {
        claimed: !!prof?.trial_claimed_at,
        active: ms > 0,
        expiresAt,
        hoursLeft: Math.max(0, Math.ceil(ms / (1000 * 60 * 60))),
      };
    },
  });

  return {
    trial: query.data ?? { claimed: false, active: false, expiresAt: null, hoursLeft: 0 },
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
