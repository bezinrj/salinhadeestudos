import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JurisMateria, JurisAssunto } from "@/types/juris";

export function useJurisMaterias() {
  return useQuery({
    queryKey: ["juris-materias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("juris_materias" as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as JurisMateria[];
    },
  });
}

export function useJurisAssuntos() {
  return useQuery({
    queryKey: ["juris-assuntos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("juris_assuntos" as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as JurisAssunto[];
    },
  });
}

export function useInvalidateTaxonomy() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["juris-materias"] });
    qc.invalidateQueries({ queryKey: ["juris-assuntos"] });
  };
}
