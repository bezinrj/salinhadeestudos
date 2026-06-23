import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type {
  VmComentario,
  VmMarcacao,
  VmNotaProfessor,
  VmNotaPrivada,
  VmHighlightCor,
} from "@/types/vademecum";

const sb = supabase as any;

// ============ Comentários ============
export function useVmComentarios(artigoId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["vm-comentarios", artigoId],
    enabled: !!artigoId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("vm_comentarios")
        .select("*")
        .eq("artigo_id", artigoId)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let profMap = new Map<string, { name?: string; username?: string; avatar_url?: string | null }>();
      if (userIds.length > 0) {
        const { data: profs } = await sb
          .from("profiles")
          .select("id, name, username, avatar_url")
          .in("id", userIds);
        (profs ?? []).forEach((p: any) => profMap.set(p.id, p));
      }
      return rows.map((c) => ({
        ...c,
        // expose normalized fields for consumers
        conteudo: c.texto,
        created_at: c.criado_em,
        autor_nome: profMap.get(c.user_id)?.name || profMap.get(c.user_id)?.username || c.autor_nome || "Aluno",
        autor_avatar: profMap.get(c.user_id)?.avatar_url ?? null,
      })) as VmComentario[];
    },
  });

  const create = useMutation({
    mutationFn: async ({ conteudo }: { conteudo: string; parentId?: string }) => {
      if (!user?.id || !artigoId) throw new Error("no user");
      const { data: prof } = await sb
        .from("profiles")
        .select("name, username")
        .eq("id", user.id)
        .single();
      const autorNome = prof?.name || prof?.username || "Aluno";
      const { error } = await sb.from("vm_comentarios").insert({
        artigo_id: artigoId,
        user_id: user.id,
        autor_nome: autorNome,
        texto: conteudo,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vm-comentarios", artigoId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("vm_comentarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vm-comentarios", artigoId] }),
  });

  return { comentarios: query.data ?? [], isLoading: query.isLoading, create, remove };
}

// ============ Marcações (highlights) ============
export function useVmMarcacoes(artigoIds: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ids = [...artigoIds].sort().join(",");

  const query = useQuery({
    queryKey: ["vm-marcacoes", user?.id, ids],
    enabled: !!user?.id && artigoIds.length > 0,
    queryFn: async () => {
      const { data, error } = await sb
        .from("vm_marcacoes")
        .select("*")
        .eq("user_id", user!.id)
        .in("artigo_id", artigoIds);
      if (error) throw error;
      return (data ?? []) as VmMarcacao[];
    },
  });

  const byBlock = new Map<string, VmMarcacao[]>();
  (query.data ?? []).forEach((m) => {
    const key = m.paragrafo_id ?? m.artigo_id;
    if (!byBlock.has(key)) byBlock.set(key, []);
    byBlock.get(key)!.push(m);
  });

  const queryKey = ["vm-marcacoes", user?.id, ids];

  const create = useMutation({
    mutationFn: async (payload: {
      artigo_id: string;
      paragrafo_id: string | null;
      trecho: string;
      offset_inicio: number;
      offset_fim: number;
      cor: VmHighlightCor;
      anotacao?: string;
    }) => {
      if (!user?.id) throw new Error("no user");
      
      const insertData: any = { 
        artigo_id: payload.artigo_id,
        paragrafo_id: payload.paragrafo_id,
        trecho: payload.trecho,
        offset_inicio: payload.offset_inicio,
        offset_fim: payload.offset_fim,
        cor: payload.cor,
        user_id: user.id 
      };
      
      if (payload.anotacao && payload.anotacao.trim() !== "") {
        insertData.anotacao = payload.anotacao;
      }

      const { data, error } = await sb
        .from("vm_marcacoes")
        .insert(insertData)
        .select()
        .single();
      if (error) {
        console.error("Erro ao salvar marcação:", error);
        throw error;
      }
      return data as VmMarcacao;
    },
    // Atualização otimista: mostra o realce imediatamente antes do banco confirmar
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<VmMarcacao[]>(queryKey);
      const optimistic: VmMarcacao = {
        id: `optimistic-${Date.now()}`,
        user_id: user?.id ?? "",
        artigo_id: payload.artigo_id,
        paragrafo_id: payload.paragrafo_id,
        trecho: payload.trecho,
        offset_inicio: payload.offset_inicio,
        offset_fim: payload.offset_fim,
        cor: payload.cor,
        anotacao: payload.anotacao,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<VmMarcacao[]>(queryKey, (old) => [...(old ?? []), optimistic]);
      return { prev };
    },
    // Se falhar, reverte para o estado anterior
    onError: (_err, _payload, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKey, ctx.prev);
    },
    // Sempre re-sincroniza com o banco ao final para substituir ID temporário pelo real
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["vm-marcacoes", user?.id] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, cor, anotacao }: { id: string; cor: VmHighlightCor; anotacao?: string }) => {
      const updateData: any = { cor };
      if (anotacao !== undefined && anotacao.trim() !== "") {
        updateData.anotacao = anotacao;
      }
      
      const { error } = await sb.from("vm_marcacoes").update(updateData).eq("id", id);
      if (error) {
        console.error("Erro ao atualizar marcação:", error);
        throw error;
      }
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<VmMarcacao[]>(queryKey);
      queryClient.setQueryData<VmMarcacao[]>(queryKey, (old) =>
        (old ?? []).map((m) => (m.id === payload.id ? { ...m, cor: payload.cor, anotacao: payload.anotacao } : m))
      );
      return { prev };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["vm-marcacoes", user?.id] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("vm_marcacoes").delete().eq("id", id);
      if (error) throw error;
    },
    // Atualização otimista: remove o realce imediatamente antes do banco confirmar
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<VmMarcacao[]>(queryKey);
      queryClient.setQueryData<VmMarcacao[]>(queryKey, (old) => (old ?? []).filter((m) => m.id !== id));
      return { prev };
    },
    // Se falhar, reverte para o estado anterior
    onError: (_err, _id, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["vm-marcacoes", user?.id] }),
  });

  return { byBlock, create, update, remove, isLoading: query.isLoading };
}

