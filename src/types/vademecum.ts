export type VmCargo = "magistratura" | "defensoria" | "mp" | "delegado";
export type VmParagrafoTipo = "paragrafo" | "inciso" | "alinea" | "paragrafo_unico";
export type VmFiltroStatus = "todos" | "lidos" | "nao_lidos" | "marcados";
export type VmFiltroCargo = "todos" | VmCargo;

export type VmHighlightCor = "amarelo" | "verde" | "azul" | "rosa" | "laranja" | "roxo";

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
  paragrafo_id: string | null;
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

export interface VmComentario {
  id: string;
  artigo_id: string;
  user_id: string;
  parent_id: string | null;
  conteudo: string;
  created_at: string;
  autor_nome?: string;
  autor_avatar?: string | null;
}

export interface VmMarcacao {
  id: string;
  artigo_id: string;
  paragrafo_id: string | null;
  user_id: string;
  trecho: string;
  offset_inicio: number;
  offset_fim: number;
  cor: VmHighlightCor;
  anotacao?: string;
  created_at: string;
}

export interface VmNotaProfessor {
  id: string;
  artigo_id: string;
  autor_id: string;
  autor_nome: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
}

export interface VmNotaPrivada {
  id: string;
  artigo_id: string;
  user_id: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
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

export const HIGHLIGHT_COLORS: Record<VmHighlightCor, { bg: string; label: string; swatch: string }> = {
  amarelo: { bg: "bg-yellow-400/40 text-foreground", label: "Amarelo", swatch: "bg-yellow-400" },
  verde: { bg: "bg-emerald-400/40 text-foreground", label: "Verde", swatch: "bg-emerald-400" },
  azul: { bg: "bg-sky-400/40 text-foreground", label: "Azul", swatch: "bg-sky-400" },
  rosa: { bg: "bg-pink-400/40 text-foreground", label: "Rosa", swatch: "bg-pink-400" },
  laranja: { bg: "bg-orange-400/40 text-foreground", label: "Laranja", swatch: "bg-orange-400" },
  roxo: { bg: "bg-purple-400/40 text-foreground", label: "Roxo", swatch: "bg-purple-400" },
};
