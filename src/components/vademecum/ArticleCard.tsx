import { useState } from "react";
import { Check, Bookmark, BookmarkCheck, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IncidenciaBadge, CARGO_BORDER } from "./IncidenciaBadge";
import { ArticleText } from "./ArticleText";
import { ArticleComments } from "./ArticleComments";
import { ProfessorNoteCard } from "./ProfessorNoteCard";
import { PrivateNoteCard } from "./PrivateNoteCard";
import type {
  VmArtigo,
  VmFiltroCargo,
  VmProgresso,
  VmRemissao,
  VmMarcacao,
  VmHighlightCor,
  VmNotaProfessor,
  VmNotaPrivada,
} from "@/types/vademecum";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  artigo: VmArtigo;
  progresso: VmProgresso | undefined;
  filtroCargo: VmFiltroCargo;
  marcacoesByBlock: Map<string, VmMarcacao[]>;
  notasProf: VmNotaProfessor[];
  notaPriv: VmNotaPrivada | undefined;
  canAddProfNote: boolean;
  autorNome?: string;
  autorId?: string;
  onToggleLido: (artigoId: string, value: boolean) => void;
  onToggleMarcado: (artigoId: string, value: boolean) => void;
  onRemissaoClick: (rem: VmRemissao) => void;
  onCreateMarcacao: (payload: {
    artigo_id: string;
    paragrafo_id: string | null;
    trecho: string;
    offset_inicio: number;
    offset_fim: number;
    cor: VmHighlightCor;
  }) => void;
  onRemoveMarcacao: (id: string) => void;
  onCreateProfNote: (artigoId: string, conteudo: string) => Promise<void> | void;
  onRemoveProfNote: (id: string) => void;
  onSavePrivNote: (artigoId: string, conteudo: string) => Promise<void> | void;
  onRemovePrivNote: (id: string) => Promise<void> | void;
}

export function ArticleCard(props: Props) {
  const {
    artigo,
    progresso,
    filtroCargo,
    marcacoesByBlock,
    notasProf,
    notaPriv,
    canAddProfNote,
    autorNome,
    autorId,
    onToggleLido,
    onToggleMarcado,
    onRemissaoClick,
    onCreateMarcacao,
    onRemoveMarcacao,
    onCreateProfNote,
    onRemoveProfNote,
    onSavePrivNote,
    onRemovePrivNote,
  } = props;

  const lido = progresso?.lido ?? false;
  const marcado = progresso?.marcado ?? false;
  const [addingProf, setAddingProf] = useState(false);
  const [profText, setProfText] = useState("");

  let borderClass = "";
  if (filtroCargo !== "todos") {
    const inc = artigo.incidencias.find((i) => i.cargo === filtroCargo);
    if (inc && inc.quantidade >= 5) borderClass = `border-l-4 ${CARGO_BORDER[filtroCargo]}`;
  }

  const submitProfNote = async () => {
    if (!profText.trim() || !autorId || !autorNome) return;
    await onCreateProfNote(artigo.id, profText.trim());
    setProfText("");
    setAddingProf(false);
    toast.success("Nota publicada");
  };

  return (
    <article
      id={`vm-art-${artigo.id}`}
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-sm transition-colors",
        borderClass,
      )}
    >
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-bold text-foreground">{artigo.rotulo || `Art. ${artigo.numero}`}</h3>
        {lido && <Check className="h-4 w-4 text-emerald-500" aria-label="Lido" />}
        <div className="ml-auto flex flex-wrap gap-1.5">
          {artigo.incidencias
            .filter((i) => i.quantidade > 0)
            .sort((a, b) => b.quantidade - a.quantidade)
            .map((i) => (
              <IncidenciaBadge key={i.id} cargo={i.cargo} quantidade={i.quantidade} />
            ))}
        </div>
      </header>

      <ArticleText
        artigo={artigo}
        marcacoesByBlock={marcacoesByBlock}
        onCreateMarcacao={onCreateMarcacao}
        onRemoveMarcacao={onRemoveMarcacao}
        onRemissaoClick={onRemissaoClick}
      />

      {(notasProf.length > 0 || notaPriv || canAddProfNote) && (
        <div className="mt-4 space-y-2">
          {notasProf.map((n) => (
            <ProfessorNoteCard
              key={n.id}
              nota={n}
              canDelete={canAddProfNote}
              onDelete={() => onRemoveProfNote(n.id)}
            />
          ))}
          {canAddProfNote && !addingProf && (
            <button
              onClick={() => setAddingProf(true)}
              className="w-full rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-2 text-left text-xs text-amber-300 hover:bg-amber-500/10"
            >
              + Adicionar nota do professor
            </button>
          )}
          {addingProf && (
            <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/5 p-3">
              <Textarea
                value={profText}
                onChange={(e) => setProfText(e.target.value)}
                rows={3}
                placeholder="Comentário do professor visível para todos os alunos..."
                className="text-sm"
              />
              <div className="mt-2 flex gap-1">
                <Button size="sm" onClick={submitProfNote}>Publicar</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingProf(false); setProfText(""); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
          <PrivateNoteCard
            artigoId={artigo.id}
            nota={notaPriv}
            onSave={(c) => onSavePrivNote(artigo.id, c)}
            onDelete={() => notaPriv && onRemovePrivNote(notaPriv.id)}
          />
        </div>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
        <Button
          size="sm"
          variant={lido ? "default" : "outline"}
          className={lido ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
          onClick={() => onToggleLido(artigo.id, !lido)}
        >
          <Check className="mr-1 h-4 w-4" />
          {lido ? "Lido" : "Marcar lido"}
        </Button>
        <Button
          size="sm"
          variant={marcado ? "default" : "outline"}
          className={marcado ? "bg-sky-600 text-white hover:bg-sky-700" : ""}
          onClick={() => onToggleMarcado(artigo.id, !marcado)}
        >
          {marcado ? <BookmarkCheck className="mr-1 h-4 w-4" /> : <Bookmark className="mr-1 h-4 w-4" />}
          {marcado ? "Marcado" : "Marcar"}
        </Button>

      <ArticleComments artigoId={artigo.id} />
    </article>
  );
}
