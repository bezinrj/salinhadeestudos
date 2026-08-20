import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VmSumulaTribunal = "STJ" | "STF" | "VINCULANTE";

export interface VmSumula {
  id: string;
  tribunal: VmSumulaTribunal;
  numero: number;
  materia: string;
  assunto: string;
  texto: string;
  ordem: number;
}

export const TRIBUNAL_LABEL: Record<VmSumulaTribunal, string> = {
  STJ: "Súmulas do STJ",
  STF: "Súmulas do STF",
  VINCULANTE: "Súmulas Vinculantes",
};

export function useVmSumulas() {
  return useQuery({
    queryKey: ["vm-sumulas"],
    queryFn: async () => {
      const all: VmSumula[] = [];
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await (supabase as any)
          .from("vm_sumulas")
          .select("id, tribunal, numero, materia, assunto, texto, ordem")
          .order("ordem", { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const rows = (data || []) as VmSumula[];
        all.push(...rows);
        if (rows.length < pageSize) break;
      }
      return all;
    },
    staleTime: 5 * 60_000,
  });
}
