import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { VmCargo } from "@/types/vademecum";

const sb = supabase as any;

type AddPayload = { artigo_id: string; paragrafo_id: string | null; cargo: VmCargo };

function friendlyError(e: any): string {
  const msg: string = e?.message || "";
  if (e?.code === "23505" || msg.includes("duplicate key")) return "Esse cargo já está marcado neste item.";
  if (e?.code === "42501" || msg.toLowerCase().includes("row-level security")) {
    return "Você não tem permissão para marcar cargos.";
  }
  return msg || "Não foi possível salvar a marcação.";
}

export function useVmIncidencias(leiId: string | undefined) {
  const queryClient = useQueryClient();
  const key = ["vm-lei", leiId];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  /** Aplica uma alteração otimista em todas as caches da lei atual. */
  const patchCache = (fn: (artigos: any[]) => any[]) => {
    const snapshots = queryClient.getQueriesData({ queryKey: key });
    snapshots.forEach(([qKey, data]: any) => {
      if (!data) return;
      if (Array.isArray(data)) {
        queryClient.setQueryData(qKey, fn(data));
      } else if (Array.isArray(data?.artigos)) {
        queryClient.setQueryData(qKey, { ...data, artigos: fn(data.artigos) });
      }
    });
    return snapshots;
  };

  const restore = (snapshots: any[] | undefined) => {
    snapshots?.forEach(([qKey, data]: any) => queryClient.setQueryData(qKey, data));
  };

  const addTag = useMutation({
    mutationFn: async (payload: AddPayload) => {
      const { error } = await sb
        .from("vm_incidencias")
        .upsert(
          {
            artigo_id: payload.artigo_id,
            paragrafo_id: payload.paragrafo_id,
            cargo: payload.cargo,
            quantidade: 1,
          },
          {
            onConflict: payload.paragrafo_id ? "paragrafo_id,cargo" : "artigo_id,cargo",
            ignoreDuplicates: true,
          },
        );
      if (error) throw error;
    },
    onMutate: async (payload: AddPayload) => {
      await queryClient.cancelQueries({ queryKey: key });
      const tempId = `temp-${crypto.randomUUID()}`;
      const snapshots = patchCache((artigos) =>
        artigos.map((a: any) => {
          if (a.id !== payload.artigo_id) return a;
          const exists = (a.incidencias ?? []).some(
            (i: any) => i.cargo === payload.cargo && (i.paragrafo_id ?? null) === payload.paragrafo_id,
          );
          if (exists) return a;
          return {
            ...a,
            incidencias: [
              ...(a.incidencias ?? []),
              {
                id: tempId,
                artigo_id: payload.artigo_id,
                paragrafo_id: payload.paragrafo_id,
                cargo: payload.cargo,
                quantidade: 1,
              },
            ],
          };
        }),
      );
      return { snapshots };
    },
    onError: (e: any, _v, ctx) => {
      restore(ctx?.snapshots);
      toast.error(friendlyError(e));
    },
    onSettled: invalidate,
  });

  const removeTag = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("temp-")) return;
      const { error } = await sb.from("vm_incidencias").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const snapshots = patchCache((artigos) =>
        artigos.map((a: any) => ({
          ...a,
          incidencias: (a.incidencias ?? []).filter((i: any) => i.id !== id),
        })),
      );
      return { snapshots };
    },
    onError: (e: any, _v, ctx) => {
      restore(ctx?.snapshots);
      toast.error(friendlyError(e));
    },
    onSettled: invalidate,
  });

  return { addTag, removeTag };
}
