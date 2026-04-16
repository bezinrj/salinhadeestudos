import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ExternalLink, Plus, Trash2, GripVertical, BookmarkPlus, ChevronRight, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type TopicoMatriz = {
  id: number;
  cronograma_id: string;
  ordem: number;
  materia: string;
  assunto: string | null;
  fonte_legal: string | null;
  link_questoes: string | null;
  link_dod: string | null;
  horas_estimadas: number;
};

export type UserProgress = {
  topico_id: number;
  concluido: boolean;
  para_revisao: boolean;
};

const MATERIA_COLORS: Record<string, string> = {
  "Direito Constitucional": "bg-teal-500/15 text-teal-400 border-teal-500/30",
  "Direito Civil": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Processo Civil": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Direito Processual Civil": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Direito Penal": "bg-red-400/15 text-red-400 border-red-400/30",
  "Direito Processual Penal": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "Direito Administrativo": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "Direito Tributário": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Direito Empresarial": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Direitos Humanos": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "Legislação Penal Especial": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Criminologia": "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "Medicina Legal": "bg-lime-500/15 text-lime-400 border-lime-500/30",
};

function getMateriaBadgeClass(materia: string) {
  return MATERIA_COLORS[materia] || "bg-muted text-muted-foreground border-border";
}

interface Props {
  cronogramaId: string;
  topicos: TopicoMatriz[];
  progress: UserProgress[];
  isAdminOrMod: boolean;
  userId: string;
}

