import type { VmArtigo } from "@/types/vademecum";
import { cn } from "@/lib/utils";

interface Props {
  artigo: VmArtigo;
  onRemissaoClick?: (remissao: VmArtigo["remissoes"][number]) => void;
}

const TIPO_INDENT: Record<string, string> = {
  paragrafo: "pl-4",
  paragrafo_unico: "pl-4",
  inciso: "pl-8",
  alinea: "pl-12",
};

export function ArticleText({ artigo, onRemissaoClick }: Props) {
  const renderTextWithRemissoes = (text: string) => {
    if (!artigo.remissoes || artigo.remissoes.length === 0) return text;
    // Replace literal occurrences of remission display text inside the article body
    // (best-effort; for richer matching the admin would mark them up explicitly).
    let nodes: (string | JSX.Element)[] = [text];
    artigo.remissoes.forEach((rem, idx) => {
      const next: (string | JSX.Element)[] = [];
      nodes.forEach((node, ni) => {
        if (typeof node !== "string") return next.push(node);
        const i = node.indexOf(rem.texto_exibido);
        if (i === -1) return next.push(node);
        next.push(node.slice(0, i));
        next.push(
          <button
            key={`rem-${idx}-${ni}`}
            type="button"
            onClick={() => onRemissaoClick?.(rem)}
            className="text-sky-400 underline decoration-dotted underline-offset-2 hover:text-sky-300"
          >
            {rem.texto_exibido}
          </button>,
        );
        next.push(node.slice(i + rem.texto_exibido.length));
      });
      nodes = next;
    });
    return <>{nodes}</>;
  };

  return (
    <div className="font-serif text-[16px] leading-[1.85] text-foreground/90">
      <p>{renderTextWithRemissoes(artigo.texto)}</p>
      {artigo.paragrafos.map((p) => (
        <p key={p.id} className={cn("mt-3", TIPO_INDENT[p.tipo] ?? "pl-4")}>
          {p.rotulo && <strong className="mr-1 text-foreground">{p.rotulo}</strong>}
          {renderTextWithRemissoes(p.texto)}
        </p>
      ))}

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
