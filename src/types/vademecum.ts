export type VmCargo = "magistratura" | "defensoria" | "mp" | "delegado";
export type VmParagrafoTipo = "paragrafo" | "inciso" | "alinea" | "paragrafo_unico";
export type VmFiltroStatus = "todos" | "lidos" | "nao_lidos" | "marcados";
export type VmFiltroCargo = "todos" | VmCargo;

export interface VmLei {
  id: string;
  nome: string;
  sigla: string;
  descricao: string | null;
  categoria: string;
  ordem: number;
  publicada: boolean;
}

export interface VmParagrafo {
  id: string;
  artigo_id: string;
  tipo: VmParagrafoTipo;
  rotulo: string;
  texto: string;
  ordem: number;
}

export interface VmIncidencia {
  id: string;
  artigo_id: string;
  cargo: VmCargo;
  quantidade: number;
  concursos: string[] | null;
}

export interface VmRemissao {
  id: string;
  artigo_origem_id: string;
  artigo_destino_id: string;
  texto_exibido: string;
}

export interface VmArtigo {
  id: string;
  lei_id: string;
  numero: string;
  rotulo: string;
  texto: string;
  ordem: number;
  paragrafos: VmParagrafo[];
  incidencias: VmIncidencia[];
  remissoes: VmRemissao[];
}

export interface VmProgresso {
  artigo_id: string;
  lido: boolean;
  marcado: boolean;
}

export const CARGO_LABEL: Record<VmCargo, string> = {
  magistratura: "Magistratura",
  defensoria: "Defensoria",
  mp: "Ministério Público",
  delegado: "Delegado",
};

export const CARGO_ICON: Record<VmCargo, string> = {
  magistratura: "⚖️",
  defensoria: "🛡️",
  mp: "🏛️",
  delegado: "🔍",
};
