import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { disciplines as fallbackDisciplines } from "@/data/mockData";

/**
 * Hook compartilhado que retorna a lista de matérias (disciplinas) cadastradas
 * no Painel Administrativo → aba "Matérias".
 *
 * Usado por:
 * - Filtros de Discursivas
 * - Seleção de matéria em formulários do Admin (Semanal, Conteúdo)
 * - Aba "Assuntos" do Painel Admin
 * - Cronômetro de estudos
 *
 * Em caso de erro/loading, retorna a lista hardcoded do mockData como fallback
 * para não quebrar telas existentes.
 */
export function useDisciplines() {
  const query = useQuery({
    queryKey: ["disciplines-list"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("disciplines")
        .select("id, name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return ((data || []) as { id: string; name: string; sort_order: number }[]).map(
        (d) => d.name,
      );
    },
    staleTime: 60_000,
  });

  const disciplines =
    query.data && query.data.length > 0 ? query.data : fallbackDisciplines;

  return { disciplines, loading: query.isLoading };
}
