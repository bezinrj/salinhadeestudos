import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Check, X, Link2, Link2Off } from "lucide-react";
import { useCronoMaterias, CronoMateria } from "@/hooks/useCrono";
import { useCronoCatalogo } from "@/hooks/useCronoCanon";
import { toast } from "sonner";

const PALETTE = [
  "#EAB308", "#EF4444", "#3B82F6", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1",
];

const NONE = "__none__";

function norm(t: string) {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/^(direito|dir)\s+(de\s+|do\s+|da\s+|dos\s+|das\s+)?/, "")
    .replace(/\s+/g, " ")
    .trim();
}

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
  const { materiasCanon, assuntosCanon } = useCronoCatalogo();

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

  const canonMateriaMap = useMemo(
    () => new Map(materiasCanon.map(m => [m.id, m])),
    [materiasCanon]
  );
  const canonAssuntoMap = useMemo(
    () => new Map(assuntosCanon.map(a => [a.id, a])),
    [assuntosCanon]
  );

  const assuntosCanonDaMateria = useMemo(() => {
    const cid = selectedMateria?.materia_canon_id;
    return cid ? assuntosCanon.filter(a => a.materia_canon_id === cid) : [];
  }, [assuntosCanon, selectedMateria]);

  const matchMateriaCanon = (nome: string) =>
    materiasCanon.find(c => norm(c.nome) === norm(nome))?.id || null;
  const matchAssuntoCanon = (nome: string) =>
    assuntosCanonDaMateria.find(c => norm(c.nome) === norm(nome))?.id || null;

  const handleCreateMateria = async () => {
    const nome = novaMateria.trim();
    if (!nome) return;
    try {
      const m = await createMateria.mutateAsync({
        nome,
        cor: novaCor,
        materia_canon_id: matchMateriaCanon(nome),
      });
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
      await createAssunto.mutateAsync({
        materia_id: selectedMateriaId,
        nome,
        assunto_canon_id: matchAssuntoCanon(nome),
      });
      setNovoAssunto("");
    } catch {
      toast.error("Erro ao criar assunto.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle>Gerenciar matérias e assuntos</DialogTitle>
          <DialogDescription>
            Use os nomes sugeridos do catálogo oficial para que suas horas entrem na comparação com os outros alunos.
          </DialogDescription>
        </DialogHeader>

        <datalist id="catalogo-materias">
          {materiasCanon.map(c => <option key={c.id} value={c.nome} />)}
        </datalist>
        <datalist id="catalogo-assuntos">
          {assuntosCanonDaMateria.map(c => <option key={c.id} value={c.nome} />)}
        </datalist>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Matérias */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">Matérias</h3>

            <div className="space-y-2">
              <Input
                placeholder="Nova matéria (ex: Direito Penal)"
                list="catalogo-materias"
                value={novaMateria}
                onChange={(e) => setNovaMateria(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateMateria()}
              />
              <div className="flex items-center gap-2 flex-wrap">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNovaCor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition ${novaCor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
                <Button size="sm" onClick={handleCreateMateria} className="ml-auto bg-gold text-gold-foreground hover:opacity-90">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-auto rounded-md border border-border divide-y divide-border">
              {materias.length === 0 && (
                <p className="text-xs text-muted-foreground p-3">Nenhuma matéria cadastrada.</p>
              )}
              {materias.map((m: CronoMateria) => {
                const isSel = m.id === selectedMateriaId;
                const isEdit = editMatId === m.id;
                const canon = m.materia_canon_id ? canonMateriaMap.get(m.materia_canon_id) : null;
                return (
                  <div key={m.id} className={`p-2 space-y-1.5 ${isSel ? "bg-foreground/5" : ""}`}>
                    <div className="flex items-center gap-2">
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
                            list="catalogo-materias"
                            onChange={(e) => setEditMatNome(e.target.value)}
                            className="h-7 flex-1"
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                            const nome = editMatNome.trim();
                            await updateMateria.mutateAsync({
                              id: m.id, nome, cor: editMatCor,
                              materia_canon_id: matchMateriaCanon(nome) ?? m.materia_canon_id ?? null,
                            });
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
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
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

                    {!isEdit && (
                      <div className="flex items-center gap-2 pl-5">
                        {canon ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                            <Link2 className="h-3 w-3" /> {canon.nome}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                            <Link2Off className="h-3 w-3" /> sem comparação
                          </span>
                        )}
                        <Select
                          value={m.materia_canon_id || NONE}
                          onValueChange={(v) =>
                            updateMateria.mutate({ id: m.id, materia_canon_id: v === NONE ? null : v })
                          }
                        >
                          <SelectTrigger className="h-6 w-40 text-[10px]">
                            <SelectValue placeholder="Vincular" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value={NONE}>Não vincular</SelectItem>
                            {materiasCanon.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assuntos */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">
              Assuntos {selectedMateria ? `de ${selectedMateria.nome}` : ""}
            </h3>

            {!selectedMateriaId ? (
              <p className="text-xs text-muted-foreground">Selecione uma matéria à esquerda para gerenciar seus assuntos.</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Novo assunto"
                    list="catalogo-assuntos"
                    value={novoAssunto}
                    onChange={(e) => setNovoAssunto(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateAssunto()}
                  />
                  <Button size="sm" onClick={handleCreateAssunto} className="bg-gold text-gold-foreground hover:opacity-90">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {!selectedMateria?.materia_canon_id && (
                  <p className="text-[10px] text-amber-400">
                    Vincule a matéria ao catálogo oficial para que os assuntos também entrem na comparação.
                  </p>
                )}

                <div className="max-h-96 overflow-auto rounded-md border border-border divide-y divide-border">
                  {filteredAssuntos.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3">Nenhum assunto.</p>
                  )}
                  {filteredAssuntos.map((a) => {
                    const isEdit = editAssId === a.id;
                    const canon = a.assunto_canon_id ? canonAssuntoMap.get(a.assunto_canon_id) : null;
                    return (
                      <div key={a.id} className="p-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          {isEdit ? (
                            <>
                              <Input value={editAssNome} list="catalogo-assuntos"
                                onChange={(e) => setEditAssNome(e.target.value)} className="h-7 flex-1" />
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                                const nome = editAssNome.trim();
                                await updateAssunto.mutateAsync({
                                  id: a.id, nome,
                                  assunto_canon_id: matchAssuntoCanon(nome) ?? a.assunto_canon_id ?? null,
                                });
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
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                                onClick={async () => {
                                  if (!confirm(`Excluir "${a.nome}"?`)) return;
                                  await deleteAssunto.mutateAsync(a.id);
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>

                        {!isEdit && assuntosCanonDaMateria.length > 0 && (
                          <div className="flex items-center gap-2">
                            {canon ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                                <Link2 className="h-3 w-3" /> {canon.nome}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                                <Link2Off className="h-3 w-3" /> sem comparação
                              </span>
                            )}
                            <Select
                              value={a.assunto_canon_id || NONE}
                              onValueChange={(v) =>
                                updateAssunto.mutate({ id: a.id, assunto_canon_id: v === NONE ? null : v })
                              }
                            >
                              <SelectTrigger className="h-6 w-40 text-[10px]">
                                <SelectValue placeholder="Vincular" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                <SelectItem value={NONE}>Não vincular</SelectItem>
                                {assuntosCanonDaMateria.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
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
