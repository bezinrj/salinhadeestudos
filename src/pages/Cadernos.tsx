import { useState, useEffect } from "react";
import { useCadernos, useCadernoNotas, useCadernoPastas } from "@/hooks/useCadernos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Download, FileText, Trash2, FolderPlus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CadernoModal } from "@/components/cadernos/CadernoModal";

export default function CadernosPage() {
  const { profile } = useAuth();
  const userName = profile?.name || profile?.username || "Deltinha";

  const { pastas, create: createPasta, remove: removePasta } = useCadernoPastas();
  const { cadernos, create: createCaderno, remove: removeCaderno, moveToPasta } = useCadernos();
  const [activePastaId, setActivePastaId] = useState<string>("all");
  const [activeCadernoId, setActiveCadernoId] = useState<string>("");
  const { notas, remove: removeNota, isLoading } = useCadernoNotas(activeCadernoId || null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notaToEdit, setNotaToEdit] = useState<any>(null);

  const handleEditNota = (nota: any) => {
    setNotaToEdit(nota);
    setIsModalOpen(true);
  };

  useEffect(() => {
    // Ao mudar os cadernos ou a pasta, seleciona um caderno padrão se não houver um selecionado válido
    if (cadernos.length > 0) {
      const filtered = activePastaId === "all"
        ? cadernos
        : activePastaId === "none"
          ? cadernos.filter(c => !c.pasta_id)
          : cadernos.filter(c => c.pasta_id === activePastaId);

      if (filtered.length > 0 && !filtered.find(c => c.id === activeCadernoId)) {
        setActiveCadernoId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveCadernoId("");
      }
    } else {
      setActiveCadernoId("");
    }
  }, [cadernos, activePastaId, activeCadernoId]);

  const handleNewPasta = async () => {
    const nome = prompt("Nome da nova pasta:");
    if (!nome?.trim()) return;
    try {
      await createPasta.mutateAsync(nome);
      toast.success("Pasta criada");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleNewCaderno = async () => {
    const titulo = prompt("Nome do novo caderno:");
    if (!titulo?.trim()) return;
    try {
      const targetPastaId = (activePastaId === "all" || activePastaId === "none") ? null : activePastaId;
      const novo = await createCaderno.mutateAsync({ titulo, pasta_id: targetPastaId });
      setActiveCadernoId(novo.id);
      toast.success("Caderno criado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleExcluirPasta = async () => {
    if (activePastaId === "all" || activePastaId === "none") return;
    if (confirm("Excluir esta pasta? Os cadernos ficarão sem pasta.")) {
      try {
        await removePasta.mutateAsync(activePastaId);
        setActivePastaId("all");
        toast.success("Pasta excluída");
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  const handleExcluirCaderno = async () => {
    if (!activeCadernoId) return;
    if (confirm("Deseja realmente excluir este caderno e todas as suas anotações?")) {
      try {
        await removeCaderno.mutateAsync(activeCadernoId);
        toast.success("Caderno excluído");
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  const filteredCadernos = activePastaId === "all"
    ? cadernos
    : activePastaId === "none"
      ? cadernos.filter(c => !c.pasta_id)
      : cadernos.filter(c => c.pasta_id === activePastaId);

  if (!entitlements.cadernos) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <UnlockPremiumCard
          variant="lei"
          description="Os Cadernos fazem parte do Vade Digital, do Combo e da Salinha PRO. Assine para criar pastas, cadernos e salvar suas anotações."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card border border-border rounded-lg text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="p-2 bg-blue-600/20 text-blue-500 rounded-lg">
                <FileText className="w-6 h-6" />
              </span>
              Caderno do {userName}
            </h1>
            <p className="text-white/60 mt-2 text-sm max-w-lg">
              Crie cadernos por temas, complemente com julgados e remissões
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-white/60 hover:text-white">
              <Download className="w-4 h-4 mr-2" /> PDF / DOC
            </Button>
            <Button variant="outline" className="bg-[#1B1E2B] border-white/10" size="icon">
              <FileText className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Seletores: Pasta e Caderno */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-white/60">Pasta</label>
              {(activePastaId !== "all" && activePastaId !== "none") && (
                <button onClick={handleExcluirPasta} className="text-xs text-red-400 hover:text-red-300">Excluir Pasta</button>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={activePastaId} onValueChange={setActivePastaId}>
                <SelectTrigger className="flex-1 bg-[#1B1E2B] border-white/10">
                  <SelectValue placeholder="Selecione uma pasta" />
                </SelectTrigger>
                <SelectContent className="bg-[#1B1E2B] border-white/10 text-white">
                  <SelectItem value="all">Todas as Pastas</SelectItem>
                  {pastas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-[#1B1E2B] border-white/10 px-3" onClick={handleNewPasta} title="Nova pasta">
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-white/60">Caderno ativo</label>
              {activeCadernoId && (
                <button onClick={handleExcluirCaderno} className="text-xs text-red-400 hover:text-red-300">Excluir Caderno</button>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={activeCadernoId} onValueChange={setActiveCadernoId} disabled={filteredCadernos.length === 0}>
                <SelectTrigger className="flex-1 bg-[#1B1E2B] border-white/10">
                  <SelectValue placeholder={filteredCadernos.length === 0 ? "Nenhum caderno nesta pasta" : "Selecione um caderno"} />
                </SelectTrigger>
                <SelectContent className="bg-[#1B1E2B] border-white/10 text-white">
                  {filteredCadernos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-[#1B1E2B] border-white/10" onClick={handleNewCaderno}>
                <Plus className="w-4 h-4 mr-2" /> Novo caderno
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="py-20 text-center text-white/40">Carregando anotações...</div>
        ) : !activeCadernoId ? (
          <div className="border border-white/5 bg-[#1B1E2B]/50 rounded-xl p-12 text-center">
            <h3 className="font-bold mb-2">Nenhum caderno selecionado</h3>
            <p className="text-white/60 text-sm">
              Crie ou selecione um caderno acima para ver as anotações.
            </p>
          </div>
        ) : notas.length === 0 ? (
          <div className="border border-white/5 bg-[#1B1E2B]/50 rounded-xl p-12 text-center">
            <h3 className="font-bold mb-2">Nenhuma anotação ainda</h3>
            <p className="text-white/60 text-sm">
              Adicione itens ao seu caderno pelo Vade Mecum ou crie anotações livres abaixo.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notas.map((nota) => (
              <div key={nota.id} className="border border-white/5 bg-[#1B1E2B] rounded-xl p-5 relative group">
                <div className="flex gap-2 mb-3">
                  {nota.tags.map(t => (
                    <span key={t} className="text-[10px] font-bold bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full uppercase">
                      {t}
                    </span>
                  ))}
                  {nota.artigo && (
                    <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded-full uppercase">
                      {nota.artigo.lei?.sigla} — {nota.artigo.rotulo || `Art. ${nota.artigo.numero}`}
                    </span>
                  )}
                </div>

                {nota.artigo && nota.artigo.texto && (
                  <div className="mb-4 text-sm text-white/70 border-l-2 border-white/10 pl-3 italic whitespace-pre-wrap">
                    {nota.artigo.texto}
                  </div>
                )}

                {nota.conteudo_html && nota.conteudo_html.trim() !== "" && (
                  <div
                    className="prose prose-invert prose-sm max-w-none text-white/80"
                    dangerouslySetInnerHTML={{ __html: nota.conteudo_html }}
                  />
                )}

                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all bg-[#1B1E2B]/80 backdrop-blur-sm rounded-lg p-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white/40 hover:text-blue-400"
                    onClick={() => handleEditNota(nota)}
                    title="Editar anotação"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white/40 hover:text-red-400"
                    onClick={() => removeNota.mutate(nota.id)}
                    title="Excluir anotação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Free Note */}
        {activeCadernoId && (
          <button
            onClick={() => { setNotaToEdit(null); setIsModalOpen(true); }}
            className="w-full py-4 border border-dashed border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Adicionar anotação livre
          </button>
        )}

      </div>

      <CadernoModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setNotaToEdit(null);
        }}
        cadernoId={activeCadernoId}
        notaToEdit={notaToEdit}
      />
    </div>
  );
}
