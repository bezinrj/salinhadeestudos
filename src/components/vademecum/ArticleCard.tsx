import { Check, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncidenciaBadge, CARGO_BORDER } from "./IncidenciaBadge";
import { ArticleText } from "./ArticleText";
import type { VmArtigo, VmFiltroCargo, VmProgresso, VmRemissao } from "@/types/vademecum";
import { cn } from "@/lib/utils";

interface Props {
  artigo: VmArtigo;
  progresso: VmProgresso | undefined;
  filtroCargo: VmFiltroCargo;
  onToggleLido: (artigoId: string, value: boolean) => void;
  onToggleMarcado: (artigoId: string, value: boolean) => void;
  onRemissaoClick: (rem: VmRemissao) => void;
}

export function ArticleCard({
  artigo,
  progresso,
  filtroCargo,
  onToggleLido,
  onToggleMarcado,
  onRemissaoClick,
}: Props) {
  const lido = progresso?.lido ?? false;
  const marcado = progresso?.marcado ?? false;

  // Highlight border if filter selects a cargo with high incidence
  let borderClass = "";
  if (filtroCargo !== "todos") {
    const inc = artigo.incidencias.find((i) => i.cargo === filtroCargo);
    if (inc && inc.quantidade >= 5) borderClass = `border-l-4 ${CARGO_BORDER[filtroCargo]}`;
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

      <ArticleText artigo={artigo} onRemissaoClick={onRemissaoClick} />

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
      </footer>
    </article>
  );
}
