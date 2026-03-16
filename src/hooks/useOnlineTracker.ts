import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useOnlineTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const upsertSession = async () => {
      await supabase
        .from("user_sessions")
        .upsert(
          { user_id: user.id, last_seen_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
    };

    upsertSession();
    const interval = setInterval(upsertSession, 60_000);

    return () => clearInterval(interval);
  }, [user?.id]);
}
