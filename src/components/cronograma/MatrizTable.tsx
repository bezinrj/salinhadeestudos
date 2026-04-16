import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ExternalLink, Plus, Trash2, GripVertical, BookmarkPlus, Pencil,
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
  cor: string | null;
};

export type UserProgress = {
  topico_id: number;
  concluido: boolean;
  para_revisao: boolean;
};

const COLOR_PALETTE = [
  "#1D9E75", "#378ADD", "#D85A30", "#9B59B6", "#E67E22",
  "#2ECC71", "#E74C3C", "#1ABC9C", "#3498DB", "#F39C12",
  "#8E44AD", "#16A085",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getMateriaColor(topico: { materia: string; cor?: string | null }): string {
  if (topico.cor) return topico.cor;
  return COLOR_PALETTE[hashString(topico.materia) % COLOR_PALETTE.length];
}

interface Props {
  cronogramaId: string;
  topicos: TopicoMatriz[];
  progress: UserProgress[];
  isAdminOrMod: boolean;
  userId: string;
}

// Admin editable row
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

  const color = getMateriaColor(topico);

  const save = () => {
    onSave(topico.id, { materia, assunto, fonte_legal: fonteLegal, link_questoes: linkQ, link_dod: linkD });
    setEditing(false);
  };

  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors">
      <td className="p-2 text-center text-xs text-muted-foreground w-12">
        <div className="flex items-center gap-1 justify-center">
          {dragHandleProps && (
            <button {...dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          {index + 1}
        </div>
      </td>
      <td className="p-2">
        {editing ? (
          <Input value={materia} onChange={e => setMateria(e.target.value)} className="h-7 text-xs" />
        ) : (
          <span
            className="inline-block text-[10px] font-medium text-white rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: color }}
          >
            {topico.materia}
          </span>
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
          <div className="flex gap-1 justify-center">
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={save}>Salvar</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditing(false)}>✕</Button>
          </div>
        ) : (
          <div className="flex gap-1 justify-center">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditing(true)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => onDelete(topico.id)}>
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

// Student row with checkbox
function StudentRow({
  topico, index, progress, onToggleConcluido,
}: {
  topico: TopicoMatriz;
  index: number;
  progress: UserProgress | undefined;
  onToggleConcluido: (topicoId: number) => void;
}) {
  const done = progress?.concluido ?? false;
  const color = getMateriaColor(topico);

  return (
    <tr
      className="border-b border-border/30"
      style={{
        backgroundColor: done ? "rgba(0,0,0,0.04)" : undefined,
        transition: "all 0.25s ease",
      }}
    >
      <td className="p-2 text-center w-12">
        <div className="flex items-center gap-1.5 justify-center">
          <Checkbox
            checked={done}
            onCheckedChange={() => onToggleConcluido(topico.id)}
            className={`h-4 w-4 rounded ${done ? "border-[#1D9E75] bg-[#1D9E75] text-white data-[state=checked]:bg-[#1D9E75] data-[state=checked]:border-[#1D9E75]" : ""}`}
          />
          <span style={{ fontSize: 12, color: done ? "#9ca3af" : undefined, transition: "all 0.25s ease" }} className={done ? "" : "text-muted-foreground"}>{index + 1}</span>
        </div>
      </td>
      <td className="p-2">
        <span
          className="inline-block text-[10px] font-medium rounded-full px-2.5 py-0.5"
          style={{
            backgroundColor: done ? "#e5e7eb" : color,
            color: done ? "#9ca3af" : "#ffffff",
            transition: "all 0.25s ease",
          }}
        >
          {topico.materia}
        </span>
      </td>
      <td className="p-2 text-xs" style={{ textDecoration: done ? "line-through" : "none", color: done ? "#9ca3af" : undefined, transition: "all 0.25s ease" }}>
        {topico.assunto || "—"}
      </td>
      <td className="p-2 text-xs" style={{ color: done ? "#9ca3af" : undefined, transition: "all 0.25s ease" }}>
        {topico.fonte_legal || "—"}
      </td>
      <td className="p-2 text-center" style={{ transition: "all 0.25s ease" }}>
        {topico.link_questoes ? (
          <a href={topico.link_questoes} target="_blank" rel="noopener noreferrer" style={{ color: done ? "#9ca3af" : undefined, transition: "all 0.25s ease" }} className={done ? "" : "text-primary hover:text-primary/80"}>
            <ExternalLink className="h-3.5 w-3.5 inline" />
          </a>
        ) : <span style={{ color: done ? "#9ca3af" : undefined }}>—</span>}
      </td>
      <td className="p-2 text-center" style={{ transition: "all 0.25s ease" }}>
        {topico.link_dod ? (
          <a href={topico.link_dod} target="_blank" rel="noopener noreferrer" style={{ color: done ? "#9ca3af" : undefined, transition: "all 0.25s ease" }} className={done ? "" : "text-primary hover:text-primary/80"}>
            <ExternalLink className="h-3.5 w-3.5 inline" />
          </a>
        ) : <span style={{ color: done ? "#9ca3af" : undefined }}>—</span>}
      </td>
      <td className="p-2 text-center" style={{ color: done ? "#9ca3af" : undefined, transition: "all 0.25s ease" }}>
        —
      </td>
    </tr>
  );
}

export default function MatrizTable({ cronogramaId, topicos, progress, isAdminOrMod, userId }: Props) {
  const queryClient = useQueryClient();
  const [newRow, setNewRow] = useState(false);
  const [newMateria, setNewMateria] = useState("");
  const [newAssunto, setNewAssunto] = useState("");
  const [newFonteLegal, setNewFonteLegal] = useState("");
  const [newLinkQ, setNewLinkQ] = useState("");
  const [newLinkD, setNewLinkD] = useState("");
  const [newHoras, setNewHoras] = useState(3);

  const progressMap = new Map(progress.map(p => [p.topico_id, p]));

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

      // Bidirectional sync: update calendar events when marking completed
      if (concluido !== undefined) {
        if (concluido) {
          // Mark all calendar events for this topic as completed
          await supabase
            .from("user_calendar_events")
            .update({ concluido: true })
            .eq("user_id", userId)
            .eq("topico_id", topicoId);
        } else {
          // Only unmark non-revision events
          await supabase
            .from("user_calendar_events")
            .update({ concluido: false })
            .eq("user_id", userId)
            .eq("topico_id", topicoId)
            .eq("is_revisao", false);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress", cronogramaId] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events", cronogramaId] });
    },
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
      const cor = COLOR_PALETTE[hashString(newMateria) % COLOR_PALETTE.length];
      const { error } = await supabase.from("cronograma_matriz").insert({
        cronograma_id: cronogramaId,
        ordem: maxOrdem + 1,
        materia: newMateria,
        assunto: newAssunto || null,
        fonte_legal: newFonteLegal || null,
        link_questoes: newLinkQ || null,
        link_dod: newLinkD || null,
        horas_estimadas: newHoras || 3,
        cor,
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
    onError: (err: any) => {
      toast.error("Erro ao adicionar tópico: " + (err?.message || "tente novamente"));
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
    <div>
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
                <Input type="number" placeholder="Horas estimadas" value={newHoras} onChange={e => setNewHoras(Number(e.target.value))} className="h-8 text-xs" min={1} />
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
  );
}
