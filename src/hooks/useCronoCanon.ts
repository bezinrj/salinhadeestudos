import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Periodo, periodoToRpc } from "@/hooks/useCrono";

const sb = supabase as any;

export type MateriaCanon = {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
  ordem: number;
};

export type AssuntoCanon = {
  id: string;
  materia_canon_id: string;
  nome: string;
  ativo: boolean;
  ordem: number;
};

export type CronoAlias = {
  id: string;
  tipo: "materia" | "assunto";
  canon_id: string;
  texto_norm: string;
};

export type ComparacaoMateria = {
  materia_canon_id: string;
  materia_nome: string;
  cor: string;
  media_horas: number;
  minhas_horas: number;
  alunos: number;
  percentil: number | null;
};

export type ComparacaoAssunto = {
  assunto_canon_id: string;
  assunto_nome: string;
  materia_canon_id: string;
  materia_nome: string;
  media_horas: number;
  minhas_horas: number;
  alunos: number;
  percentil: number | null;
};

export type Pendencia = {
  tipo: "materia" | "assunto";
  texto: string;
  texto_norm: string;
  alunos: number;
  materia_canon_id: string | null;
  materia_nome: string | null;
};

/** Catálogo oficial (matérias e assuntos canônicos). */
export function useCronoCatalogo(incluirInativos = false) {
  const materias = useQuery({
    queryKey: ["crono_materias_canon", incluirInativos],
    queryFn: async () => {
      let q = sb.from("crono_materias_canon").select("*").order("ordem").order("nome");
      if (!incluirInativos) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as MateriaCanon[];
    },
    staleTime: 5 * 60_000,
  });

  const assuntos = useQuery({
    queryKey: ["crono_assuntos_canon", incluirInativos],
    queryFn: async () => {
      let q = sb.from("crono_assuntos_canon").select("*").order("ordem").order("nome");
      if (!incluirInativos) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as AssuntoCanon[];
    },
    staleTime: 5 * 60_000,
  });

  return {
    materiasCanon: materias.data || [],
    assuntosCanon: assuntos.data || [],
    isLoading: materias.isLoading || assuntos.isLoading,
  };
}

export function useComparacaoMaterias(periodo: Periodo) {
  return useQuery({
    queryKey: ["crono_cmp_materias", periodo],
    queryFn: async () => {
      const { data, error } = await sb.rpc("get_media_horas_por_materia", { periodo: periodoToRpc(periodo) });
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({
        ...r,
        media_horas: Number(r.media_horas || 0),
        minhas_horas: Number(r.minhas_horas || 0),
        alunos: Number(r.alunos || 0),
        percentil: r.percentil == null ? null : Number(r.percentil),
      })) as ComparacaoMateria[];
    },
    staleTime: 60_000,
  });
}

export function useComparacaoAssuntos(periodo: Periodo, materiaCanonId?: string | null) {
  return useQuery({
    queryKey: ["crono_cmp_assuntos", periodo, materiaCanonId || "all"],
    queryFn: async () => {
      const { data, error } = await sb.rpc("get_media_horas_por_assunto", {
        periodo: periodoToRpc(periodo),
        _materia_canon_id: materiaCanonId || null,
      });
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({
        ...r,
        media_horas: Number(r.media_horas || 0),
        minhas_horas: Number(r.minhas_horas || 0),
        alunos: Number(r.alunos || 0),
        percentil: r.percentil == null ? null : Number(r.percentil),
      })) as ComparacaoAssunto[];
    },
    staleTime: 60_000,
  });
}

/** Gestão do catálogo (admin/moderador). */
export function useCronoCatalogoAdmin() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["crono_materias_canon"] });
    qc.invalidateQueries({ queryKey: ["crono_assuntos_canon"] });
    qc.invalidateQueries({ queryKey: ["crono_aliases"] });
    qc.invalidateQueries({ queryKey: ["crono_pendencias"] });
  };

  const aliases = useQuery({
    queryKey: ["crono_aliases"],
    queryFn: async () => {
      const { data, error } = await sb.from("crono_aliases").select("*").order("texto_norm");
      if (error) throw error;
      return (data || []) as CronoAlias[];
    },
  });

  const pendencias = useQuery({
    queryKey: ["crono_pendencias"],
    queryFn: async () => {
      const { data, error } = await sb.rpc("crono_pendencias");
      if (error) throw error;
      return ((data || []) as any[]).map((p) => ({ ...p, alunos: Number(p.alunos || 0) })) as Pendencia[];
    },
  });

  const saveMateria = useMutation({
    mutationFn: async (m: Partial<MateriaCanon> & { nome: string }) => {
      if (m.id) {
        const { error } = await sb.from("crono_materias_canon")
          .update({ nome: m.nome, cor: m.cor, ativo: m.ativo, ordem: m.ordem }).eq("id", m.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("crono_materias_canon")
          .insert({ nome: m.nome, cor: m.cor || "#3b82f6", ordem: m.ordem || 0 });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const deleteMateria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("crono_materias_canon").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const saveAssunto = useMutation({
    mutationFn: async (a: Partial<AssuntoCanon> & { nome: string; materia_canon_id: string }) => {
      if (a.id) {
        const { error } = await sb.from("crono_assuntos_canon")
          .update({ nome: a.nome, ativo: a.ativo, materia_canon_id: a.materia_canon_id }).eq("id", a.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("crono_assuntos_canon")
          .insert({ nome: a.nome, materia_canon_id: a.materia_canon_id });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const deleteAssunto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("crono_assuntos_canon").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addAlias = useMutation({
    mutationFn: async ({ tipo, canon_id, texto }: { tipo: "materia" | "assunto"; canon_id: string; texto: string }) => {
      const { data: norm, error: e1 } = await sb.rpc("crono_norm", { _txt: texto });
      if (e1) throw e1;
      const { error } = await sb.from("crono_aliases").insert({ tipo, canon_id, texto_norm: norm });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteAlias = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("crono_aliases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const relink = useMutation({
    mutationFn: async () => {
      const { error } = await sb.rpc("crono_relink_all");
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    aliases: aliases.data || [],
    pendencias: pendencias.data || [],
    isLoading: aliases.isLoading || pendencias.isLoading,
    saveMateria,
    deleteMateria,
    saveAssunto,
    deleteAssunto,
    addAlias,
    deleteAlias,
    relink,
  };
}