// Inline edit row for admin
function AdminEditableRow({
  topico, index, onSave, onDelete, dragHandleProps,
}: {
  topico: TopicoMatriz;
  index: number;
  onSave: (id: number, data: Partial<TopicoMatriz>) => void;
  onDelete: (id: number) => void;
  dragHandleProps?: any;
}) {
  const [editing, setEditing] = useState(false);
  const [materia, setMateria] = useState(topico.materia);
  const [assunto, setAssunto] = useState(topico.assunto || "");
  const [fonteLegal, setFonteLegal] = useState(topico.fonte_legal || "");
  const [linkQ, setLinkQ] = useState(topico.link_questoes || "");
  const [linkD, setLinkD] = useState(topico.link_dod || "");

  const save = () => {
    onSave(topico.id, { materia, assunto, fonte_legal: fonteLegal, link_questoes: linkQ, link_dod: linkD });
    setEditing(false);
  };

  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors">
      <td className="p-2 text-center text-xs text-muted-foreground w-12">
        {dragHandleProps && (
          <button {...dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground mr-1 inline-block">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        {index + 1}
      </td>
      <td className="p-2">
        {editing ? (
          <Input value={materia} onChange={e => setMateria(e.target.value)} className="h-7 text-xs" />
        ) : (
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${getMateriaBadgeClass(topico.materia)}`}>{topico.materia}</Badge>
        )}
      </td>
      <td className="p-2 text-xs text-foreground/90">
        {editing ? <Input value={assunto} onChange={e => setAssunto(e.target.value)} className="h-7 text-xs" /> : topico.assunto || "—"}
      </td>
      <td className="p-2 text-xs text-foreground/70">
        {editing ? <Input value={fonteLegal} onChange={e => setFonteLegal(e.target.value)} className="h-7 text-xs" /> : topico.fonte_legal || "—"}
      </td>
      <td className="p-2 text-center">
        {editing ? (
          <Input value={linkQ} onChange={e => setLinkQ(e.target.value)} className="h-7 text-xs" placeholder="URL" />
        ) : topico.link_questoes ? (
          <a href={topico.link_questoes} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
            <ExternalLink className="h-3.5 w-3.5 inline" />
          </a>
        ) : "—"}
      </td>
      <td className="p-2 text-center">
        {editing ? (
          <Input value={linkD} onChange={e => setLinkD(e.target.value)} className="h-7 text-xs" placeholder="URL" />
        ) : topico.link_dod ? (
          <a href={topico.link_dod} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
            <ExternalLink className="h-3.5 w-3.5 inline" />
          </a>
        ) : "—"}
      </td>
      <td className="p-2 text-center">
        {editing ? (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={save}>Salvar</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditing(false)}>✕</Button>
          </div>
        ) : (
          <div className="flex gap-1 justify-center">
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditing(true)}>Editar</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive" onClick={() => onDelete(topico.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

function SortableAdminRow(props: {
  topico: TopicoMatriz;
  index: number;
  onSave: (id: number, data: Partial<TopicoMatriz>) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.topico.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <tbody ref={setNodeRef} style={style}>
      <AdminEditableRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </tbody>
  );
}

// Student row
function StudentRow({
  topico, index, progress, onToggleConcluido, onToggleRevisao,
}: {
  topico: TopicoMatriz;
  index: number;
  progress: UserProgress | undefined;
  onToggleConcluido: (topicoId: number) => void;
  onToggleRevisao: (topicoId: number) => void;
}) {
  const done = progress?.concluido ?? false;
  const rev = progress?.para_revisao ?? false;

  return (
    <tr className={`border-b border-border/30 transition-colors ${done ? "bg-green-500/5" : "hover:bg-muted/20"}`}>
      <td className="p-2 text-center text-xs text-muted-foreground w-12">{index + 1}</td>
      <td className="p-2">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${getMateriaBadgeClass(topico.materia)}`}>{topico.materia}</Badge>
      </td>
      <td className={`p-2 text-xs ${done ? "line-through text-muted-foreground" : "text-foreground/90"}`}>{topico.assunto || "—"}</td>
      <td className="p-2 text-xs text-foreground/70">{topico.fonte_legal || "—"}</td>
      <td className="p-2 text-center">
        {topico.link_questoes ? (
          <a href={topico.link_questoes} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
            <ExternalLink className="h-3.5 w-3.5 inline" />
          </a>
        ) : "—"}
      </td>
      <td className="p-2 text-center">
        {topico.link_dod ? (
          <a href={topico.link_dod} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
            <ExternalLink className="h-3.5 w-3.5 inline" />
          </a>
        ) : "—"}
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2 justify-center">
          <Checkbox checked={done} onCheckedChange={() => onToggleConcluido(topico.id)} />
          <button
            onClick={() => onToggleRevisao(topico.id)}
            className={`p-1 rounded ${rev ? "text-amber-400" : "text-muted-foreground/50 hover:text-amber-400"}`}
            title={rev ? "Remover revisão" : "Marcar para revisão"}
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function MatrizTable({ cronogramaId, topicos, progress, isAdminOrMod, userId }: Props) {
  const queryClient = useQueryClient();
  const [cyclesOpen, setCyclesOpen] = useState(false);
  const [newRow, setNewRow] = useState(false);
  const [newMateria, setNewMateria] = useState("");
  const [newAssunto, setNewAssunto] = useState("");
  const [newFonteLegal, setNewFonteLegal] = useState("");
  const [newLinkQ, setNewLinkQ] = useState("");
  const [newLinkD, setNewLinkD] = useState("");
  const [newHoras, setNewHoras] = useState(3);

  const progressMap = new Map(progress.map(p => [p.topico_id, p]));
  const pending = topicos.filter(t => !progressMap.get(t.id)?.concluido);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const upsertProgress = useMutation({
    mutationFn: async ({ topicoId, concluido, para_revisao }: { topicoId: number; concluido?: boolean; para_revisao?: boolean }) => {
      const existing = progressMap.get(topicoId);
      if (existing) {
        const updates: any = {};
        if (concluido !== undefined) updates.concluido = concluido;
        if (para_revisao !== undefined) updates.para_revisao = para_revisao;
        const { error } = await supabase.from("user_topico_progress").update(updates).eq("user_id", userId).eq("topico_id", topicoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_topico_progress").insert({
          user_id: userId,
          topico_id: topicoId,
          concluido: concluido ?? false,
          para_revisao: para_revisao ?? false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-progress", cronogramaId] }),
  });

  const updateTopico = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TopicoMatriz> }) => {
      const { error } = await supabase.from("cronograma_matriz").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma-matriz", cronogramaId] });
      toast.success("Tópico atualizado!");
    },
  });

  const deleteTopico = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("cronograma_matriz").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma-matriz", cronogramaId] });
      toast.success("Tópico excluído!");
    },
  });

  const addTopico = useMutation({
    mutationFn: async () => {
      const maxOrdem = topicos.reduce((max, t) => Math.max(max, t.ordem), -1);
      const { error } = await supabase.from("cronograma_matriz").insert({
        cronograma_id: cronogramaId,
        ordem: maxOrdem + 1,
        materia: newMateria,
        assunto: newAssunto || null,
        fonte_legal: newFonteLegal || null,
        link_questoes: newLinkQ || null,
        link_dod: newLinkD || null,
        horas_estimadas: newHoras || 3,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma-matriz", cronogramaId] });
      setNewRow(false);
      setNewMateria("");
      setNewAssunto("");
      setNewFonteLegal("");
      setNewLinkQ("");
      setNewLinkD("");
      setNewHoras(3);
      toast.success("Tópico adicionado!");
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = topicos.findIndex(t => t.id === active.id);
    const newIdx = topicos.findIndex(t => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = [...topicos];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    await Promise.all(reordered.map((t, i) => supabase.from("cronograma_matriz").update({ ordem: i }).eq("id", t.id)));
    queryClient.invalidateQueries({ queryKey: ["cronograma-matriz", cronogramaId] });
  };

  return (
    <div className="flex gap-0">
      {/* Main table */}
      <div className="flex-1 min-w-0">
        <div className="overflow-x-auto rounded-xl border border-border/50 bg-card/50">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="p-2 text-[10px] font-semibold text-muted-foreground uppercase w-12 text-center">#</th>
                <th className="p-2 text-[10px] font-semibold text-muted-foreground uppercase">Matéria</th>
                <th className="p-2 text-[10px] font-semibold text-muted-foreground uppercase">Assunto</th>
                <th className="p-2 text-[10px] font-semibold text-muted-foreground uppercase">Fonte Legal</th>
                <th className="p-2 text-[10px] font-semibold text-muted-foreground uppercase text-center">Questões</th>
                <th className="p-2 text-[10px] font-semibold text-muted-foreground uppercase text-center">DOD</th>
                <th className="p-2 text-[10px] font-semibold text-muted-foreground uppercase text-center">Ações</th>
              </tr>
            </thead>
            {isAdminOrMod ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={topicos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {topicos.map((t, i) => (
                    <SortableAdminRow
                      key={t.id}
                      topico={t}
                      index={i}
                      onSave={(id, data) => updateTopico.mutate({ id, data })}
                      onDelete={(id) => { if (confirm("Excluir este tópico?")) deleteTopico.mutate(id); }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <tbody>
                {topicos.map((t, i) => (
                  <StudentRow
                    key={t.id}
                    topico={t}
                    index={i}
                    progress={progressMap.get(t.id)}
                    onToggleConcluido={(id) => {
                      const cur = progressMap.get(id);
                      upsertProgress.mutate({ topicoId: id, concluido: !(cur?.concluido) });
                    }}
                    onToggleRevisao={(id) => {
                      const cur = progressMap.get(id);
                      upsertProgress.mutate({ topicoId: id, para_revisao: !(cur?.para_revisao) });
                    }}
                  />
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Add row for admin */}
        {isAdminOrMod && (
          <div className="mt-3">
            {newRow ? (
              <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <Input placeholder="Matéria" value={newMateria} onChange={e => setNewMateria(e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Assunto" value={newAssunto} onChange={e => setNewAssunto(e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Fonte Legal" value={newFonteLegal} onChange={e => setNewFonteLegal(e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Link Questões (URL)" value={newLinkQ} onChange={e => setNewLinkQ(e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Link DOD (URL)" value={newLinkD} onChange={e => setNewLinkD(e.target.value)} className="h-8 text-xs" />
                  <Input type="number" placeholder="Horas" value={newHoras} onChange={e => setNewHoras(Number(e.target.value))} className="h-8 text-xs" min={1} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8" disabled={!newMateria.trim()} onClick={() => addTopico.mutate()}>Adicionar</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setNewRow(false)}>✕</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setNewRow(true)}>
                <Plus className="h-3.5 w-3.5" /> Novo tópico
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Cycles panel */}
      <div
        className="border-l border-border/50 bg-card/30 overflow-hidden flex-shrink-0"
        style={{ width: cyclesOpen ? 280 : 40, transition: "width 0.3s ease" }}
      >
        <button
          className="w-full h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={() => setCyclesOpen(!cyclesOpen)}
        >
          {cyclesOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        {!cyclesOpen && (
          <div className="text-center">
            <span className="text-xs font-bold text-primary">{pending.length}</span>
            <p className="text-[8px] text-muted-foreground leading-tight">pend.</p>
          </div>
        )}
        {cyclesOpen && (
          <div className="px-3 pb-3 space-y-1 overflow-y-auto max-h-[60vh]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Ciclos restantes ({pending.length})</p>
            {pending.map(t => (
              <div key={t.id} className="p-2 rounded-lg bg-muted/30 border border-border/30">
                <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getMateriaBadgeClass(t.materia)}`}>{t.materia}</Badge>
                <p className="text-[11px] text-foreground/80 mt-0.5">{t.assunto || "—"}</p>
                <p className="text-[9px] text-muted-foreground">{t.horas_estimadas}h estimadas</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
