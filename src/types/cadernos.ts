export interface VmCadernoPasta {
  id: string;
  user_id: string;
  nome: string;
  criado_em: string;
  atualizado_em: string;
}

export interface VmCaderno {
  id: string;
  user_id: string;
  pasta_id?: string | null;
  titulo: string;
  criado_em: string;
  atualizado_em: string;
}

export type CadernoTag = "Legislação" | "Questões" | "Flashcards" | "Julgados" | "Livre";

export interface VmCadernoNota {
  id: string;
  caderno_id: string;
  user_id: string;
  artigo_id: string | null;
  conteudo_html: string;
  tags: CadernoTag[];
  criado_em: string;
  atualizado_em: string;
  
  // Joins opcionais úteis para UI
  artigo?: {
    numero: string;
    rotulo: string;
    lei?: {
      sigla: string;
    };
  };
}
