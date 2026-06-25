import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useCronoMaterias, CronoMateria } from "@/hooks/useCrono";
import { toast } from "sonner";

const PALETTE = [
  "#EAB308", "#EF4444", "#3B82F6", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CronoMateriasManager({ open, onOpenChange }: Props) {
  const {
    materias, assuntos,
    createMateria, updateMateria, deleteMateria,
    createAssunto, updateAssunto, deleteAssunto,
  } = useCronoMaterias();

  const [selectedMateriaId, setSelectedMateriaId] = useState<string>("");

  const [novaMateria, setNovaMateria] = useState("");
  const [novaCor, setNovaCor] = useState(PALETTE[0]);
  const [novoAssunto, setNovoAssunto] = useState("");

  const [editMatId, setEditMatId] = useState<string | null>(null);
  const [editMatNome, setEditMatNome] = useState("");
  const [editMatCor, setEditMatCor] = useState("");

  const [editAssId, setEditAssId] = useState<string | null>(null);
  const [editAssNome, setEditAssNome] = useState("");

  const selectedMateria = materias.find(m => m.id === selectedMateriaId);
  const filteredAssuntos = assuntos.filter(a => a.materia_id === selectedMateriaId);

  const handleCreateMateria = async () => {
    const nome = novaMateria.trim();
    if (!nome) return;
    try {
      const m = await createMateria.mutateAsync({ nome, cor: novaCor });
      setNovaMateria("");
      setNovaCor(PALETTE[0]);
      setSelectedMateriaId(m.id);
    } catch {
      toast.error("Erro ao criar matéria.");
    }
  };

  const handleCreateAssunto = async () => {
    const nome = novoAssunto.trim();
    if (!nome || !selectedMateriaId) return;
    try {
      await createAssunto.mutateAsync({ materia_id: selectedMateriaId, nome });
      setNovoAssunto("");
    } catch {
      toast.error("Erro ao criar assunto.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle>Gerenciar matérias e assuntos</DialogTitle>
          <DialogDescription>Crie, edite e exclua suas matérias e os assuntos de cada uma.</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Matérias */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80">Matérias</h3>

            <div className="space-y-2">
              <Input
                placeholder="Nova matéria"
                value={novaMateria}
                onChange={(e) => setNovaMateria(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateMateria()}
              />
              <div className="flex items-center gap-2 flex-wrap">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNovaCor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition ${novaCor === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
                <Button size="sm" onClick={handleCreateMateria} className="ml-auto bg-gold text-gold-foreground hover:opacity-90">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-auto rounded-md border border-border divide-y divide-border">
              {materias.length === 0 && (
                <p className="text-xs text-muted-foreground p-3">Nenhuma matéria cadastrada.</p>
              )}
              {materias.map((m: CronoMateria) => {
                const isSel = m.id === selectedMateriaId;
                const isEdit = editMatId === m.id;
                return (
                  <div key={m.id} className={`flex items-center gap-2 p-2 ${isSel ? "bg-white/5" : ""}`}>
                    {isEdit ? (
                      <>
                        <input
                          type="color"
                          value={editMatCor}
                          onChange={(e) => setEditMatCor(e.target.value)}
                          className="h-6 w-6 rounded border-0 bg-transparent"
                        />
                        <Input
                          value={editMatNome}
                          onChange={(e) => setEditMatNome(e.target.value)}
                          className="h-7 flex-1"
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                          await updateMateria.mutateAsync({ id: m.id, nome: editMatNome.trim(), cor: editMatCor });
                          setEditMatId(null);
                        }}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditMatId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          className="flex items-center gap-2 flex-1 text-left"
                          onClick={() => setSelectedMateriaId(m.id)}
                        >
                          <span className="h-3 w-3 rounded-full" style={{ background: m.cor }} />
                          <span className="text-sm">{m.nome}</span>
                        </button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                          setEditMatId(m.id);
                          setEditMatNome(m.nome);
                          setEditMatCor(m.cor);
                        }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300"
                          onClick={async () => {
                            if (!confirm(`Excluir "${m.nome}" e todos os seus assuntos?`)) return;
                            await deleteMateria.mutateAsync(m.id);
                            if (selectedMateriaId === m.id) setSelectedMateriaId("");
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assuntos */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80">
              Assuntos {selectedMateria ? `de ${selectedMateria.nome}` : ""}
            </h3>

            {!selectedMateriaId ? (
              <p className="text-xs text-muted-foreground">Selecione uma matéria à esquerda para gerenciar seus assuntos.</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Novo assunto"
                    value={novoAssunto}
                    onChange={(e) => setNovoAssunto(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateAssunto()}
                  />
                  <Button size="sm" onClick={handleCreateAssunto} className="bg-gold text-gold-foreground hover:opacity-90">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="max-h-80 overflow-auto rounded-md border border-border divide-y divide-border">
                  {filteredAssuntos.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3">Nenhum assunto.</p>
                  )}
                  {filteredAssuntos.map((a) => {
                    const isEdit = editAssId === a.id;
                    return (
                      <div key={a.id} className="flex items-center gap-2 p-2">
                        {isEdit ? (
                          <>
                            <Input value={editAssNome} onChange={(e) => setEditAssNome(e.target.value)} className="h-7 flex-1" />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                              await updateAssunto.mutateAsync({ id: a.id, nome: editAssNome.trim() });
                              setEditAssId(null);
                            }}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditAssId(null)}><X className="h-4 w-4" /></Button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm flex-1">{a.nome}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditAssId(a.id); setEditAssNome(a.nome); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300"
                              onClick={async () => {
                                if (!confirm(`Excluir "${a.nome}"?`)) return;
                                await deleteAssunto.mutateAsync(a.id);
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
