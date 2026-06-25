import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CronoMateria = {
  id: string;
  user_id: string;
  nome: string;
  cor: string;
  created_at: string;
};

export type CronoAssunto = {
  id: string;
  user_id: string;
  materia_id: string;
  nome: string;
  created_at: string;
};

export type Periodo = "Diário" | "Mensal" | "Anual";

const sb = supabase as any;

export function periodoToRpc(p: Periodo): string {
  if (p === "Diário") return "dia";
  if (p === "Anual") return "ano";
  return "mes";
}

export function periodoStart(p: Periodo): Date {
  const now = new Date();
  if (p === "Diário") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "Anual") return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function useCronoMaterias() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const materias = useQuery({
    queryKey: ["crono_materias", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await sb
        .from("crono_materias")
        .select("*")
        .eq("user_id", user.id)
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data || []) as CronoMateria[];
    },
    enabled: !!user?.id,
  });

  const assuntos = useQuery({
    queryKey: ["crono_assuntos", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await sb
        .from("crono_assuntos")
        .select("*")
        .eq("user_id", user.id)
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data || []) as CronoAssunto[];
    },
    enabled: !!user?.id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["crono_materias"] });
    qc.invalidateQueries({ queryKey: ["crono_assuntos"] });
  };

  const createMateria = useMutation({
    mutationFn: async ({ nome, cor }: { nome: string; cor: string }) => {
      if (!user?.id) throw new Error("Sem usuário");
      const { data, error } = await sb
        .from("crono_materias")
        .insert({ user_id: user.id, nome, cor })
        .select("*")
        .single();
      if (error) throw error;
      return data as CronoMateria;
    },
    onSuccess: invalidate,
  });

  const updateMateria = useMutation({
    mutationFn: async ({ id, nome, cor }: { id: string; nome?: string; cor?: string }) => {
      const patch: Record<string, unknown> = {};
      if (nome !== undefined) patch.nome = nome;
      if (cor !== undefined) patch.cor = cor;
      const { error } = await sb.from("crono_materias").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMateria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("crono_materias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const createAssunto = useMutation({
    mutationFn: async ({ materia_id, nome }: { materia_id: string; nome: string }) => {
      if (!user?.id) throw new Error("Sem usuário");
      const { data, error } = await sb
        .from("crono_assuntos")
        .insert({ user_id: user.id, materia_id, nome })
        .select("*")
        .single();
      if (error) throw error;
      return data as CronoAssunto;
    },
    onSuccess: invalidate,
  });

  const updateAssunto = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await sb.from("crono_assuntos").update({ nome }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteAssunto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("crono_assuntos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    materias: materias.data || [],
    assuntos: assuntos.data || [],
    isLoading: materias.isLoading || assuntos.isLoading,
    createMateria,
    updateMateria,
    deleteMateria,
    createAssunto,
    updateAssunto,
    deleteAssunto,
  };
}

export function useMediaHorasGeral(periodo: Periodo) {
  return useQuery({
    queryKey: ["media_horas_geral", periodo],
    queryFn: async () => {
      const { data, error } = await sb.rpc("media_horas_geral", {
        periodo: periodoToRpc(periodo),
      });
      if (error) throw error;
      return Number(data || 0);
    },
    staleTime: 60_000,
  });
}
