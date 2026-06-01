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
        .select("*, profiles(name, username, avatar_url)")
        .eq("artigo_id", artigoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as any[]).map((c) => ({
        ...c,
        autor_nome: c.profiles?.name || c.profiles?.username || "Aluno",
        autor_avatar: c.profiles?.avatar_url ?? null,
      })) as VmComentario[];
    },
  });

  const create = useMutation({
    mutationFn: async ({ conteudo, parentId }: { conteudo: string; parentId?: string }) => {
      if (!user?.id || !artigoId) throw new Error("no user");
      const { error } = await sb.from("vm_comentarios").insert({
        artigo_id: artigoId,
        user_id: user.id,
        parent_id: parentId ?? null,
        conteudo,
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

  const create = useMutation({
    mutationFn: async (payload: {
      artigo_id: string;
      paragrafo_id: string | null;
      trecho: string;
      offset_inicio: number;
      offset_fim: number;
      cor: VmHighlightCor;
    }) => {
      if (!user?.id) throw new Error("no user");
      const { error } = await sb.from("vm_marcacoes").insert({ ...payload, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vm-marcacoes", user?.id] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("vm_marcacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vm-marcacoes", user?.id] }),
  });

  return { byBlock, create, remove, isLoading: query.isLoading };
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
