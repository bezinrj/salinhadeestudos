import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Check, X, BookMarked } from "lucide-react";
import { toast } from "sonner";
import { useJurisMaterias, useJurisAssuntos, useInvalidateTaxonomy } from "@/hooks/useJurisTaxonomy";
import type { JurisMateria, JurisAssunto } from "@/types/juris";

export function JurisTaxonomyManager() {
  const { data: materias = [] } = useJurisMaterias();
  const { data: assuntos = [] } = useJurisAssuntos();
  const invalidate = useInvalidateTaxonomy();

  const [novaMateria, setNovaMateria] = useState("");
  const [materiaFiltro, setMateriaFiltro] = useState<string>("");
  const [novoAssunto, setNovoAssunto] = useState("");
  const [editing, setEditing] = useState<{ table: "m" | "a"; id: string; nome: string } | null>(null);

  async function addMateria() {
    const nome = novaMateria.trim();
    if (!nome) return;
    const { error } = await supabase.from("juris_materias" as any).insert({ nome });
    if (error) toast.error(error.message);
    else { toast.success("Matéria criada"); setNovaMateria(""); invalidate(); }
  }
  async function addAssunto() {
    const nome = novoAssunto.trim();
    if (!nome || !materiaFiltro) { toast.error("Escolha uma matéria"); return; }
    const { error } = await supabase.from("juris_assuntos" as any).insert({ nome, materia_id: materiaFiltro });
    if (error) toast.error(error.message);
    else { toast.success("Assunto criado"); setNovoAssunto(""); invalidate(); }
  }
  async function remove(table: "juris_materias" | "juris_assuntos", id: string) {
    if (!confirm("Excluir? Os julgados que usam esse valor manterão o texto, mas o item sai da lista.")) return;
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Excluído"); invalidate(); }
  }
  async function saveEdit() {
    if (!editing) return;
    const table = editing.table === "m" ? "juris_materias" : "juris_assuntos";
    const { error } = await supabase.from(table as any).update({ nome: editing.nome.trim() }).eq("id", editing.id);
    if (error) toast.error(error.message);
    else { toast.success("Atualizado"); setEditing(null); invalidate(); }
  }

  const assuntosDaMateria = materiaFiltro
    ? assuntos.filter((a) => a.materia_id === materiaFiltro)
    : [];

  const renderItem = (table: "m" | "a", item: JurisMateria | JurisAssunto) => {
    const isEditing = editing?.table === table && editing.id === item.id;
    return (
      <div key={item.id} className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
        {isEditing ? (
          <>
            <Input value={editing!.nome} onChange={(e) => setEditing({ ...editing!, nome: e.target.value })} className="h-8" />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-4 w-4 text-primary" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm">{item.nome}</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing({ table, id: item.id, nome: item.nome })}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(table === "m" ? "juris_materias" : "juris_assuntos", item.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <BookMarked className="h-4 w-4" /> Gerenciar Matérias e Assuntos
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Matérias */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Matérias</div>
            <div className="flex gap-2">
              <Input value={novaMateria} onChange={(e) => setNovaMateria(e.target.value)} placeholder="Nova matéria..." className="h-9" />
              <Button onClick={addMateria} size="sm"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {materias.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma matéria cadastrada.</p>}
              {materias.map((m) => renderItem("m", m))}
            </div>
          </div>

          {/* Assuntos */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assuntos</div>
            <Select value={materiaFiltro} onValueChange={setMateriaFiltro}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione a matéria..." /></SelectTrigger>
              <SelectContent>
                {materias.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input value={novoAssunto} onChange={(e) => setNovoAssunto(e.target.value)} placeholder="Novo assunto..." className="h-9" disabled={!materiaFiltro} />
              <Button onClick={addAssunto} size="sm" disabled={!materiaFiltro}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {!materiaFiltro && <p className="text-xs text-muted-foreground">Selecione uma matéria para ver seus assuntos.</p>}
              {materiaFiltro && assuntosDaMateria.length === 0 && <p className="text-xs text-muted-foreground">Nenhum assunto nesta matéria.</p>}
              {assuntosDaMateria.map((a) => renderItem("a", a))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
