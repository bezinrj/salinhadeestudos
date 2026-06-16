import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { VmCaderno, VmCadernoNota, CadernoTag, VmCadernoPasta } from "@/types/cadernos";

const sb = supabase as any;

export function useCadernoPastas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["caderno-pastas", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await sb
        .from("vm_caderno_pastas")
        .select("*")
        .eq("user_id", user!.id)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return (data ?? []) as VmCadernoPasta[];
    },
  });

  const create = useMutation({
    mutationFn: async (nome: string) => {
      if (!user?.id) throw new Error("no user");
      const { data, error } = await sb
        .from("vm_caderno_pastas")
        .insert({ nome, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as VmCadernoPasta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caderno-pastas", user?.id] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("vm_caderno_pastas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caderno-pastas", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["cadernos", user?.id] });
    },
  });

  return { pastas: query.data ?? [], isLoading: query.isLoading, create, remove };
}

export function useCadernos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cadernos", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await sb
        .from("vm_cadernos")
        .select("*")
        .eq("user_id", user!.id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VmCaderno[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: { titulo: string; pasta_id?: string | null }) => {
      if (!user?.id) throw new Error("no user");
      const { data, error } = await sb
        .from("vm_cadernos")
        .insert({ titulo: payload.titulo, pasta_id: payload.pasta_id ?? null, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as VmCaderno;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cadernos", user?.id] });
    },
  });

  const moveToPasta = useMutation({
    mutationFn: async ({ cadernoId, pastaId }: { cadernoId: string; pastaId: string | null }) => {
      const { data, error } = await sb
        .from("vm_cadernos")
        .update({ pasta_id: pastaId })
        .eq("id", cadernoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cadernos", user?.id] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("vm_cadernos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cadernos", user?.id] });
    },
  });

  return { cadernos: query.data ?? [], isLoading: query.isLoading, create, moveToPasta, remove };
}

export function useCadernoNotas(cadernoId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["caderno-notas", user?.id, cadernoId],
    enabled: !!user?.id && !!cadernoId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("vm_caderno_notas")
        .select(`
          *,
          artigo:vm_artigos(numero, rotulo, lei:vm_leis(sigla))
        `)
        .eq("user_id", user!.id)
        .eq("caderno_id", cadernoId)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VmCadernoNota[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: { caderno_id: string; artigo_id?: string; conteudo_html: string; tags: CadernoTag[] }) => {
      if (!user?.id) throw new Error("no user");
      const { data, error } = await sb
        .from("vm_caderno_notas")
        .insert({
          caderno_id: payload.caderno_id,
          artigo_id: payload.artigo_id ?? null,
          conteudo_html: payload.conteudo_html,
          tags: payload.tags,
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as VmCadernoNota;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["caderno-notas", user?.id, variables.caderno_id] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("vm_caderno_notas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caderno-notas", user?.id, cadernoId] });
    },
  });

  return { notas: query.data ?? [], isLoading: query.isLoading, create, remove };
}
