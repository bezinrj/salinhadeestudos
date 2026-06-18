import { useRef, useState } from "react";
import { HIGHLIGHT_COLORS, type VmHighlightCor, type VmMarcacao } from "@/types/vademecum";
import { cn } from "@/lib/utils";
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

interface Selection {
  start: number;
  end: number;
  trecho: string;
  x: number;
  y: number;
}

export function HighlightableText({ text, marcacoes, onCreate, onUpdate, onRemove, className, prefix }: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);

  const [newSel, setNewSel] = useState<Selection | null>(null);
  const [editingMarc, setEditingMarc] = useState<(VmMarcacao & { x: number; y: number }) | null>(null);

  // Aguarda 1 frame para garantir que o navegador finalizou a seleção
  // antes de medirmos os offsets e abrirmos o popover — evita "abre e fecha".
  const handleMouseUp = (e: React.MouseEvent) => {
    // Ignora cliques dentro de uma <mark> existente (tratados por onClick do mark)
    if ((e.target as HTMLElement).closest("mark")) return;

    requestAnimationFrame(() => {
      const s = window.getSelection();
      if (!s || s.isCollapsed || s.rangeCount === 0 || !containerRef.current) {
        return;
      }
      const range = s.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        return;
      }
      const trecho = range.toString();
      if (!trecho.trim()) return;

      const preRange = range.cloneRange();
      preRange.selectNodeContents(containerRef.current);
      preRange.setEnd(range.startContainer, range.startOffset);
      const start = preRange.toString().length;
      const end = start + trecho.length;

      // Bloqueia sobreposição: se intercepta qualquer marcação existente,
      // não permite criar uma segunda camada sobre o mesmo trecho.
      const overlaps = marcacoes.some(
        (m) => !(end <= m.offset_inicio || start >= m.offset_fim),
      );
      if (overlaps) {
        window.getSelection()?.removeAllRanges();
        return;
      }

      const rect = range.getBoundingClientRect();
      setNewSel({ start, end, trecho, x: rect.left + rect.width / 2, y: rect.top - 8 });
      setEditingMarc(null);
    });
  };

  const handleDrawerSave = (cor: VmHighlightCor, anotacao: string) => {
    if (editingMarc && onUpdate) {
      onUpdate(editingMarc.id, cor, anotacao);
    } else if (newSel) {
      onCreate({ start: newSel.start, end: newSel.end, trecho: newSel.trecho, cor, anotacao });
      window.getSelection()?.removeAllRanges();
    }
    setNewSel(null);
    setEditingMarc(null);
  };

  const handleDrawerRemove = () => {
    if (editingMarc) {
      onRemove(editingMarc.id);
    }
    setNewSel(null);
    setEditingMarc(null);
  };

  // Render text com marcações (já sem sobreposição, garantido na criação)
  const sorted = [...marcacoes].sort((a, b) => a.offset_inicio - b.offset_inicio);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((m, idx) => {
    if (m.offset_inicio < cursor) return; // segurança extra contra sobreposição legada
    if (m.offset_inicio > cursor) nodes.push(text.slice(cursor, m.offset_inicio));
    const seg = text.slice(m.offset_inicio, m.offset_fim);
    const cor = HIGHLIGHT_COLORS[m.cor as VmHighlightCor] ?? HIGHLIGHT_COLORS.amarelo;
    nodes.push(
      <mark
        key={`m-${m.id}-${idx}`}
        className={cn("cursor-pointer rounded-sm px-0.5", cor.bg, m.anotacao ? "border-b-2 border-dashed border-white/50" : "")}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setEditingMarc({ ...m, x: e.clientX, y: e.clientY - 8 });
          setNewSel(null);
        }}
        title={m.anotacao ? "Tem anotação (clique para ver)" : undefined}
      >
        {seg}
      </mark>,
    );
    cursor = m.offset_fim;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return (
    <>
      <span ref={containerRef} className={cn("whitespace-pre-wrap", className)} onMouseUp={handleMouseUp}>
        {prefix}
        {nodes}
      </span>

      <GrifoPopover
        open={!!newSel || !!editingMarc}
        x={editingMarc ? editingMarc.x : (newSel?.x ?? 0)}
        y={editingMarc ? editingMarc.y : (newSel?.y ?? 0)}
        onClose={() => {
          setNewSel(null);
          setEditingMarc(null);
        }}
        trecho={editingMarc ? editingMarc.trecho : newSel?.trecho ?? ""}
        initialCor={editingMarc ? editingMarc.cor : "amarelo"}
        initialAnotacao={editingMarc ? editingMarc.anotacao : ""}
        onSave={handleDrawerSave}
        onRemove={editingMarc ? handleDrawerRemove : undefined}
      />
    </>
  );
}
