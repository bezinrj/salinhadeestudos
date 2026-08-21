import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const TRIAL_COOLDOWN_DAYS = 30;

export interface TrialStatus {
  claimed: boolean;
  claimedAt: string | null;
  active: boolean;
  expiresAt: string | null;
  hoursLeft: number;
  /** Já resgatou antes, mas passou o período de carência e não tem degustação ativa */
  eligibleAgain: boolean;
  /** Pode resgatar agora (nunca resgatou ou já passou a carência) */
  canClaim: boolean;
}

const EMPTY: TrialStatus = {
  claimed: false,
  claimedAt: null,
  active: false,
  expiresAt: null,
  hoursLeft: 0,
  eligibleAgain: false,
  canClaim: true,
};

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
      const active = ms > 0;

      const claimedAt: string | null = prof?.trial_claimed_at ?? null;
      const claimed = !!claimedAt;
      const cooldownMs = TRIAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const cooldownOver = claimed ? Date.now() - new Date(claimedAt!).getTime() >= cooldownMs : false;
      const eligibleAgain = claimed && cooldownOver && !active;

      return {
        claimed,
        claimedAt,
        active,
        expiresAt,
        hoursLeft: Math.max(0, Math.ceil(ms / (1000 * 60 * 60))),
        eligibleAgain,
        canClaim: !active && (!claimed || cooldownOver),
      };
    },
  });

  return {
    trial: query.data ?? EMPTY,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
