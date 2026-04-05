import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isToday, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Plus, ChevronLeft, ChevronRight, GripVertical,
  ExternalLink, Check, Copy, Trash2, FileEdit, Clock, CheckCircle2,
  AlertCircle, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent,
  useSensor, useSensors, PointerSensor, TouchSensor
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ScheduleBlock = {
  id: string;
  schedule_id: string;
  block_date: string;
  sort_order: number;
  discipline: string;
  subject: string;
  dod_url: string;
  questions_url: string;
  notes: string;
  status: string;
  color: string;
  created_at: string;
  updated_at: string;
};

const DISCIPLINE_COLORS: Record<string, string> = {
  "Direito Constitucional": "#3b82f6",
  "Direito Penal": "#ef4444",
  "Direito Civil": "#22c55e",
  "Direito Processual Penal": "#f97316",
  "Direito Processual Civil": "#8b5cf6",
  "Direito Administrativo": "#06b6d4",
  "Direito Tributário": "#eab308",
  "Direito do Trabalho": "#ec4899",
  "Direito Empresarial": "#14b8a6",
  "Direitos Humanos": "#6366f1",
  "Legislação Penal Especial": "#d946ef",
  "Criminologia": "#f43f5e",
  "Medicina Legal": "#84cc16",
};

function SortableBlock({
  block, isAdmin, onEdit, onDuplicate, onDelete, onToggleStatus
}: {
  block: ScheduleBlock;
  isAdmin: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusIcon = block.status === "completed" ? (
    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
  ) : block.status === "in_progress" ? (
    <Clock className="h-3.5 w-3.5 text-yellow-400" />
  ) : (
    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
  );

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className="flex items-start gap-2 p-2.5 rounded-lg bg-card/80 border border-border/50 hover:border-border transition-all text-sm"
        style={{ borderLeftWidth: 3, borderLeftColor: block.color || "#3b82f6" }}
      >
        {isAdmin && (
          <button {...attributes} {...listeners} className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <button onClick={onToggleStatus} className="shrink-0">{statusIcon}</button>
            <span className={`font-medium truncate ${block.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {block.discipline}
            </span>
          </div>
          {block.subject && <p className="text-xs text-muted-foreground truncate">{block.subject}</p>}
          <div className="flex items-center gap-2 mt-1">
            {block.dod_url && (
              <a href={block.dod_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                DOD <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
            {block.questions_url && (
              <a href={block.questions_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                Questões <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onEdit} className="p-1 text-muted-foreground hover:text-foreground"><FileEdit className="h-3 w-3" /></button>
            <button onClick={onDuplicate} className="p-1 text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
            <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [activeId, setActiveId] = useState<string | null>(null);

  // Form state
  const [blockDiscipline, setBlockDiscipline] = useState("");
  const [blockSubject, setBlockSubject] = useState("");
  const [blockDodUrl, setBlockDodUrl] = useState("");
  const [blockQuestionsUrl, setBlockQuestionsUrl] = useState("");
  const [blockNotes, setBlockNotes] = useState("");
  const [blockStatus, setBlockStatus] = useState("pending");
  const [blockColor, setBlockColor] = useState("#3b82f6");
  const [blockDate, setBlockDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const { data: schedule } = useQuery({
    queryKey: ["schedule", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedules").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["schedule-blocks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_blocks")
        .select("*")
        .eq("schedule_id", id!)
        .order("block_date", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as ScheduleBlock[];
    },
    enabled: !!id,
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ["discipline-subjects-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase.from("discipline_subjects").select("discipline, subject").order("sort_order");
      if (error) throw error;
      const unique = [...new Set((data || []).map((d: any) => d.discipline))];
      return unique as string[];
    },
  });

  const { data: subjectsForDiscipline = [] } = useQuery({
    queryKey: ["subjects-for-discipline", blockDiscipline],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discipline_subjects")
        .select("subject")
        .eq("discipline", blockDiscipline)
        .order("sort_order");
      if (error) throw error;
      return (data || []).map((d: any) => d.subject);
    },
    enabled: !!blockDiscipline,
  });

  // Stats
  const stats = useMemo(() => {
    const total = blocks.length;
    const completed = blocks.filter(b => b.status === "completed").length;
    const inProgress = blocks.filter(b => b.status === "in_progress").length;
    const pending = blocks.filter(b => b.status === "pending").length;
    const overdue = blocks.filter(b => b.status !== "completed" && isBefore(parseISO(b.block_date), new Date()) && !isToday(parseISO(b.block_date))).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, overdue, progress };
  }, [blocks]);

  // Date range
  const dateRange = useMemo(() => {
    if (view === "day") return [currentDate];
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [view, currentDate]);

  const blocksByDate = useMemo(() => {
    const map: Record<string, ScheduleBlock[]> = {};
    blocks.forEach(b => {
      const key = b.block_date;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [blocks]);

  const navigate_date = (dir: number) => {
    if (view === "day") setCurrentDate(addDays(currentDate, dir));
    else if (view === "week") setCurrentDate(addDays(currentDate, dir * 7));
    else setCurrentDate(addDays(currentDate, dir * 30));
  };

  const resetBlockForm = () => {
    setBlockDiscipline("");
    setBlockSubject("");
    setBlockDodUrl("");
    setBlockQuestionsUrl("");
    setBlockNotes("");
    setBlockStatus("pending");
    setBlockColor("#3b82f6");
    setBlockDate(format(new Date(), "yyyy-MM-dd"));
    setEditingBlock(null);
  };

  const createBlockMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = blocks.filter(b => b.block_date === blockDate).reduce((max, b) => Math.max(max, b.sort_order), -1);
      const { error } = await supabase.from("schedule_blocks").insert({
        schedule_id: id!,
        block_date: blockDate,
        sort_order: maxOrder + 1,
        discipline: blockDiscipline,
        subject: blockSubject,
        dod_url: blockDodUrl,
        questions_url: blockQuestionsUrl,
        notes: blockNotes,
        status: blockStatus,
        color: blockColor,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
      queryClient.invalidateQueries({ queryKey: ["schedule-block-stats"] });
      setShowBlockForm(false);
      resetBlockForm();
      toast.success("Bloco criado!");
    },
    onError: () => toast.error("Erro ao criar bloco"),
  });

  const updateBlockMutation = useMutation({
    mutationFn: async () => {
      if (!editingBlock) return;
      const { error } = await supabase.from("schedule_blocks").update({
        block_date: blockDate,
        discipline: blockDiscipline,
        subject: blockSubject,
        dod_url: blockDodUrl,
        questions_url: blockQuestionsUrl,
        notes: blockNotes,
        status: blockStatus,
        color: blockColor,
      }).eq("id", editingBlock.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
      queryClient.invalidateQueries({ queryKey: ["schedule-block-stats"] });
      setShowBlockForm(false);
      resetBlockForm();
      toast.success("Bloco atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase.from("schedule_blocks").delete().eq("id", blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
      queryClient.invalidateQueries({ queryKey: ["schedule-block-stats"] });
      toast.success("Bloco excluído!");
    },
  });

  const duplicateBlock = async (block: ScheduleBlock) => {
    const maxOrder = blocks.filter(b => b.block_date === block.block_date).reduce((max, b) => Math.max(max, b.sort_order), -1);
    const { error } = await supabase.from("schedule_blocks").insert({
      schedule_id: id!,
      block_date: block.block_date,
      sort_order: maxOrder + 1,
      discipline: block.discipline,
      subject: block.subject,
      dod_url: block.dod_url,
      questions_url: block.questions_url,
      notes: block.notes,
      status: "pending",
      color: block.color,
    });
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
      toast.success("Bloco duplicado!");
    }
  };

  const toggleStatus = async (block: ScheduleBlock) => {
    const next = block.status === "pending" ? "in_progress" : block.status === "in_progress" ? "completed" : "pending";
    await supabase.from("schedule_blocks").update({ status: next }).eq("id", block.id);
    queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
    queryClient.invalidateQueries({ queryKey: ["schedule-block-stats"] });
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find the target date from the droppable container
    const activeBlock = blocks.find(b => b.id === active.id);
    const overBlock = blocks.find(b => b.id === over.id);
    if (!activeBlock || !overBlock) return;

    if (activeBlock.block_date !== overBlock.block_date) {
      // Move to different date
      await supabase.from("schedule_blocks").update({
        block_date: overBlock.block_date,
        sort_order: overBlock.sort_order,
      }).eq("id", activeBlock.id);
    } else {
      // Reorder within same date
      const dayBlocks = blocks.filter(b => b.block_date === activeBlock.block_date);
      const oldIndex = dayBlocks.findIndex(b => b.id === active.id);
      const newIndex = dayBlocks.findIndex(b => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...dayBlocks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      await Promise.all(
        reordered.map((b, i) => supabase.from("schedule_blocks").update({ sort_order: i }).eq("id", b.id))
      );
    }
    queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
  };

  const openEditBlock = (block: ScheduleBlock) => {
    setEditingBlock(block);
    setBlockDiscipline(block.discipline);
    setBlockSubject(block.subject);
    setBlockDodUrl(block.dod_url);
    setBlockQuestionsUrl(block.questions_url);
    setBlockNotes(block.notes);
    setBlockStatus(block.status);
    setBlockColor(block.color);
    setBlockDate(block.block_date);
    setShowBlockForm(true);
  };

  const openCreateBlock = (date: string) => {
    resetBlockForm();
    setBlockDate(date);
    setShowBlockForm(true);
  };

  const draggedBlock = activeId ? blocks.find(b => b.id === activeId) : null;

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cronograma")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{schedule?.title || "Cronograma"}</h1>
          {schedule?.description && <p className="text-sm text-muted-foreground">{schedule.description}</p>}
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{stats.progress}% concluído</span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> {stats.completed} concluídos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> {stats.inProgress} em andamento</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> {stats.pending} pendentes</span>
              {stats.overdue > 0 && <span className="flex items-center gap-1 text-destructive"><span className="w-2 h-2 rounded-full bg-destructive" /> {stats.overdue} atrasados</span>}
            </div>
          </div>
          <Progress value={stats.progress} className="h-2.5" />
        </CardContent>
      </Card>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={v => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate_date(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate_date(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={`grid gap-2 ${view === "month" ? "grid-cols-7" : view === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
          {dateRange.map(date => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayBlocks = blocksByDate[dateKey] || [];
            const isCurrentDay = isToday(date);

            return (
              <div
                key={dateKey}
                className={`rounded-lg border p-2 min-h-[120px] ${
                  isCurrentDay ? "border-primary/50 bg-primary/5" : "border-border/30 bg-card/30"
                } ${view === "month" ? "min-h-[80px]" : ""}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-medium ${isCurrentDay ? "text-primary" : "text-muted-foreground"}`}>
                    {view === "day"
                      ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
                      : view === "week"
                      ? <><span className="block">{format(date, "EEE", { locale: ptBR })}</span><span className="text-foreground text-sm">{format(date, "dd")}</span></>
                      : format(date, "dd")
                    }
                  </span>
                  {isAdmin && (
                    <button onClick={() => openCreateBlock(dateKey)} className="text-muted-foreground hover:text-primary">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <SortableContext items={dayBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {dayBlocks.map(block => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        isAdmin={isAdmin}
                        onEdit={() => openEditBlock(block)}
                        onDuplicate={() => duplicateBlock(block)}
                        onDelete={() => deleteBlockMutation.mutate(block.id)}
                        onToggleStatus={() => toggleStatus(block)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {draggedBlock && (
            <div className="p-2.5 rounded-lg bg-card border border-primary shadow-lg text-sm" style={{ borderLeftWidth: 3, borderLeftColor: draggedBlock.color }}>
              <span className="font-medium">{draggedBlock.discipline}</span>
              {draggedBlock.subject && <p className="text-xs text-muted-foreground">{draggedBlock.subject}</p>}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Block Form Dialog */}
      <Dialog open={showBlockForm} onOpenChange={open => { if (!open) { setShowBlockForm(false); resetBlockForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Editar Bloco" : "Novo Bloco de Estudo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data</label>
              <Input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Matéria</label>
              <Select value={blockDiscipline} onValueChange={v => { setBlockDiscipline(v); setBlockSubject(""); setBlockColor(DISCIPLINE_COLORS[v] || "#3b82f6"); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a matéria" /></SelectTrigger>
                <SelectContent>
                  {disciplines.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {blockDiscipline && subjectsForDiscipline.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Assunto</label>
                <Select value={blockSubject} onValueChange={setBlockSubject}>
                  <SelectTrigger><SelectValue placeholder="Selecione o assunto" /></SelectTrigger>
                  <SelectContent>
                    {subjectsForDiscipline.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Link DOD (Dizer o Direito)</label>
              <Input placeholder="https://www.dizerodireito.com.br/..." value={blockDodUrl} onChange={e => setBlockDodUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Link Questões</label>
              <Input placeholder="https://..." value={blockQuestionsUrl} onChange={e => setBlockQuestionsUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
              <Textarea placeholder="Anotações..." value={blockNotes} onChange={e => setBlockNotes(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select value={blockStatus} onValueChange={setBlockStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cor</label>
                <Input type="color" value={blockColor} onChange={e => setBlockColor(e.target.value)} className="h-10 p-1" />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => editingBlock ? updateBlockMutation.mutate() : createBlockMutation.mutate()}
              disabled={!blockDiscipline || createBlockMutation.isPending || updateBlockMutation.isPending}
            >
              {editingBlock ? "Salvar Alterações" : "Criar Bloco"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
