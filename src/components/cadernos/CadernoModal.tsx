import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Code, Save } from "lucide-react";
import { useCadernos, useCadernoNotas } from "@/hooks/useCadernos";
import type { VmArtigo } from "@/types/vademecum";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import type { VmCadernoNota } from "@/types/cadernos";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artigo?: VmArtigo; // Contexto opcional se vier da legislação
  leiSigla?: string; // Ex: "CF"
  cadernoId?: string;
  notaToEdit?: VmCadernoNota;
}

export function CadernoModal({ open, onOpenChange, artigo, leiSigla, cadernoId, notaToEdit }: Props) {
  const { profile } = useAuth();
  const userName = profile?.name || profile?.username || "Deltinha";
  
  const { cadernos, create: createCaderno } = useCadernos();
  const [selectedCadernoId, setSelectedCadernoId] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const { create: createNota, update: updateNota, isLoading: saving } = useCadernoNotas(selectedCadernoId);

  useEffect(() => {
    if (open) {
      if (notaToEdit) {
        setSelectedCadernoId(notaToEdit.caderno_id);
        setHtmlContent(notaToEdit.conteudo_html || "");
        if (editorRef.current) {
          editorRef.current.innerHTML = notaToEdit.conteudo_html || "";
        }
      } else {
        if (cadernoId) {
          setSelectedCadernoId(cadernoId);
        } else if (cadernos.length > 0 && !selectedCadernoId) {
          setSelectedCadernoId(cadernos[0].id);
        }
        setHtmlContent("");
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      }
    }
  }, [open, cadernos, selectedCadernoId, cadernoId, notaToEdit]);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) setHtmlContent(editorRef.current.innerHTML);
    editorRef.current?.focus();
  };

  const handleSave = async () => {
    if (!selectedCadernoId) return toast.error("Selecione ou crie um caderno primeiro");
    const isArtigo = !!artigo || (notaToEdit && !!notaToEdit.artigo_id);
    const isContentEmpty = !htmlContent.trim() && (!editorRef.current || !editorRef.current.textContent?.trim());
    
    if (isContentEmpty && !isArtigo) {
      return toast.error("A anotação não pode estar vazia");
    }

    try {
      if (notaToEdit) {
        await updateNota.mutateAsync({
          id: notaToEdit.id,
          conteudo_html: htmlContent,
        });
        toast.success("Anotação atualizada!");
      } else {
        await createNota.mutateAsync({
          caderno_id: selectedCadernoId,
          artigo_id: artigo?.id,
          conteudo_html: htmlContent,
          tags: artigo ? ["Legislação"] : ["Livre"],
        });
        toast.success("Anotação salva no caderno!");
      }
      onOpenChange(false);
      setHtmlContent("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleNewCaderno = async () => {
    const title = prompt("Nome do novo caderno:");
    if (!title?.trim()) return;
    try {
      const novo = await createCaderno.mutateAsync({ titulo: title, pasta_id: null });
      setSelectedCadernoId(novo.id);
      toast.success("Caderno criado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#1B1E2B] border-white/10 text-white p-0 gap-0 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-white/5">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
            CADERNO DO {userName.toUpperCase()}
          </div>
          <DialogTitle className="text-2xl font-bold">Nova anotação</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Selector de Caderno */}
          <div>
            <label className="text-xs text-white/60 mb-2 block">Salvar em</label>
            <div className="flex gap-2">
              <Select value={selectedCadernoId} onValueChange={setSelectedCadernoId}>
                <SelectTrigger className="flex-1 bg-[#151722] border-white/10">
                  <SelectValue placeholder="Selecione um caderno" />
                </SelectTrigger>
                <SelectContent className="bg-[#1B1E2B] border-white/10 text-white">
                  {cadernos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>
                  ))}
                  {cadernos.length === 0 && (
                    <SelectItem value="none" disabled>Nenhum caderno criado</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-[#151722] border-white/10 px-3" onClick={handleNewCaderno}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contexto da Legislação */}
          {artigo && (
            <div className="bg-[#202434] rounded-xl p-4 border border-white/5">
              <div className="inline-block bg-[#1B3648] text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full mb-3">
                LEGISLAÇÃO
              </div>
              <div className="font-bold mb-1">
                {leiSigla && `${leiSigla} — `}{artigo.rotulo || `Art. ${artigo.numero}`}
              </div>
              <div className="text-sm text-white/70 border-l-2 border-white/10 pl-3 italic line-clamp-3">
                {artigo.texto}
              </div>
            </div>
          )}

          {/* Editor Rich Text */}
          <div className="bg-[#202434] rounded-xl border border-white/5 overflow-hidden flex flex-col min-h-[250px]">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-[#1B1E2B]/50 flex-wrap">
              <ToolBtn icon={<Bold className="w-4 h-4"/>} onClick={() => applyFormat("bold")} />
              <ToolBtn icon={<Italic className="w-4 h-4"/>} onClick={() => applyFormat("italic")} />
              <ToolBtn icon={<Underline className="w-4 h-4"/>} onClick={() => applyFormat("underline")} />
              <ToolBtn icon={<Strikethrough className="w-4 h-4"/>} onClick={() => applyFormat("strikeThrough")} />
              <div className="w-px h-5 bg-white/10 mx-1" />
              {/* Cores */}
              {["#F87171", "#34D399", "#60A5FA", "#A78BFA", "#FBBF24"].map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); applyFormat("foreColor", c); }}
                  className="w-6 h-6 rounded-md hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolBtn icon={<List className="w-4 h-4"/>} onClick={() => applyFormat("insertUnorderedList")} />
              <ToolBtn icon={<ListOrdered className="w-4 h-4"/>} onClick={() => applyFormat("insertOrderedList")} />
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolBtn icon={<Quote className="w-4 h-4"/>} onClick={() => applyFormat("formatBlock", "blockquote")} />
            </div>
            
            {/* Area de texto */}
            <div
              ref={editorRef}
              contentEditable
              onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
              className="flex-1 p-4 outline-none text-sm text-white/90 prose prose-invert max-w-none"
              data-placeholder="Comece a escrever..."
              style={{ ['--placeholder' as any]: '"Comece a escrever..."' }}
            />
            <style>{`
              div[contenteditable]:empty:before {
                content: var(--placeholder);
                color: rgba(255,255,255,0.3);
                pointer-events: none;
                display: block;
              }
              div[contenteditable] blockquote {
                border-left: 2px solid rgba(255,255,255,0.2);
                padding-left: 1rem;
                color: rgba(255,255,255,0.7);
                font-style: italic;
              }
            `}</style>
            
            {/* Footer do Editor */}
            <div className="p-3 text-right text-[10px] text-white/30 font-mono bg-[#1B1E2B]/30 flex justify-between items-center">
              <div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs font-bold" onClick={handleSave} disabled={saving}>
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Salvar Anotação
                </Button>
              </div>
              {editorRef.current?.textContent?.length || 0} / 50000
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToolBtn({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
    >
      {icon}
    </button>
  );
}
