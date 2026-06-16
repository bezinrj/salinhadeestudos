import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Pencil, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { CARGO_LABEL, type VmCargo, type VmLei, type VmArtigo, type VmIncidencia } from "@/types/vademecum";
import { toast } from "sonner";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const sb = supabase as any;

export default function VademecumAdmin() {
  const { isAdmin, loading: a1 } = useIsAdmin();
  const { isModerator, loading: a2 } = useIsModerator();
  if (a1 || a2) return <p className="p-8 text-sm text-muted-foreground">Carregando...</p>;
  if (!isAdmin && !isModerator) return <Navigate to="/vademecum" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link to="/vademecum"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">Gerenciar Vade Mecum</h1>
      </div>
      <Tabs defaultValue="leis">
        <TabsList>
          <TabsTrigger value="leis">Leis</TabsTrigger>
          <TabsTrigger value="artigos">Artigos & Incidências</TabsTrigger>
        </TabsList>
        <TabsContent value="leis" className="mt-4"><LeisTab /></TabsContent>
        <TabsContent value="artigos" className="mt-4"><ArtigosTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Leis Tab ============
function LeisTab() {
  const qc = useQueryClient();
  const { data: leis = [] } = useQuery({
    queryKey: ["admin-vm-leis"],
    queryFn: async () => {
      const { data, error } = await sb.from("vm_leis").select("*").order("categoria").order("ordem");
      if (error) throw error;
      return data as VmLei[];
    },
  });

  const [form, setForm] = useState<Partial<VmLei>>({
    nome: "", sigla: "", descricao: "", categoria: "Códigos", ordem: 0, publicada: true,
  });
  const [editId, setEditId] = useState<string | null>(null);

  const save = async () => {
    if (!form.nome || !form.sigla) return toast.error("Nome e sigla obrigatórios");
    try {
      if (editId) {
        const { error } = await sb.from("vm_leis").update(form).eq("id", editId);
        if (error) throw error;
        toast.success("Lei atualizada");
      } else {
        const { error } = await sb.from("vm_leis").insert(form);
        if (error) throw error;
        toast.success("Lei criada");
      }
      setForm({ nome: "", sigla: "", descricao: "", categoria: "Códigos", ordem: 0, publicada: true });
      setEditId(null);
      qc.invalidateQueries({ queryKey: ["admin-vm-leis"] });
      qc.invalidateQueries({ queryKey: ["vm-leis"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta lei e todos os artigos relacionados?")) return;
    const { error } = await sb.from("vm_leis").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Lei excluída");
    qc.invalidateQueries({ queryKey: ["admin-vm-leis"] });
    qc.invalidateQueries({ queryKey: ["vm-leis"] });
  };

  const edit = (l: VmLei) => {
    setEditId(l.id);
    setForm(l);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr,360px]">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">{editId ? "Editar lei" : "Nova lei"}</h3>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Sigla</Label><Input value={form.sigla ?? ""} onChange={(e) => setForm({ ...form, sigla: e.target.value })} /></div>
            <div><Label>Categoria</Label><Input value={form.categoria ?? ""} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea rows={2} value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Ordem</Label><Input type="number" value={form.ordem ?? 0} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} /></div>
            <div className="flex items-end gap-2"><Label className="mb-2 flex items-center gap-2"><input type="checkbox" checked={!!form.publicada} onChange={(e) => setForm({ ...form, publicada: e.target.checked })} /> Publicada</Label></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save}><Save className="mr-1 h-4 w-4" /> Salvar</Button>
            {editId && <Button variant="ghost" onClick={() => { setEditId(null); setForm({ nome: "", sigla: "", descricao: "", categoria: "Códigos", ordem: 0, publicada: true }); }}>Cancelar</Button>}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <h3 className="mb-2 px-1 text-sm font-semibold">Leis ({leis.length})</h3>
        <ul className="space-y-1 text-sm">
          {leis.map((l) => (
            <li key={l.id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-secondary">
              <div className="min-w-0"><div className="truncate font-medium">{l.sigla}</div><div className="truncate text-xs text-muted-foreground">{l.nome}</div></div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => edit(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(l.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============ Artigos Tab ============
function ArtigosTab() {
  const qc = useQueryClient();
  const { data: leis = [] } = useQuery({
    queryKey: ["admin-vm-leis"],
    queryFn: async () => {
      const { data, error } = await sb.from("vm_leis").select("id,nome,sigla").order("categoria").order("ordem");
      if (error) throw error;
      return data as VmLei[];
    },
  });
  const [leiId, setLeiId] = useState<string>("");
  useEffect(() => { if (!leiId && leis.length) setLeiId(leis[0].id); }, [leis, leiId]);

  const { data: artigos = [], refetch } = useQuery({
    queryKey: ["admin-vm-artigos", leiId],
    enabled: !!leiId,
    queryFn: async () => {
      const { data, error } = await sb.from("vm_artigos").select("*, vm_incidencias(*)").eq("lei_id", leiId).order("ordem");
      if (error) throw error;
      return data as (VmArtigo & { vm_incidencias: VmIncidencia[] })[];
    },
  });

  // Estado local para reordenação otimista via drag-and-drop
  const [ordered, setOrdered] = useState<(VmArtigo & { vm_incidencias: VmIncidencia[] })[]>([]);
  useEffect(() => { setOrdered(artigos); }, [artigos]);

  // Formulário exclusivo para criação de novos itens
  const [form, setForm] = useState<Partial<VmArtigo>>({ numero: "", rotulo: "", texto: "", ordem: 0 });
  const [modoCriacao, setModoCriacao] = useState<"artigo" | "titulo">("artigo");

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((a) => a.id === active.id);
    const newIndex = ordered.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(reordered);
    // Persiste nova ordem no banco em lote
    await Promise.all(reordered.map((a, i) => sb.from("vm_artigos").update({ ordem: i + 1 }).eq("id", a.id)));
    qc.invalidateQueries({ queryKey: ["vm-lei"] });
  };

  const save = async () => {
    if (!leiId) return toast.error("Selecione a lei.");
    if (!form.numero) return toast.error(modoCriacao === "artigo" ? "O número do artigo é obrigatório" : "O identificador é obrigatório");
    
    try {
      const payload = {
        ...form,
        lei_id: leiId,
        texto: form.texto || "", // Texto pode ser vazio (útil para títulos)
      };
      const { error } = await sb.from("vm_artigos").insert(payload);
      if (error) throw error;
      toast.success("Artigo criado");
      setForm({ numero: "", rotulo: "", texto: "", ordem: 0 });
      refetch();
      qc.invalidateQueries({ queryKey: ["vm-lei"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir artigo?")) return;
    const { error } = await sb.from("vm_artigos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    refetch();
    qc.invalidateQueries({ queryKey: ["vm-lei"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Lei:</Label>
        <Select value={leiId} onValueChange={setLeiId}>
          <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {leis.map((l) => <SelectItem key={l.id} value={l.id}>{l.sigla} — {l.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Formulário exclusivo para criação */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Novo Item</h3>
          <div className="flex gap-2">
            <Button size="sm" variant={modoCriacao === "artigo" ? "default" : "outline"} onClick={() => setModoCriacao("artigo")}>Artigo</Button>
            <Button size="sm" variant={modoCriacao === "titulo" ? "default" : "outline"} onClick={() => setModoCriacao("titulo")}>Título/Subtítulo</Button>
          </div>
        </div>
        <div className="space-y-3">
          {modoCriacao === "artigo" ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                <div><Label>Número do Artigo</Label><Input value={form.numero ?? ""} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Ex: 121" /></div>
                <div className="col-span-2"><Label>Rótulo (opcional)</Label><Input value={form.rotulo ?? ""} onChange={(e) => setForm({ ...form, rotulo: e.target.value })} placeholder="Ex: Art. 121" /></div>
                <div><Label>Ordem</Label><Input type="number" value={form.ordem ?? 0} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Texto</Label><Textarea rows={5} value={form.texto ?? ""} onChange={(e) => setForm({ ...form, texto: e.target.value })} placeholder="Texto do artigo..." /></div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                <div><Label>Identificador</Label><Input value={form.numero ?? ""} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Ex: TITULO I" /></div>
                <div className="col-span-2"><Label>Rótulo de Exibição</Label><Input value={form.rotulo ?? ""} onChange={(e) => setForm({ ...form, rotulo: e.target.value })} placeholder="Ex: TÍTULO I" /></div>
                <div><Label>Ordem</Label><Input type="number" value={form.ordem ?? 0} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Descrição (opcional)</Label><Input value={form.texto ?? ""} onChange={(e) => setForm({ ...form, texto: e.target.value })} placeholder="Ex: DOS DIREITOS FUNDAMENTAIS" /></div>
            </>
          )}
          <div className="flex gap-2">
            <Button onClick={save}><Save className="mr-1 h-4 w-4" /> Salvar</Button>
          </div>
        </div>
      </div>

      {/* Lista de artigos com drag-and-drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ordered.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {ordered.map((a) => (
              <ArtigoRow
                key={a.id}
                artigo={a}
                onRemove={() => remove(a.id)}
                onSaved={() => { refetch(); qc.invalidateQueries({ queryKey: ["vm-lei"] }); }}
                onIncidenciasChanged={() => { refetch(); qc.invalidateQueries({ queryKey: ["vm-lei"] }); }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function ArtigoRow({ artigo, onRemove, onSaved, onIncidenciasChanged }: {
  artigo: VmArtigo & { vm_incidencias: VmIncidencia[] };
  onRemove: () => void;
  onSaved: () => void;
  onIncidenciasChanged: () => void;
}) {
  // Drag and drop
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: artigo.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  // Edição inline
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    numero: artigo.numero,
    rotulo: artigo.rotulo ?? "",
    texto: artigo.texto,
    ordem: artigo.ordem,
  });

  // Incidências
  const [open, setOpen] = useState(false);
  const [cargo, setCargo] = useState<VmCargo>("magistratura");
  const [qtd, setQtd] = useState(1);
  const incs = artigo.vm_incidencias ?? [];

  const saveEdit = async () => {
    const payload = {
      ...editForm,
      texto: editForm.texto || "", // Garante que texto pode ser vazio
    };
    const { error } = await sb.from("vm_artigos").update(payload).eq("id", artigo.id);
    if (error) return toast.error(error.message);
    toast.success("Artigo salvo");
    setEditing(false);
    onSaved();
  };

  const cancelEdit = () => {
    setEditForm({ numero: artigo.numero, rotulo: artigo.rotulo ?? "", texto: artigo.texto, ordem: artigo.ordem });
    setEditing(false);
  };

  const addInc = async () => {
    const existing = incs.find((i) => i.cargo === cargo);
    if (existing) {
      const { error } = await sb.from("vm_incidencias").update({ quantidade: qtd }).eq("id", existing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from("vm_incidencias").insert({ artigo_id: artigo.id, cargo, quantidade: qtd });
      if (error) return toast.error(error.message);
    }
    toast.success("Incidência salva");
    onIncidenciasChanged();
  };

  const delInc = async (id: string) => {
    const { error } = await sb.from("vm_incidencias").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onIncidenciasChanged();
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-border bg-card p-3">
      {editing ? (
        // ── Modo de edição inline ──
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Editando: <span className="text-foreground">{artigo.rotulo || `Art. ${artigo.numero}`}</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div><Label>Número</Label><Input value={editForm.numero} onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })} /></div>
            <div className="col-span-2"><Label>Rótulo (opcional)</Label><Input value={editForm.rotulo} onChange={(e) => setEditForm({ ...editForm, rotulo: e.target.value })} /></div>
            <div><Label>Ordem</Label><Input type="number" value={editForm.ordem} onChange={(e) => setEditForm({ ...editForm, ordem: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Texto</Label><Textarea rows={6} value={editForm.texto} onChange={(e) => setEditForm({ ...editForm, texto: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit}><Save className="mr-1 h-3.5 w-3.5" /> Salvar</Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancelar</Button>
          </div>
        </div>
      ) : (
        // ── Modo de visualização ──
        <div className="flex items-start gap-2">
          {/* Alça de arrastar */}
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
            title="Arrastar para reordenar"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{artigo.rotulo || `Art. ${artigo.numero}`}</div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{artigo.texto}</p>
            <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
              {incs.map((i) => (
                <span key={i.id} className="flex items-center gap-1 rounded border border-border bg-secondary/40 px-1.5 py-0.5">
                  {CARGO_LABEL[i.cargo]}: {i.quantidade}×
                  <button onClick={() => delInc(i.id)} className="text-destructive hover:underline">×</button>
                </span>
              ))}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Incidência
          </Button>
          <Button
            size="icon" variant="ghost"
            title="Editar artigo"
            onClick={() => { setEditing(true); setEditForm({ numero: artigo.numero, rotulo: artigo.rotulo ?? "", texto: artigo.texto, ordem: artigo.ordem }); }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}

      {/* Painel de incidências (só no modo visualização) */}
      {!editing && open && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded border border-border bg-background p-2">
          <div><Label className="text-xs">Cargo</Label>
            <Select value={cargo} onValueChange={(v) => setCargo(v as VmCargo)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["magistratura", "defensoria", "mp", "delegado"] as VmCargo[]).map((c) => (
                  <SelectItem key={c} value={c}>{CARGO_LABEL[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Quantidade</Label><Input type="number" className="w-24" value={qtd} onChange={(e) => setQtd(Number(e.target.value))} /></div>
          <Button size="sm" onClick={addInc}>Salvar</Button>
        </div>
      )}
    </div>
  );
}
