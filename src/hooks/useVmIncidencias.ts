import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { VmCargo } from "@/types/vademecum";

const sb = supabase as any;

export function useVmIncidencias(leiId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["vm-lei", leiId] });

  const addTag = useMutation({
    mutationFn: async (payload: { artigo_id: string; paragrafo_id: string | null; cargo: VmCargo }) => {
      const { error } = await sb.from("vm_incidencias").insert({
        artigo_id: payload.artigo_id,
        paragrafo_id: payload.paragrafo_id,
        cargo: payload.cargo,
        quantidade: 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error("Erro ao marcar cargo: " + e.message),
  });

  const removeTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("vm_incidencias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error("Erro ao remover marcação: " + e.message),
  });

  return { addTag, removeTag };
}
