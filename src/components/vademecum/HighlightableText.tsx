import { useRef, useState } from "react";
import { HIGHLIGHT_COLORS, type VmHighlightCor, type VmMarcacao } from "@/types/vademecum";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Props {
  text: string;
  marcacoes: VmMarcacao[];
  onCreate: (range: { start: number; end: number; trecho: string; cor: VmHighlightCor }) => void;
  onRemove: (id: string) => void;
  className?: string;
  prefix?: React.ReactNode;
}

interface Selection {
  start: number;
  end: number;
  trecho: string;
  x: number;
  y: number;
}

export function HighlightableText({ text, marcacoes, onCreate, onRemove, className, prefix }: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [sel, setSel] = useState<Selection | null>(null);
  const [openMarc, setOpenMarc] = useState<{ id: string; x: number; y: number } | null>(null);

  const handleMouseUp = () => {
    const s = window.getSelection();
    if (!s || s.isCollapsed || !containerRef.current) {
      setSel(null);
      return;
    }
    const range = s.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setSel(null);
      return;
    }
    // Compute offsets relative to container text
    const preRange = range.cloneRange();
    preRange.selectNodeContents(containerRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const trecho = range.toString();
    if (!trecho.trim()) {
      setSel(null);
      return;
    }
    const end = start + trecho.length;
    const rect = range.getBoundingClientRect();
    setSel({ start, end, trecho, x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  const handleColorClick = (cor: VmHighlightCor) => {
    if (!sel) return;
    onCreate({ start: sel.start, end: sel.end, trecho: sel.trecho, cor });
    window.getSelection()?.removeAllRanges();
    setSel(null);
  };

  // Render text with marcacoes
  const sorted = [...marcacoes].sort((a, b) => a.offset_inicio - b.offset_inicio);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((m, idx) => {
    if (m.offset_inicio < cursor) return; // skip overlaps
    if (m.offset_inicio > cursor) nodes.push(text.slice(cursor, m.offset_inicio));
    const seg = text.slice(m.offset_inicio, m.offset_fim);
    const cor = HIGHLIGHT_COLORS[m.cor as VmHighlightCor] ?? HIGHLIGHT_COLORS.amarelo;
    nodes.push(
      <mark
        key={`m-${m.id}-${idx}`}
        className={cn("cursor-pointer rounded-sm px-0.5", cor.bg)}
        onClick={(e) => {
          e.stopPropagation();
          setOpenMarc({ id: m.id, x: e.clientX, y: e.clientY - 8 });
        }}
      >
        {seg}
      </mark>,
    );
    cursor = m.offset_fim;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return (
    <>
      <span ref={containerRef} className={className} onMouseUp={handleMouseUp}>
        {prefix}
        {nodes}
      </span>

      {sel && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover p-1.5 shadow-xl"
          style={{ left: sel.x, top: sel.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-1">
            {(Object.keys(HIGHLIGHT_COLORS) as VmHighlightCor[]).map((c) => (
              <button
                key={c}
                title={HIGHLIGHT_COLORS[c].label}
                onClick={() => handleColorClick(c)}
                className={cn("h-6 w-6 rounded-full border border-border transition hover:scale-110", HIGHLIGHT_COLORS[c].swatch)}
              />
            ))}
          </div>
        </div>
      )}

      {openMarc && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover p-1.5 shadow-xl"
          style={{ left: openMarc.x, top: openMarc.y }}
        >
          <button
            onClick={() => {
              onRemove(openMarc.id);
              setOpenMarc(null);
            }}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
          >
            <X className="h-3 w-3" /> Remover marcação
          </button>
        </div>
      )}
    </>
  );
}
