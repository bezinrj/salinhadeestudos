import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserMateria = {
  id: string;
  user_id: string;
  nome: string;
  criado_em: string;
};

export type UserAssunto = {
  id: string;
  user_id: string;
  materia_id: string;
  nome: string;
  criado_em: string;
};

export function useUserMaterias() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const materiasQuery = useQuery({
    queryKey: ["user_materias", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("user_materias")
        .select("*")
        .eq("user_id", user.id)
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as UserMateria[];
    },
    enabled: !!user?.id,
  });

  const assuntosQuery = useQuery({
    queryKey: ["user_assuntos", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("user_assuntos")
        .select("*")
        .eq("user_id", user.id)
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as UserAssunto[];
    },
    enabled: !!user?.id,
  });

  const createMateria = useMutation({
    mutationFn: async (nome: string) => {
      if (!user?.id) throw new Error("Usuário não logado");
      const { data, error } = await (supabase as any)
        .from("user_materias")
        .insert({ user_id: user.id, nome })
        .select("*")
        .single();
      if (error) throw error;
      return data as UserMateria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_materias"] });
    },
  });

  const createAssunto = useMutation({
    mutationFn: async ({ nome, materia_id }: { nome: string; materia_id: string }) => {
      if (!user?.id) throw new Error("Usuário não logado");
      const { data, error } = await (supabase as any)
        .from("user_assuntos")
        .insert({ user_id: user.id, materia_id, nome })
        .select("*")
        .single();
      if (error) throw error;
      return data as UserAssunto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_assuntos"] });
    },
  });

  return {
    materias: materiasQuery.data || [],
    assuntos: assuntosQuery.data || [],
    isLoading: materiasQuery.isLoading || assuntosQuery.isLoading,
    createMateria,
    createAssunto,
  };
}
