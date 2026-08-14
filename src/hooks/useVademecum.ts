import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllPaged, fetchAllByIds } from "@/lib/fetchAll";
import type { VmLei, VmArtigo, VmProgresso } from "@/types/vademecum";

const sb = supabase as any;


export function useVmLeis() {
  return useQuery({
    queryKey: ["vm-leis"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("vm_leis")
        .select("*")
        .eq("publicada", true)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as VmLei[];
    },
  });
}

export function useVmLei(leiId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["vm-lei", leiId, user?.id],
    enabled: !!leiId,

    queryFn: async () => {
      const [leiRes, artigos] = await Promise.all([
        sb.from("vm_leis").select("*").eq("id", leiId).single(),
        fetchAllPaged<VmArtigo>((from, to) =>
          sb.from("vm_artigos").select("*").eq("lei_id", leiId).order("ordem", { ascending: true }).range(from, to)
        ),
      ]);
      if (leiRes.error) throw leiRes.error;

      const artigoIds = artigos.map((a) => a.id);

      if (artigoIds.length === 0) {
        return { lei: leiRes.data as VmLei, artigos: [] as VmArtigo[] };
      }

      const [paragrafos, incidencias, remissoes] = await Promise.all([
        fetchAllByIds<any>(artigoIds, (chunk, from, to) =>
          sb.from("vm_paragrafos").select("*").in("artigo_id", chunk).order("ordem", { ascending: true }).range(from, to)
        ),
        fetchAllByIds<any>(artigoIds, (chunk, from, to) =>
          sb.from("vm_incidencias").select("*").in("artigo_id", chunk).range(from, to)
        ),
        user?.id
          ? fetchAllByIds<any>(artigoIds, (chunk, from, to) =>
              sb
                .from("vm_remissoes")
                .select("*, artigo_destino:vm_artigos!vm_remissoes_artigo_destino_id_fkey(id,numero,rotulo,lei_id)")
                .in("artigo_origem_id", chunk)
                .eq("user_id", user.id)
                .range(from, to)
            )
          : Promise.resolve([] as any[]),
      ]);


      const paragrafosByArtigo = new Map<string, any[]>();
      paragrafos.forEach((p: any) => {
        if (!paragrafosByArtigo.has(p.artigo_id)) paragrafosByArtigo.set(p.artigo_id, []);
        paragrafosByArtigo.get(p.artigo_id)!.push(p);
      });
      const incidenciasByArtigo = new Map<string, any[]>();
      incidencias.forEach((i: any) => {
        if (!incidenciasByArtigo.has(i.artigo_id)) incidenciasByArtigo.set(i.artigo_id, []);
        incidenciasByArtigo.get(i.artigo_id)!.push(i);
      });
      const remissoesByArtigo = new Map<string, any[]>();
      remissoes.forEach((r: any) => {
        if (!remissoesByArtigo.has(r.artigo_origem_id)) remissoesByArtigo.set(r.artigo_origem_id, []);
        remissoesByArtigo.get(r.artigo_origem_id)!.push(r);
      });


      const enriched: VmArtigo[] = artigos.map((a) => ({
        ...a,
        paragrafos: paragrafosByArtigo.get(a.id) ?? [],
        incidencias: incidenciasByArtigo.get(a.id) ?? [],
        remissoes: remissoesByArtigo.get(a.id) ?? [],
      }));

      return { lei: leiRes.data as VmLei, artigos: enriched };
    },
  });
}

export function useVmProgresso(leiId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["vm-progresso", user?.id, leiId],
    enabled: !!user?.id && !!leiId,
    queryFn: async () => {
      // get all artigos of this lei first
      const { data: artigos } = await sb.from("vm_artigos").select("id").eq("lei_id", leiId);
      const ids = (artigos ?? []).map((a: any) => a.id);
      if (ids.length === 0) return new Map<string, VmProgresso>();
      const { data, error } = await sb
        .from("vm_progresso")
        .select("artigo_id,lido,marcado")
        .eq("user_id", user!.id)
        .in("artigo_id", ids);
      if (error) throw error;
      const map = new Map<string, VmProgresso>();
      (data ?? []).forEach((p: any) => map.set(p.artigo_id, p));
      return map;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ artigoId, field, value }: { artigoId: string; field: "lido" | "marcado"; value: boolean }) => {
      if (!user?.id) throw new Error("no user");
      const payload: any = {
        user_id: user.id,
        artigo_id: artigoId,
        [field]: value,
      };
      if (field === "lido") payload.data_leitura = value ? new Date().toISOString() : null;
      const { error } = await sb
        .from("vm_progresso")
        .upsert(payload, { onConflict: "user_id,artigo_id" });
      if (error) throw error;
    },
    onMutate: async ({ artigoId, field, value }) => {
      await queryClient.cancelQueries({ queryKey: ["vm-progresso", user?.id, leiId] });
      const prev = queryClient.getQueryData<Map<string, VmProgresso>>(["vm-progresso", user?.id, leiId]);
      const next = new Map(prev ?? []);
      const cur = next.get(artigoId) ?? { artigo_id: artigoId, lido: false, marcado: false };
      next.set(artigoId, { ...cur, [field]: value });
      queryClient.setQueryData(["vm-progresso", user?.id, leiId], next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["vm-progresso", user?.id, leiId], ctx.prev);
    },
  });

  return { progressoMap: query.data ?? new Map<string, VmProgresso>(), toggle: toggleMutation.mutate, isLoading: query.isLoading };
}
