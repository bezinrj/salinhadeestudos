import { useCallback, useEffect, useRef, useState } from "react";
import { HIGHLIGHT_COLORS, type VmHighlightCor, type VmMarcacao } from "@/types/vademecum";
import { cn } from "@/lib/utils";
import { snapToWordBoundaries } from "@/lib/textSelection";
import { GrifoPopover } from "./GrifoPopover";

interface Props {
  text: string;
  marcacoes: VmMarcacao[];
  onCreate: (range: { start: number; end: number; trecho: string; cor: VmHighlightCor; anotacao?: string }) => void;
  onUpdate?: (id: string, cor: VmHighlightCor, anotacao?: string) => void;
  onRemove: (id: string) => void;
  className?: string;
  prefix?: React.ReactNode;
}

interface PendingSelection {
  start: number;
  end: number;
  trecho: string;
  x: number;
  y: number;
}

export function HighlightableText({ text, marcacoes, onCreate, onUpdate, onRemove, className, prefix }: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);

  const [newSel, setNewSel] = useState<PendingSelection | null>(null);
  const [editingMarc, setEditingMarc] = useState<(VmMarcacao & { x: number; y: number }) | null>(null);

  const marcacoesRef = useRef(marcacoes);
  marcacoesRef.current = marcacoes;

  const closeAll = useCallback(() => {
    setNewSel(null);
    setEditingMarc(null);
  }, []);

  /** Lê a seleção atual do documento e abre o popover, se ela pertencer a este bloco. */
  const evaluateSelection = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const s = window.getSelection();
    if (!s || s.isCollapsed || s.rangeCount === 0) return;

    const range = s.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;
    if (!range.toString().trim()) return;

    // Offsets brutos relativos ao texto puro do bloco
    const preRange = range.cloneRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const prefixLen = prefixLength(container);
    const rawStart = Math.max(0, preRange.toString().length - prefixLen);
    const rawEnd = rawStart + range.toString().length;

    // Ajusta para palavras inteiras
    const { start, end } = snapToWordBoundaries(text, rawStart, rawEnd);
    if (end <= start) return;

    const trecho = text.slice(start, end);

    // Se encosta em um grifo existente, abre a edição desse grifo
    const hit = marcacoesRef.current.find((m) => !(end <= m.offset_inicio || start >= m.offset_fim));
    const rect = range.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top - 8;

    if (hit) {
      setNewSel(null);
      setEditingMarc({ ...hit, x, y });
      window.getSelection()?.removeAllRanges();
      return;
    }

    setEditingMarc(null);
    setNewSel({ start, end, trecho, x, y });
  }, [text]);

  // Seleção por mouse/toque/teclado — o navegador só finaliza no pointerup/keyup,
  // e `selectionchange` com debounce cobre ajustes de alça no mobile.
  useEffect(() => {
    let raf = 0;
    let timer: number | undefined;

    const immediate = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => evaluateSelection());
    };
    const debounced = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => evaluateSelection(), 220);
    };

    document.addEventListener("pointerup", immediate);
    document.addEventListener("touchend", immediate);
    document.addEventListener("keyup", immediate);
    document.addEventListener("selectionchange", debounced);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      document.removeEventListener("pointerup", immediate);
      document.removeEventListener("touchend", immediate);
      document.removeEventListener("keyup", immediate);
      document.removeEventListener("selectionchange", debounced);
    };
  }, [evaluateSelection]);

  const handleSave = (cor: VmHighlightCor, anotacao: string) => {
    if (editingMarc && onUpdate) {
      onUpdate(editingMarc.id, cor, anotacao);
    } else if (newSel) {
      onCreate({ start: newSel.start, end: newSel.end, trecho: newSel.trecho, cor, anotacao });
      window.getSelection()?.removeAllRanges();
    }
    closeAll();
  };

  const handleRemove = () => {
    if (editingMarc) onRemove(editingMarc.id);
    closeAll();
  };

  // Render text com marcações (sem sobreposição)
  const sorted = [...marcacoes].sort((a, b) => a.offset_inicio - b.offset_inicio);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((m, idx) => {
    if (m.offset_inicio < cursor) return;
    if (m.offset_inicio > cursor) nodes.push(text.slice(cursor, m.offset_inicio));
    const seg = text.slice(m.offset_inicio, m.offset_fim);
    const cor = HIGHLIGHT_COLORS[m.cor as VmHighlightCor] ?? HIGHLIGHT_COLORS.amarelo;
    nodes.push(
      <mark
        key={`m-${m.id}-${idx}`}
        className={cn(
          "cursor-pointer rounded-sm px-0.5 transition-shadow hover:shadow-[0_0_0_2px_rgba(255,255,255,0.25)]",
          cor.bg,
          m.anotacao ? "border-b-2 border-dashed border-white/50" : "",
        )}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          window.getSelection()?.removeAllRanges();
          setEditingMarc({ ...m, x: e.clientX, y: e.clientY - 8 });
          setNewSel(null);
        }}
        title={m.anotacao ? stripHtml(m.anotacao).slice(0, 140) || "Tem anotação" : undefined}
      >
        {seg}
      </mark>,
    );
    cursor = m.offset_fim;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return (
    <>
      <span ref={containerRef} className={cn("whitespace-pre-wrap", className)}>
        {prefix}
        {nodes}
      </span>

      <GrifoPopover
        open={!!newSel || !!editingMarc}
        x={editingMarc ? editingMarc.x : (newSel?.x ?? 0)}
        y={editingMarc ? editingMarc.y : (newSel?.y ?? 0)}
        onClose={closeAll}
        trecho={editingMarc ? editingMarc.trecho : (newSel?.trecho ?? "")}
        initialCor={editingMarc ? editingMarc.cor : "amarelo"}
        initialAnotacao={editingMarc ? editingMarc.anotacao : ""}
        onSave={handleSave}
        onRemove={editingMarc ? handleRemove : undefined}
      />
    </>
  );
}

/** Comprimento do texto renderizado antes do texto do artigo (ex.: rótulo "§ 1º"). */
function prefixLength(container: HTMLElement) {
  const first = container.firstElementChild;
  if (first && first.tagName === "STRONG") return first.textContent?.length ?? 0;
  return 0;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
