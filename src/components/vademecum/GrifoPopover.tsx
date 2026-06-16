import { useState, useEffect, useRef } from "react";
import { Bold, Italic, Underline, Strikethrough, Trash2 } from "lucide-react";
import { HIGHLIGHT_COLORS, type VmHighlightCor } from "@/types/vademecum";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

export function GrifoPopover({ open, x, y, onClose, trecho, initialCor, initialAnotacao, onSave, onRemove }: Props) {
  const [cor, setCor] = useState<VmHighlightCor>("amarelo");
  const [anotacao, setAnotacao] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCor(initialCor ?? "amarelo");
      setAnotacao(initialAnotacao ?? "");
      if (editorRef.current) {
        editorRef.current.innerHTML = initialAnotacao ?? "";
      }
    }
  }, [open, initialCor, initialAnotacao, trecho]);

  if (!open) return null;

  const handleColorClick = (c: VmHighlightCor) => {
    setCor(c);
    // Se não houver anotação, salva imediatamente e fecha
    if (!anotacao.trim() && (!editorRef.current || !editorRef.current.textContent?.trim())) {
      onSave(c, "");
    }
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    if (editorRef.current) {
      setAnotacao(editorRef.current.innerHTML);
    }
  };

  const hasAnotacao = anotacao.trim().length > 0 || (editorRef.current && editorRef.current.textContent?.trim() !== "");

  return (
    <>
      {/* Backdrop invisível para fechar ao clicar fora */}
      <div 
        className="fixed inset-0 z-40" 
        onMouseDown={(e) => {
          e.preventDefault();
          onClose();
        }} 
      />
      
      {/* Popover */}
      <div 
        className="fixed z-50 -translate-x-1/2 -translate-y-full w-80 rounded-xl border border-border bg-[#1B1E2B] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ left: x, top: y - 12 }}
        onMouseDown={(e) => {
          // Previne que o clique fora do contentEditable perca a seleção original da janela,
          // mas permite o foco em áreas interativas.
          if ((e.target as HTMLElement).isContentEditable) return;
          if ((e.target as HTMLElement).tagName === 'BUTTON') return;
          e.preventDefault(); 
        }}
      >
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">
          GRIFAR TRECHO
        </div>

        {/* Selected Text Preview */}
        <div className="mb-4 text-sm font-serif italic text-white/70 line-clamp-2 leading-relaxed">
          "{trecho}"
        </div>

        {/* Formatting Tools (Rich Text) */}
        <div className="flex gap-1.5 mb-4">
          <button 
            className="flex h-8 w-8 items-center justify-center rounded bg-[#25293A] text-white/70 hover:bg-[#2D3142] hover:text-white transition-colors border border-white/5"
            title="Negrito"
            onMouseDown={(e) => { e.preventDefault(); applyFormat("bold"); }}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button 
            className="flex h-8 w-8 items-center justify-center rounded bg-[#25293A] text-white/70 hover:bg-[#2D3142] hover:text-white transition-colors border border-white/5"
            title="Itálico"
            onMouseDown={(e) => { e.preventDefault(); applyFormat("italic"); }}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button 
            className="flex h-8 w-8 items-center justify-center rounded bg-[#25293A] text-white/70 hover:bg-[#2D3142] hover:text-white transition-colors border border-white/5"
            title="Sublinhado"
            onMouseDown={(e) => { e.preventDefault(); applyFormat("underline"); }}
          >
            <Underline className="h-4 w-4" />
          </button>
          <button 
            className="flex h-8 w-8 items-center justify-center rounded bg-[#25293A] text-white/70 hover:bg-[#2D3142] hover:text-white transition-colors border border-white/5"
            title="Tachado"
            onMouseDown={(e) => { e.preventDefault(); applyFormat("strikeThrough"); }}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </div>

        {/* Colors */}
        <div className="mb-4">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
            COR DE FUNDO
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(HIGHLIGHT_COLORS) as VmHighlightCor[]).map((c) => (
              <button
                key={c}
                onClick={() => handleColorClick(c)}
                className={cn(
                  "h-8 w-8 rounded-lg transition-all border border-white/10",
                  HIGHLIGHT_COLORS[c].swatch,
                  cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#1B1E2B] scale-110" : "hover:scale-105 opacity-80 hover:opacity-100"
                )}
                title={HIGHLIGHT_COLORS[c].label}
              />
            ))}
          </div>
        </div>

        {/* Annotation Rich Text Editor */}
        <div className="mb-3">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
            ANOTAÇÃO (opcional)
          </div>
          <div
            ref={editorRef}
            contentEditable
            onInput={(e) => setAnotacao(e.currentTarget.innerHTML)}
            onFocus={(e) => {
              if (e.currentTarget.innerHTML === "") {
                // Ensure it gets a p tag or empty text node
              }
            }}
            className="w-full min-h-[80px] rounded-lg bg-[#25293A] p-3 text-sm text-white border border-white/5 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none prose prose-invert prose-sm"
            data-placeholder="Lembrete sobre este trecho..."
            style={{
               // CSS hack to show placeholder in contentEditable
               ['--placeholder' as any]: '"Lembrete sobre este trecho..."'
            }}
          />
          <style>{`
            div[contenteditable]:empty:before {
              content: var(--placeholder);
              color: rgba(255,255,255,0.3);
              pointer-events: none;
              display: block; /* For Firefox */
            }
          `}</style>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2">
          {onRemove && (
            <Button 
              size="icon"
              variant="ghost" 
              className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={onRemove}
              title="Remover grifo"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          
          {(hasAnotacao || initialAnotacao) && (
            <Button 
              className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              onClick={() => onSave(cor, anotacao)}
            >
              Salvar grifo
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
