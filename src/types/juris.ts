export interface JurisJulgado {
  id: string;
  titulo: string;
  tribunal: string;
  numero: string;
  relator: string;
  data: string;
  info: string;
  area: string;
  nocoes: {
    frase?: string;
    contexto?: string;
    ok?: string;
    ko?: string;
  };
  conceitual: string;
  problema: string;
  solucao: string;
  antes: string;
  depois: string;
  conclusoes: string;
  principios: string;
  doutrina: string;
  jurisprudencia: string;
  abertura: string;
  tese: string;
  integra_texto: string;
  integra_ref: string;
  published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const EMPTY_JULGADO: Omit<JurisJulgado, "id" | "created_at" | "updated_at" | "created_by" | "published"> = {
  titulo: "",
  tribunal: "",
  numero: "",
  relator: "",
  data: "",
  info: "",
  area: "",
  nocoes: { frase: "", contexto: "", ok: "", ko: "" },
  conceitual: "",
  problema: "",
  solucao: "",
  antes: "",
  depois: "",
  conclusoes: "",
  principios: "",
  doutrina: "",
  jurisprudencia: "",
  abertura: "",
  tese: "",
  integra_texto: "",
  integra_ref: "",
};
