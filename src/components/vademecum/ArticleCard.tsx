import { useState, useEffect } from "react";
import { Check, Bookmark, BookmarkCheck, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncidenciaBadge, CARGO_BORDER } from "./IncidenciaBadge";
import { ArticleText } from "./ArticleText";
import { ArticleComments } from "./ArticleComments";
import { ProfessorNoteCard } from "./ProfessorNoteCard";
import { PrivateNoteCard } from "./PrivateNoteCard";
import { NoteEditor, isNoteEmpty } from "./NoteEditor";
import { CadernoModal } from "@/components/cadernos/CadernoModal";
import { UnlockPremiumCard } from "./UnlockPremiumCard";
import { supabase } from "@/integrations/supabase/client";
import type {
  VmLei,
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
  subscribed?: boolean;
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
    anotacao?: string;
  }) => void;
  onUpdateMarcacao: (id: string, cor: VmHighlightCor, anotacao?: string) => void;
  onRemoveMarcacao: (id: string) => void;
  onCreateProfNote: (artigoId: string, conteudo: string) => Promise<void> | void;
  onRemoveProfNote: (id: string) => void;
  onUpdateProfNote?: (id: string, conteudo: string) => Promise<void> | void;

  onSavePrivNote: (artigoId: string, conteudo: string) => Promise<void> | void;
  onRemovePrivNote: (id: string) => Promise<void> | void;
  leis?: VmLei[];
  onAddRemissao?: (artigoId: string, destArtigoId: string, textoExibido: string) => Promise<void> | void;
  onDeleteRemissao?: (remissaoId: string) => Promise<void> | void;
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
    subscribed = false,
    autorNome,
    autorId,
    onToggleLido,
    onToggleMarcado,
    onRemissaoClick,
    onCreateMarcacao,
    onUpdateMarcacao,
    onRemoveMarcacao,
    onCreateProfNote,
    onRemoveProfNote,
    onUpdateProfNote,

    onSavePrivNote,
    onRemovePrivNote,
    leis = [],
    onAddRemissao,
    onDeleteRemissao,
  } = props;

  const lido = progresso?.lido ?? false;
  const marcado = progresso?.marcado ?? false;
  const [addingProf, setAddingProf] = useState(false);
  const [profText, setProfText] = useState("");
  const [isCadernoOpen, setIsCadernoOpen] = useState(false);

  // Remissão form states
  const [addingRemissao, setAddingRemissao] = useState(false);
  const [destLeiId, setDestLeiId] = useState<string>(artigo.lei_id);
  const [destArtigos, setDestArtigos] = useState<any[]>([]);
  const [destArtigoId, setDestArtigoId] = useState<string>("");
  const [textoExibido, setTextoExibido] = useState<string>("");
  const [loadingDestArtigos, setLoadingDestArtigos] = useState(false);

  // Carrega os artigos da lei de destino selecionada no modal/card
  useEffect(() => {
    if (!destLeiId || !addingRemissao) return;
    const loadDestArtigos = async () => {
      setLoadingDestArtigos(true);
      try {
        const { data, error } = await supabase
          .from("vm_artigos")
          .select("id, numero, rotulo")
          .eq("lei_id", destLeiId)
          .order("ordem");
        if (error) throw error;
        setDestArtigos(data || []);
        if (data && data.length > 0) {
          setDestArtigoId(data[0].id);
        } else {
          setDestArtigoId("");
        }
      } catch (e: any) {
        console.error("Erro ao carregar artigos de destino: ", e);
      } finally {
        setLoadingDestArtigos(false);
      }
    };
    loadDestArtigos();
  }, [destLeiId, addingRemissao]);

  // Preenche o texto exibido sugerido dinamicamente no card
  useEffect(() => {
    if (destArtigoId && destArtigos.length > 0) {
      const selected = destArtigos.find((a) => a.id === destArtigoId);
      if (selected) {
        const destLei = leis.find((l) => l.id === destLeiId);
        const suffix = destLeiId !== artigo.lei_id && destLei ? ` da ${destLei.sigla}` : "";
        setTextoExibido((selected.rotulo || `Art. ${selected.numero}`) + suffix);
      }
    }
  }, [destArtigoId, destArtigos, destLeiId, artigo.lei_id, leis]);

  const submitRemissao = async () => {
    if (!destArtigoId || !textoExibido.trim()) return;
    if (onAddRemissao) {
      await onAddRemissao(artigo.id, destArtigoId, textoExibido.trim());
      setAddingRemissao(false);
      setTextoExibido("");
      setDestArtigoId("");
    }
  };

  let borderClass = "";
  if (filtroCargo !== "todos") {
    const inc = artigo.incidencias.find((i) => i.cargo === filtroCargo);
    if (inc && inc.quantidade >= 5) borderClass = `border-l-4 ${CARGO_BORDER[filtroCargo]}`;
  }

  const submitProfNote = async () => {
    if (isNoteEmpty(profText) || !autorId || !autorNome) return;
    await onCreateProfNote(artigo.id, profText);
    setProfText("");
    setAddingProf(false);
    toast.success("Nota publicada");
  };

  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const numNorm = normalize(artigo.numero);
  const rotNorm = normalize(artigo.rotulo || "");
  const ESTRUTURA = /^(PARTE|LIVRO|TITULO|CAPITULO|SECAO|SUBSECAO)\b/;
  const isTitle = numNorm === "PREAMBULO" ||
                  ESTRUTURA.test(numNorm.replace(/_/g, " ")) ||
                  ESTRUTURA.test(rotNorm);

  if (isTitle) {
    return (
      <div id={`vm-art-${artigo.id}`} className="my-14 flex flex-col items-center justify-center text-center scroll-m-24">
        {artigo.rotulo && (
          <h2 className="mb-4 text-[1rem] font-semibold uppercase tracking-[0.2em] text-[#5C728A]">
            {artigo.rotulo}
          </h2>
        )}
        {artigo.texto && (
          <div className="mx-auto max-w-4xl font-serif text-2xl font-medium text-[#E2E8F0] leading-relaxed">
            {artigo.texto}
          </div>
        )}
      </div>
    );
  }

  return (
    <article
      id={`vm-art-${artigo.id}`}
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-sm transition-colors",
        borderClass,
      )}
    >
      <header className="mb-3 flex flex-wrap items-center gap-2">
        {!(artigo.numero === "0" && !artigo.rotulo) && (
          <h3 className="font-display text-lg font-bold text-foreground">
            {artigo.rotulo || `Art. ${artigo.numero}`}
          </h3>
        )}
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
        onUpdateMarcacao={onUpdateMarcacao}
        onRemoveMarcacao={onRemoveMarcacao}
        onRemissaoClick={onRemissaoClick}
      />

      <div className="mt-4 space-y-2">
        {notasProf.map((n) => (
          <ProfessorNoteCard
            key={n.id}
            nota={n}
            canDelete={canAddProfNote}
            onDelete={() => onRemoveProfNote(n.id)}
            onUpdate={onUpdateProfNote ? (c) => onUpdateProfNote(n.id, c) : undefined}

          />
        ))}

        {/* Adicionar nota do professor — visível para todos os logados */}
        {!addingProf && (subscribed || canAddProfNote) && (
          <button
            onClick={() => setAddingProf(true)}
            className="w-full rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-2 text-left text-xs text-amber-300 hover:bg-amber-500/10"
          >
            + Adicionar nota do professor
          </button>
        )}
        {!addingProf && !subscribed && !canAddProfNote && (
          <UnlockPremiumCard variant="professor" />
        )}
        {addingProf && (
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/5 p-3">
            <NoteEditor
              value={profText}
              onChange={setProfText}
              placeholder="Comentário do professor visível para todos os alunos..."
            />
            <div className="mt-2 flex gap-1">
              <Button size="sm" onClick={submitProfNote}>Publicar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingProf(false); setProfText(""); }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Nota privada — sempre visível (locked para não assinantes) */}
        <PrivateNoteCard
          artigoId={artigo.id}
          nota={notaPriv}
          subscribed={subscribed || canAddProfNote}
          onSave={(c) => onSavePrivNote(artigo.id, c)}
          onDelete={() => notaPriv && onRemovePrivNote(notaPriv.id)}
        />

        {/* Remissões */}
        <div className="mt-2 space-y-2 border-t border-border/50 pt-3">
          {artigo.remissoes && artigo.remissoes.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground">Remissões Ativas:</span>
              <div className="flex flex-wrap gap-1.5">
                {artigo.remissoes.map((rem) => (
                  <span
                    key={rem.id}
                    className="inline-flex items-center gap-1 rounded border border-sky-500/20 bg-sky-500/5 px-2 py-0.5 text-xs text-sky-300"
                  >
                    {rem.texto_exibido}
                    {canAddProfNote && (
                      <button
                        onClick={() => onDeleteRemissao?.(rem.id)}
                        className="ml-1 text-destructive hover:text-red-400 font-bold"
                        title="Remover remissão"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!addingRemissao && (subscribed || canAddProfNote) && (
            <button
              onClick={() => {
                setAddingRemissao(true);
                setDestLeiId(artigo.lei_id);
              }}
              className="w-full rounded-lg border border-dashed border-sky-500/40 bg-sky-500/5 p-2 text-left text-xs text-sky-300 hover:bg-sky-500/10 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> + Adicionar remissão
            </button>
          )}
          {!addingRemissao && !subscribed && !canAddProfNote && (
            <UnlockPremiumCard variant="remissao" />
          )}

          {addingRemissao && (
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Lei de Destino</label>
                  <select
                    value={destLeiId}
                    onChange={(e) => setDestLeiId(e.target.value)}
                    className="w-full h-8 text-xs rounded border border-border bg-background px-2 text-foreground focus:outline-none"
                  >
                    {leis.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.sigla}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground">Artigo de Destino</label>
                  <select
                    value={destArtigoId}
                    onChange={(e) => setDestArtigoId(e.target.value)}
                    disabled={loadingDestArtigos || destArtigos.length === 0}
                    className="w-full h-8 text-xs rounded border border-border bg-background px-2 text-foreground focus:outline-none"
                  >
                    {loadingDestArtigos ? (
                      <option>Carregando...</option>
                    ) : destArtigos.length === 0 ? (
                      <option>Nenhum artigo</option>
                    ) : (
                      destArtigos.map((art) => (
                        <option key={art.id} value={art.id}>
                          {art.rotulo || `Art. ${art.numero}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground">Texto Exibido</label>
                <input
                  type="text"
                  value={textoExibido}
                  onChange={(e) => setTextoExibido(e.target.value)}
                  placeholder="Ex: Art. 5º, XXXIV"
                  className="w-full h-8 text-xs rounded border border-border bg-background px-2 text-foreground focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={submitRemissao} disabled={!destArtigoId || !textoExibido.trim()}>
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAddingRemissao(false);
                    setTextoExibido("");
                    setDestArtigoId("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>


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
          variant="outline"
          className="text-white hover:bg-white/10"
          onClick={() => setIsCadernoOpen(true)}
        >
          <BookOpen className="mr-1 h-4 w-4" />
          Caderno
        </Button>
      </footer>

      <ArticleComments artigoId={artigo.id} />
      <CadernoModal open={isCadernoOpen} onOpenChange={setIsCadernoOpen} artigo={artigo} />
    </article>
  );
}
