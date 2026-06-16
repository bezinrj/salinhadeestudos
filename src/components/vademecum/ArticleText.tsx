import { useMemo } from "react";
import type { VmArtigo, VmMarcacao, VmHighlightCor } from "@/types/vademecum";
import { cn } from "@/lib/utils";
import { HighlightableText } from "./HighlightableText";

interface Props {
  artigo: VmArtigo;
  marcacoesByBlock: Map<string, VmMarcacao[]>;
  onCreateMarcacao: (payload: {
    artigo_id: string;
    paragrafo_id: string | null;
    trecho: string;
    offset_inicio: number;
    offset_fim: number;
    cor: VmHighlightCor;
    anotacao?: string;
  }) => void;
  onUpdateMarcacao?: (id: string, cor: VmHighlightCor, anotacao?: string) => void;
  onRemoveMarcacao: (id: string) => void;
  onRemissaoClick?: (remissao: VmArtigo["remissoes"][number]) => void;
}

const TIPO_INDENT: Record<string, string> = {
  paragrafo: "pl-4",
  paragrafo_unico: "pl-4",
  inciso: "pl-8",
  alinea: "pl-12",
};

export function ArticleText({ artigo, marcacoesByBlock, onCreateMarcacao, onUpdateMarcacao, onRemoveMarcacao, onRemissaoClick }: Props) {
  const artigoMarc = marcacoesByBlock.get(artigo.id) ?? [];

  return (
    <div className="font-serif text-[16px] leading-[1.85] text-foreground/90">
      <p>
        <HighlightableText
          text={artigo.texto}
          marcacoes={artigoMarc}
          onCreate={(r) =>
            onCreateMarcacao({
              artigo_id: artigo.id,
              paragrafo_id: null,
              trecho: r.trecho,
              offset_inicio: r.start,
              offset_fim: r.end,
              cor: r.cor,
              anotacao: r.anotacao,
            })
          }
          onUpdate={onUpdateMarcacao}
          onRemove={onRemoveMarcacao}
        />
      </p>
      {artigo.paragrafos.map((p) => {
        const marc = marcacoesByBlock.get(p.id) ?? [];
        return (
          <p key={p.id} className={cn("mt-3", TIPO_INDENT[p.tipo] ?? "pl-4")}>
            <HighlightableText
              text={p.texto}
              marcacoes={marc}
              prefix={p.rotulo ? <strong className="mr-3 font-bold text-sky-400">{p.rotulo}</strong> : null}
              onCreate={(r) =>
                onCreateMarcacao({
                  artigo_id: artigo.id,
                  paragrafo_id: p.id,
                  trecho: r.trecho,
                  offset_inicio: r.start,
                  offset_fim: r.end,
                  cor: r.cor,
                  anotacao: r.anotacao,
                })
              }
              onUpdate={onUpdateMarcacao}
              onRemove={onRemoveMarcacao}
            />
          </p>
        );
      })}

      {artigo.remissoes && artigo.remissoes.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3 text-xs">
          <span className="text-muted-foreground">↪ Remissões:</span>
          {artigo.remissoes.map((rem) => (
            <button
              key={rem.id}
              onClick={() => onRemissaoClick?.(rem)}
              className="rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-300 hover:bg-sky-500/20"
            >
              {rem.texto_exibido}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