// ============ Notas do Professor ============
export function useVmNotasProfessor(artigoIds: string[]) {
  const ids = [...artigoIds].sort().join(",");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["vm-notas-prof", ids],
    enabled: artigoIds.length > 0,
    queryFn: async () => {
      const { data, error } = await sb
        .from("vm_notas_professor")
        .select("*")
        .in("artigo_id", artigoIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VmNotaProfessor[];
    },
  });

  const byArtigo = new Map<string, VmNotaProfessor[]>();
  (query.data ?? []).forEach((n) => {
    if (!byArtigo.has(n.artigo_id)) byArtigo.set(n.artigo_id, []);
    byArtigo.get(n.artigo_id)!.push(n);
  });

  const create = useMutation({
    mutationFn: async (payload: { artigo_id: string; autor_id: string; autor_nome: string; conteudo: string }) => {
      const { error } = await sb.from("vm_notas_professor").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vm-notas-prof"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("vm_notas_professor").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vm-notas-prof"] }),
  });

  return { byArtigo, create, remove };
}

// ============ Nota Privada (única por usuário/artigo) ============
export function useVmNotasPrivadas(artigoIds: string[]) {
  const { user } = useAuth();
  const ids = [...artigoIds].sort().join(",");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["vm-notas-priv", user?.id, ids],
    enabled: !!user?.id && artigoIds.length > 0,
    queryFn: async () => {
      const { data, error } = await sb
        .from("vm_notas_privadas")
        .select("*")
        .eq("user_id", user!.id)
        .in("artigo_id", artigoIds);
      if (error) throw error;
      return (data ?? []) as VmNotaPrivada[];
    },
  });

  const byArtigo = new Map<string, VmNotaPrivada>();
  (query.data ?? []).forEach((n) => byArtigo.set(n.artigo_id, n));

  const upsert = useMutation({
    mutationFn: async ({ artigo_id, conteudo }: { artigo_id: string; conteudo: string }) => {
      if (!user?.id) throw new Error("no user");
      const { error } = await sb
        .from("vm_notas_privadas")
        .upsert({ user_id: user.id, artigo_id, conteudo }, { onConflict: "user_id,artigo_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vm-notas-priv", user?.id] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("vm_notas_privadas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vm-notas-priv", user?.id] }),
  });

  return { byArtigo, upsert, remove };
}
