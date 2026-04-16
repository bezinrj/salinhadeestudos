import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ExternalLink, Plus, Trash2, GripVertical, Pencil, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type FonteItem = {
  sigla: string;
  descricao: string;
  link_questoes: string;
  link_dod: string;
};

export type FonteProgress = {
  topico_id: number;
  sigla: string;
  concluido: boolean;
};

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
  fontes?: FonteItem[] | null;
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

function parseFontes(topico: TopicoMatriz): FonteItem[] {
  if (topico.fontes && Array.isArray(topico.fontes) && topico.fontes.length > 0) {
    return topico.fontes;
  }
  if (topico.fonte_legal || topico.link_questoes || topico.link_dod) {
    return [{
      sigla: "",
      descricao: topico.fonte_legal || "",
      link_questoes: topico.link_questoes || "",
      link_dod: topico.link_dod || "",
    }];
  }
  return [];
}

// ─── Fontes editor (admin edit/add) ───
function FontesEditor({ fontes, onChange }: { fontes: FonteItem[]; onChange: (f: FonteItem[]) => void }) {
  const update = (idx: number, field: keyof FonteItem, value: string) => {
    const copy = [...fontes];
    copy[idx] = { ...copy[idx], [field]: value };
    onChange(copy);
  };
  const add = () => onChange([...fontes, { sigla: "", descricao: "", link_questoes: "", link_dod: "" }]);
  const remove = (idx: number) => onChange(fontes.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {fontes.map((f, i) => (
        <div key={i} className="flex flex-col gap-1.5 p-2 rounded-md border border-border/40 bg-muted/10 relative">
          {fontes.length > 1 && (
            <button type="button" onClick={() => remove(i)} className="absolute top-1 right-1 text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            <Input placeholder="Sigla (ex: CF)" value={f.sigla} onChange={e => update(i, "sigla", e.target.value)} className="h-7 text-xs" />
            <Input placeholder="Descrição (ex: Art.1 ao Art.4)" value={f.descricao} onChange={e => update(i, "descricao", e.target.value)} className="h-7 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Input placeholder="Link Questões (URL)" value={f.link_questoes} onChange={e => update(i, "link_questoes", e.target.value)} className="h-7 text-xs" />
            <Input placeholder="Link DOD (URL)" value={f.link_dod} onChange={e => update(i, "link_dod", e.target.value)} className="h-7 text-xs" />
          </div>
        </div>
      ))}
      <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={add}>
        <Plus className="h-3 w-3" /> Adicionar fonte
      </Button>
    </div>
  );
}

// ─── Read-only fontes display with individual checkboxes ───
function FontesDisplayWithCheckbox({
  fontes, done, topicoId, fonteProgressMap, onToggleFonte,
}: {
  fontes: FonteItem[];
  done: boolean;
  topicoId: number;
  fonteProgressMap: Map<string, boolean>;
  onToggleFonte: (topicoId: number, sigla: string, current: boolean) => void;
}) {
  if (fontes.length === 0) return <span style={{ color: done ? "#9ca3af" : undefined }}>—</span>;
  return (
    <div>
      {fontes.map((f, i) => {
        const key = `${topicoId}:${f.sigla}`;
        const checked = fonteProgressMap.get(key) ?? false;
        const fonteDone = done || checked;
        return (
          <div key={i} style={{ marginBottom: i < fontes.length - 1 ? 8 : 0 }} className="flex items-start gap-2">
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggleFonte(topicoId, f.sigla, checked)}
              className={`h-4 w-4 rounded mt-0.5 shrink-0 ${checked ? "border-[#1D9E75] bg-[#1D9E75] text-white data-[state=checked]:bg-[#1D9E75] data-[state=checked]:border-[#1D9E75]" : ""}`}
            />
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {f.sigla && (
                <span style={{
                  fontWeight: 600, fontSize: 12, minWidth: 40, display: "inline-block",
                  color: fonteDone ? "#9ca3af" : undefined,
                  transition: "all 0.25s ease",
                }}>
                  {f.sigla}
                </span>
              )}
              {f.descricao && (
                <span style={{
                  fontSize: 12, color: fonteDone ? "#9ca3af" : "#6b7280",
                  textDecoration: checked ? "line-through" : "none",
                  transition: "all 0.25s ease",
                }}>
                  {f.descricao}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FontesLinks({ fontes, done, type }: { fontes: FonteItem[]; done: boolean; type: "link_questoes" | "link_dod" }) {
  const links = fontes.filter(f => f[type]);
  if (links.length === 0) return <span style={{ color: done ? "#9ca3af" : undefined }}>—</span>;
  return (
    <div className="flex flex-col items-center gap-1">
      {links.map((f, i) => (
        <a key={i} href={f[type]} target="_blank" rel="noopener noreferrer"
          style={{ color: done ? "#9ca3af" : undefined }}
          className={done ? "" : "text-primary hover:text-primary/80"}
          title={f.sigla || undefined}
        >
          <ExternalLink className="h-3.5 w-3.5 inline" />
          {f.sigla && <span className="text-[9px] ml-0.5">{f.sigla}</span>}
        </a>
      ))}
    </div>
  );
}

interface Props {
  cronogramaId: string;
  topicos: TopicoMatriz[];
  progress: UserProgress[];
  isAdminOrMod: boolean;
  userId: string;
}

// Badge style for matéria column — fixed size, top-aligned
const materiaBadgeStyle = (done: boolean, color: string): React.CSSProperties => ({
  display: "inline-block",
  fontSize: 10,
  fontWeight: 500,
  borderRadius: 9999,
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 2,
  paddingBottom: 2,
  width: "fit-content",
  maxWidth: 140,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  backgroundColor: done ? "#e5e7eb" : color,
  color: done ? "#9ca3af" : "#ffffff",
  transition: "all 0.25s ease",
});

// ─── Admin editable row ───
function AdminEditableRow({
  topico, index, onSave, onDelete, dragHandleProps, progress, onToggleConcluido,
  fonteProgressMap, onToggleFonte,
}: {
  topico: TopicoMatriz;
  index: number;
  onSave: (id: number, data: Partial<TopicoMatriz>) => void;
  onDelete: (id: number) => void;
  dragHandleProps?: any;
  progress?: UserProgress;
  onToggleConcluido: (topicoId: number) => void;
  fonteProgressMap: Map<string, boolean>;
  onToggleFonte: (topicoId: number, sigla: string, current: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [materia, setMateria] = useState(topico.materia);
  const [assunto, setAssunto] = useState(topico.assunto || "");
  const initialFontes = parseFontes(topico);
  const [fontes, setFontes] = useState<FonteItem[]>(initialFontes.length > 0 ? initialFontes : [{ sigla: "", descricao: "", link_questoes: "", link_dod: "" }]);

  const done = progress?.concluido ?? false;
  const color = getMateriaColor(topico);
  const displayFontes = parseFontes(topico);

  const save = () => {
    const cleanFontes = fontes.filter(f => f.sigla || f.descricao || f.link_questoes || f.link_dod);
    onSave(topico.id, {
      materia, assunto,
      fontes: cleanFontes as any,
      fonte_legal: cleanFontes[0]?.descricao || null,
      link_questoes: cleanFontes[0]?.link_questoes || null,
      link_dod: cleanFontes[0]?.link_dod || null,
    });
    setEditing(false);
  };

  return (
    <tr
      className="border-b border-border/30 hover:bg-muted/20 transition-colors align-top"
      style={{ backgroundColor: done ? "rgba(0,0,0,0.04)" : undefined, transition: "all 0.25s ease" }}
    >
      <td className="p-2 text-center text-xs w-12" style={{ paddingTop: 10 }}>
        <div className="flex items-center gap-1 justify-center">
          {dragHandleProps && (
            <button {...dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          <Checkbox
            checked={done}
            onCheckedChange={() => onToggleConcluido(topico.id)}
            className={`h-4 w-4 rounded ${done ? "border-[#1D9E75] bg-[#1D9E75] text-white data-[state=checked]:bg-[#1D9E75] data-[state=checked]:border-[#1D9E75]" : ""}`}
          />
          <span style={{ fontSize: 12, color: done ? "#9ca3af" : undefined }} className={done ? "" : "text-muted-foreground"}>{index + 1}</span>
        </div>
      </td>
      <td className="p-2" style={{ paddingTop: 10, verticalAlign: "top" }}>
        {editing ? (
          <Input value={materia} onChange={e => setMateria(e.target.value)} className="h-7 text-xs" />
        ) : (
          <span style={materiaBadgeStyle(done, color)}>{topico.materia}</span>
        )}
      </td>
      <td className="p-2 text-xs" style={{ textDecoration: done ? "line-through" : "none", color: done ? "#9ca3af" : undefined, transition: "all 0.25s ease", paddingTop: 10, verticalAlign: "top" }}>
        {editing ? <Input value={assunto} onChange={e => setAssunto(e.target.value)} className="h-7 text-xs" /> : topico.assunto || "—"}
      </td>
      <td className="p-2" style={{ verticalAlign: "top", paddingTop: 8 }}>
        {editing ? (
          <FontesEditor fontes={fontes} onChange={setFontes} />
        ) : (
          <FontesDisplayWithCheckbox fontes={displayFontes} done={done} topicoId={topico.id} fonteProgressMap={fonteProgressMap} onToggleFonte={onToggleFonte} />
        )}
      </td>
      <td className="p-2 text-center" style={{ verticalAlign: "top", paddingTop: 10 }}>
        {editing ? null : <FontesLinks fontes={displayFontes} done={done} type="link_questoes" />}
      </td>
      <td className="p-2 text-center" style={{ verticalAlign: "top", paddingTop: 10 }}>
        {editing ? null : <FontesLinks fontes={displayFontes} done={done} type="link_dod" />}
      </td>
      <td className="p-2 text-center" style={{ verticalAlign: "top", paddingTop: 10 }}>
        {editing ? (
          <div className="flex gap-1 justify-center">
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={save}>Salvar</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditing(false)}>✕</Button>
          </div>
        ) : (
          <div className="flex gap-1 justify-center" style={{ opacity: done ? 0.3 : 1, transition: "all 0.25s ease" }}>
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
  progress?: UserProgress;
  onToggleConcluido: (topicoId: number) => void;
  fonteProgressMap: Map<string, boolean>;
  onToggleFonte: (topicoId: number, sigla: string, current: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.topico.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <tbody ref={setNodeRef} style={style}>
      <AdminEditableRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </tbody>
  );
}

// ─── Student row ───
function StudentRow({
  topico, index, progress, onToggleConcluido, fonteProgressMap, onToggleFonte,
}: {
  topico: TopicoMatriz;
  index: number;
  progress: UserProgress | undefined;
  onToggleConcluido: (topicoId: number) => void;
  fonteProgressMap: Map<string, boolean>;
  onToggleFonte: (topicoId: number, sigla: string, current: boolean) => void;
}) {
  const done = progress?.concluido ?? false;
  const color = getMateriaColor(topico);
  const displayFontes = parseFontes(topico);

  return (
    <tr
      className="border-b border-border/30 align-top"
      style={{ backgroundColor: done ? "rgba(0,0,0,0.04)" : undefined, transition: "all 0.25s ease" }}
    >
      <td className="p-2 text-center w-12" style={{ paddingTop: 10 }}>
        <div className="flex items-center gap-1.5 justify-center">
          <Checkbox
            checked={done}
            onCheckedChange={() => onToggleConcluido(topico.id)}
            className={`h-4 w-4 rounded ${done ? "border-[#1D9E75] bg-[#1D9E75] text-white data-[state=checked]:bg-[#1D9E75] data-[state=checked]:border-[#1D9E75]" : ""}`}
          />
          <span style={{ fontSize: 12, color: done ? "#9ca3af" : undefined, transition: "all 0.25s ease" }} className={done ? "" : "text-muted-foreground"}>{index + 1}</span>
        </div>
      </td>
      <td className="p-2" style={{ paddingTop: 10, verticalAlign: "top" }}>
        <span style={materiaBadgeStyle(done, color)}>{topico.materia}</span>
      </td>
      <td className="p-2 text-xs" style={{ textDecoration: done ? "line-through" : "none", color: done ? "#9ca3af" : undefined, transition: "all 0.25s ease", paddingTop: 10, verticalAlign: "top" }}>
        {topico.assunto || "—"}
      </td>
      <td className="p-2" style={{ verticalAlign: "top", paddingTop: 8 }}>
        <FontesDisplayWithCheckbox fontes={displayFontes} done={done} topicoId={topico.id} fonteProgressMap={fonteProgressMap} onToggleFonte={onToggleFonte} />
      </td>
      <td className="p-2 text-center" style={{ verticalAlign: "top", paddingTop: 10 }}>
        <FontesLinks fontes={displayFontes} done={done} type="link_questoes" />
      </td>
      <td className="p-2 text-center" style={{ verticalAlign: "top", paddingTop: 10 }}>
        <FontesLinks fontes={displayFontes} done={done} type="link_dod" />
      </td>
      <td className="p-2 text-center" style={{ verticalAlign: "top", paddingTop: 10, color: done ? "#9ca3af" : undefined }}>
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
  const [newFontes, setNewFontes] = useState<FonteItem[]>([{ sigla: "", descricao: "", link_questoes: "", link_dod: "" }]);
  const [newHoras, setNewHoras] = useState(3);

  const progressMap = new Map(progress.map(p => [p.topico_id, p]));

  // Fetch fonte progress for this user across all topicos in this cronograma
  const topicoIds = topicos.map(t => t.id);
  const { data: fonteProgressData } = useQuery({
    queryKey: ["fonte-progress", cronogramaId, userId],
    queryFn: async () => {
      if (topicoIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from("user_fonte_progress")
        .select("topico_id, sigla, concluido")
        .eq("user_id", userId)
        .in("topico_id", topicoIds);
      if (error) throw error;
      return (data || []) as unknown as FonteProgress[];
    },
    enabled: topicoIds.length > 0,
  });

  const fonteProgressMap = new Map<string, boolean>();
  (fonteProgressData || []).forEach((fp: FonteProgress) => {
    fonteProgressMap.set(`${fp.topico_id}:${fp.sigla}`, fp.concluido);
  });

  const upsertFonteProgress = useMutation({
    mutationFn: async ({ topicoId, sigla, concluido }: { topicoId: number; sigla: string; concluido: boolean }) => {
      const existing = fonteProgressMap.has(`${topicoId}:${sigla}`);
      if (existing) {
        const { error } = await (supabase as any).from("user_fonte_progress")
          .update({ concluido })
          .eq("user_id", userId)
          .eq("topico_id", topicoId)
          .eq("sigla", sigla);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("user_fonte_progress")
          .insert({ user_id: userId, topico_id: topicoId, sigla, concluido });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fonte-progress", cronogramaId, userId] });
    },
  });

  const handleToggleFonte = (topicoId: number, sigla: string, current: boolean) => {
    upsertFonteProgress.mutate({ topicoId, sigla, concluido: !current });
  };

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
          user_id: userId, topico_id: topicoId,
          concluido: concluido ?? false, para_revisao: para_revisao ?? false,
        });
        if (error) throw error;
      }
      if (concluido !== undefined) {
        if (concluido) {
          await supabase.from("user_calendar_events").update({ concluido: true }).eq("user_id", userId).eq("topico_id", topicoId);
        } else {
          await supabase.from("user_calendar_events").update({ concluido: false }).eq("user_id", userId).eq("topico_id", topicoId).eq("is_revisao", false);
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
      const { error } = await supabase.from("cronograma_matriz").update(data as any).eq("id", id);
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
      const cleanFontes = newFontes.filter(f => f.sigla || f.descricao || f.link_questoes || f.link_dod);
      const { error } = await supabase.from("cronograma_matriz").insert({
        cronograma_id: cronogramaId,
        ordem: maxOrdem + 1,
        materia: newMateria,
        assunto: newAssunto || null,
        fonte_legal: cleanFontes[0]?.descricao || null,
        link_questoes: cleanFontes[0]?.link_questoes || null,
        link_dod: cleanFontes[0]?.link_dod || null,
        horas_estimadas: newHoras || 3,
        cor,
        fontes: cleanFontes as any,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma-matriz", cronogramaId] });
      setNewRow(false);
      setNewMateria("");
      setNewAssunto("");
      setNewFontes([{ sigla: "", descricao: "", link_questoes: "", link_dod: "" }]);
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
              <th className="p-2 text-[10px] font-semibold text-muted-foreground uppercase">Fontes</th>
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
                    progress={progressMap.get(t.id)}
                    fonteProgressMap={fonteProgressMap}
                    onToggleFonte={handleToggleFonte}
                    onSave={(id, data) => updateTopico.mutate({ id, data })}
                    onDelete={(id) => { if (confirm("Excluir este tópico?")) deleteTopico.mutate(id); }}
                    onToggleConcluido={(id) => {
                      const cur = progressMap.get(id);
                      upsertProgress.mutate({ topicoId: id, concluido: !(cur?.concluido) });
                    }}
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
                  fonteProgressMap={fonteProgressMap}
                  onToggleFonte={handleToggleFonte}
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

      {isAdminOrMod && (
        <div className="mt-3">
          {newRow ? (
            <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Input placeholder="Matéria" value={newMateria} onChange={e => setNewMateria(e.target.value)} className="h-8 text-xs" />
                <Input placeholder="Assunto" value={newAssunto} onChange={e => setNewAssunto(e.target.value)} className="h-8 text-xs" />
                <Input type="number" placeholder="Horas estimadas" value={newHoras} onChange={e => setNewHoras(Number(e.target.value))} className="h-8 text-xs" min={1} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Fontes</label>
                <FontesEditor fontes={newFontes} onChange={setNewFontes} />
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
