import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Bold, Italic, Underline, Strikethrough, Trash2, X } from "lucide-react";
import { HIGHLIGHT_COLORS, type VmHighlightCor } from "@/types/vademecum";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  trecho: string;
  initialCor?: VmHighlightCor;
  initialAnotacao?: string;
  onSave: (cor: VmHighlightCor, anotacao: string) => void;
  onRemove?: () => void;
}

const MARGIN = 12;
const WIDTH = 320;

export function GrifoPopover({ open, x, y, onClose, trecho, initialCor, initialAnotacao, onSave, onRemove }: Props) {
  const [cor, setCor] = useState<VmHighlightCor>("amarelo");
  const [anotacao, setAnotacao] = useState("");
  const [pos, setPos] = useState<{ left: number; top: number; flipped: boolean }>({ left: x, top: y, flipped: false });
  const editorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      setCor(initialCor ?? "amarelo");
      setAnotacao(initialAnotacao ?? "");
      if (editorRef.current) editorRef.current.innerHTML = initialAnotacao ?? "";
    }
  }, [open, initialCor, initialAnotacao, trecho]);

  // Posicionamento com clamp nas bordas e flip para baixo quando não couber acima
  useLayoutEffect(() => {
    if (!open || isMobile) return;
    const h = popoverRef.current?.offsetHeight ?? 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = Math.min(Math.max(x, WIDTH / 2 + MARGIN), vw - WIDTH / 2 - MARGIN);
    const fitsAbove = y - h - MARGIN > 0;
    const top = fitsAbove ? y - MARGIN : Math.min(y + 28, vh - h - MARGIN);
    setPos({ left, top, flipped: !fitsAbove });
  }, [open, x, y, isMobile, trecho]);

  // Fechar: clique fora, Esc e rolagem da página
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    const t = setTimeout(() => {
      document.addEventListener("mousedown", outside);
      document.addEventListener("touchstart", outside);
    }, 0);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("touchstart", outside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  const currentAnotacaoText = () => editorRef.current?.textContent?.trim() ?? "";
  const hasAnotacao = anotacao.replace(/<[^>]*>/g, "").trim().length > 0 || currentAnotacaoText().length > 0;

  const handleColorClick = (c: VmHighlightCor) => {
    setCor(c);
    if (!hasAnotacao) onSave(c, "");
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    if (editorRef.current) setAnotacao(editorRef.current.innerHTML);
  };

  const body = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-white/50">Grifar trecho</div>
        <button
          onClick={onClose}
          className="rounded p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 line-clamp-2 font-serif text-sm italic leading-relaxed text-white/70">"{trecho}"</div>

      {/* Cores */}
      <div className="mb-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Cor de fundo</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(HIGHLIGHT_COLORS) as VmHighlightCor[]).map((c) => (
            <button
              key={c}
              onClick={() => handleColorClick(c)}
              className={cn(
                "rounded-lg border border-white/10 transition-all",
                isMobile ? "h-11 w-11" : "h-9 w-9",
                HIGHLIGHT_COLORS[c].swatch,
                cor === c
                  ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#1B1E2B]"
                  : "opacity-80 hover:scale-105 hover:opacity-100",
              )}
              title={HIGHLIGHT_COLORS[c].label}
              aria-label={HIGHLIGHT_COLORS[c].label}
              aria-pressed={cor === c}
            />
          ))}
        </div>
      </div>

      {/* Anotação */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Anotação (opcional)</div>
          <div className="flex gap-1">
            {[
              { icon: Bold, cmd: "bold", label: "Negrito" },
              { icon: Italic, cmd: "italic", label: "Itálico" },
              { icon: Underline, cmd: "underline", label: "Sublinhado" },
              { icon: Strikethrough, cmd: "strikeThrough", label: "Tachado" },
            ].map((t) => (
              <button
                key={t.cmd}
                title={t.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyFormat(t.cmd);
                }}
                className="flex h-7 w-7 items-center justify-center rounded border border-white/5 bg-[#25293A] text-white/70 transition-colors hover:bg-[#2D3142] hover:text-white"
              >
                <t.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
        <div
          ref={editorRef}
          contentEditable
          onInput={(e) => setAnotacao(e.currentTarget.innerHTML)}
          className={cn(
            "prose prose-invert prose-sm w-full rounded-lg border border-white/5 bg-[#25293A] p-3 text-sm text-white outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50",
            isMobile ? "min-h-[110px]" : "min-h-[80px]",
          )}
          data-vm-anotacao
          style={{ ["--placeholder" as any]: '"Lembrete sobre este trecho..."' }}
        />
        <style>{`
          div[data-vm-anotacao]:empty:before {
            content: var(--placeholder);
            color: rgba(255,255,255,0.3);
            pointer-events: none;
            display: block;
          }
        `}</style>
      </div>

      <div className="flex items-center gap-2">
        {onRemove && (
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={onRemove}
            title="Remover grifo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          className="h-10 flex-1 bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          onClick={() => onSave(cor, editorRef.current?.innerHTML ?? anotacao)}
        >
          Salvar grifo
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div
        ref={popoverRef}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-[#1B1E2B] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        {body}
      </div>
    );
  }

  return (
    <div
      ref={popoverRef}
      className={cn(
        "fixed z-50 w-80 -translate-x-1/2 rounded-xl border border-border bg-[#1B1E2B] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150",
        !pos.flipped && "-translate-y-full",
      )}
      style={{ left: pos.left, top: pos.top }}
    >
      {body}
    </div>
  );
}
