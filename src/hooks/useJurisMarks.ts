import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface JurisMark {
  julgado_id: string;
  lido: boolean;
  favorito: boolean;
}

export function useJurisMarks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: marks } = useQuery({
    queryKey: ["juris-user-marks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("juris_user_marks" as any)
        .select("julgado_id, lido, favorito")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as JurisMark[];
    },
  });

  const map = new Map<string, JurisMark>();
  (marks ?? []).forEach((m) => map.set(m.julgado_id, m));

  const toggle = useMutation({
    mutationFn: async ({ julgado_id, field }: { julgado_id: string; field: "lido" | "favorito" }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const current = map.get(julgado_id);
      const next = {
        user_id: user.id,
        julgado_id,
        lido: current?.lido ?? false,
        favorito: current?.favorito ?? false,
      };
      next[field] = !next[field];
      const { error } = await supabase
        .from("juris_user_marks" as any)
        .upsert(next, { onConflict: "user_id,julgado_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["juris-user-marks", user?.id] }),
  });

  return {
    isLido: (id: string) => !!map.get(id)?.lido,
    isFavorito: (id: string) => !!map.get(id)?.favorito,
    toggleLido: (id: string) => toggle.mutate({ julgado_id: id, field: "lido" }),
    toggleFavorito: (id: string) => toggle.mutate({ julgado_id: id, field: "favorito" }),
  };
}
