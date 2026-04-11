import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Plus, GripVertical, ExternalLink, Check, Trash2, FileEdit,
  Clock, CheckCircle2, AlertCircle, BarChart3, BookOpen, Calendar, Timer
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
  study_time: string;
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

// ─── Sortable Cycle Card ─────────────────────────────────────────────
function SortableCycleCard({
  block, index, isAdmin, onEdit, onDelete, onToggleStatus
}: {
  block: ScheduleBlock;
  index: number;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="flex-shrink-0 w-[280px] md:w-[300px]"
    >
      <CycleCardContent
        block={block}
        index={index}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        dragHandleProps={isAdmin ? { ...attributes, ...listeners } : undefined}
      />
    </motion.div>
  );
}

function CycleCardContent({
  block, index, isAdmin, onEdit, onDelete, onToggleStatus, dragHandleProps
}: {
  block: ScheduleBlock;
  index: number;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  dragHandleProps?: any;
}) {
  const statusConfig = {
    completed: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10", label: "Concluído" },
    in_progress: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Em andamento" },
    pending: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/30", label: "Pendente" },
  };
  const st = statusConfig[block.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = st.icon;

  return (
    <div
      className="group relative rounded-xl border border-border/50 bg-card hover:border-border transition-all duration-300 overflow-hidden"
      style={{ borderTopWidth: 3, borderTopColor: block.color || "#3b82f6" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <button {...dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground -ml-1">
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ciclo {index + 1}
          </span>
        </div>
        <button onClick={onToggleStatus} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
          <StatusIcon className="h-3 w-3" />
          <span>{st.label}</span>
        </button>
      </div>

      {/* Discipline */}
      <div className="px-4 pb-3">
        <h3 className="font-display font-semibold text-foreground text-base leading-tight">{block.discipline}</h3>
      </div>

      {/* Content Blocks */}
      <div className="px-4 pb-4 space-y-3">
        {/* Subject */}
        {block.subject && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <BookOpen className="h-3 w-3" />
              Assunto
            </div>
            <p className="text-sm text-foreground/90 leading-snug">{block.subject}</p>
          </div>
        )}

        {/* Links */}
        {(block.questions_url || block.dod_url) && (
          <div className="flex flex-wrap gap-2">
            {block.questions_url && (
              <a
                href={block.questions_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
                onClick={e => e.stopPropagation()}
              >
                Questões <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {block.dod_url && (
              <a
                href={block.dod_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
                onClick={e => e.stopPropagation()}
              >
                DOD <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Study Time */}
        {block.study_time && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Timer className="h-3 w-3" />
              Tempo de Estudo
            </div>
            <p className="text-sm text-foreground/90">{block.study_time}</p>
          </div>
        )}

        {/* Notes */}
        {block.notes && (
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Notas
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{block.notes}</p>
          </div>
        )}
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="border-t border-border/30 px-4 py-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <FileEdit className="h-3 w-3" /> Editar
          </button>
          <button onClick={onDelete} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3 w-3" /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Student Planner ──────────────────────────────────────────────────
function StudentPlanner({
  scheduleId,
  userId,
  blocks,
}: {
  scheduleId: string;
  userId: string;
  blocks: ScheduleBlock[];
}) {
  const queryClient = useQueryClient();
  const [weeklyHours, setWeeklyHours] = useState<number>(10);
  const [editingHours, setEditingHours] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["planner-settings", scheduleId, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_planner_settings")
        .select("*")
        .eq("schedule_id", scheduleId)
        .eq("user_id", userId)
        .maybeSingle();
      if (data) setWeeklyHours(Number(data.weekly_hours));
      return data;
    },
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["planner-entries", scheduleId, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_planner_entries")
        .select("*")
        .eq("schedule_id", scheduleId)
        .eq("user_id", userId);
      return data || [];
    },
  });

  const saveHoursMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("student_planner_settings")
        .upsert({
          user_id: userId,
          schedule_id: scheduleId,
          weekly_hours: weeklyHours,
        }, { onConflict: "user_id,schedule_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner-settings", scheduleId, userId] });
      setEditingHours(false);
      toast.success("Horário salvo!");
    },
  });

  const toggleEntryMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const existing = entries.find((e: any) => e.block_id === blockId);
      if (existing) {
        await supabase
          .from("student_planner_entries")
          .update({ is_completed: !existing.is_completed })
          .eq("id", existing.id);
      } else {
        await supabase.from("student_planner_entries").insert({
          user_id: userId,
          schedule_id: scheduleId,
          block_id: blockId,
          is_completed: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner-entries", scheduleId, userId] });
    },
  });

  const completedIds = new Set(entries.filter((e: any) => e.is_completed).map((e: any) => e.block_id));
  const completedCount = blocks.filter(b => completedIds.has(b.id)).length;
  const plannerProgress = blocks.length > 0 ? Math.round((completedCount / blocks.length) * 100) : 0;

  // Distribute cycles across days based on weekly hours
  const hoursPerDay = weeklyHours / 7;
  const estimatedCyclesPerDay = Math.max(1, Math.round(hoursPerDay / 1.5));
  const totalDays = Math.ceil(blocks.length / estimatedCyclesPerDay);

  return (
    <div className="space-y-6">
      {/* Hours config */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-foreground text-sm">Sua disponibilidade</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Informe seu tempo semanal disponível para estudos</p>
            </div>
            {!editingHours ? (
              <Button variant="outline" size="sm" onClick={() => setEditingHours(true)}>
                {settings ? `${weeklyHours}h/semana` : "Configurar"}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={weeklyHours}
                  onChange={e => setWeeklyHours(Number(e.target.value))}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">h/semana</span>
                <Button size="sm" className="h-8" onClick={() => saveHoursMutation.mutate()}>
                  Salvar
                </Button>
              </div>
            )}
          </div>

          {settings && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{weeklyHours}h</p>
                <p className="text-[10px] text-muted-foreground">Por semana</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{hoursPerDay.toFixed(1)}h</p>
                <p className="text-[10px] text-muted-foreground">Por dia</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">~{totalDays}d</p>
                <p className="text-[10px] text-muted-foreground">Para concluir</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Seu progresso</span>
            <span className="text-sm font-bold text-primary">{plannerProgress}%</span>
          </div>
          <Progress value={plannerProgress} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedCount} de {blocks.length} ciclos concluídos
          </p>
        </CardContent>
      </Card>

      {/* Checklist */}
      <div className="space-y-2">
        {blocks.map((block, i) => {
          const done = completedIds.has(block.id);
          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                done
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-border/30 bg-card/30 hover:border-border"
              }`}
              onClick={() => toggleEntryMutation.mutate(block.id)}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${
                done ? "border-green-400 bg-green-400 text-background" : "border-muted-foreground/30"
              }`}>
                {done && <Check className="h-3.5 w-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Ciclo {i + 1}</span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: block.color || "#3b82f6" }} />
                </div>
                <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {block.discipline}
                </p>
                {block.subject && (
                  <p className="text-xs text-muted-foreground truncate">{block.subject}</p>
                )}
              </div>
              {block.study_time && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer className="h-3 w-3" /> {block.study_time}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showBlockForm, setShowBlockForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("cronograma");

  // Form state
  const [blockDiscipline, setBlockDiscipline] = useState("");
  const [blockSubject, setBlockSubject] = useState("");
  const [blockDodUrl, setBlockDodUrl] = useState("");
  const [blockQuestionsUrl, setBlockQuestionsUrl] = useState("");
  const [blockNotes, setBlockNotes] = useState("");
  const [blockStudyTime, setBlockStudyTime] = useState("");
  const [blockStatus, setBlockStatus] = useState("pending");
  const [blockColor, setBlockColor] = useState("#3b82f6");

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
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as ScheduleBlock[];
    },
    enabled: !!id,
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ["discipline-subjects-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase.from("discipline_subjects").select("discipline").order("sort_order");
      if (error) throw error;
      return [...new Set((data || []).map((d: any) => d.discipline))] as string[];
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

  const stats = useMemo(() => {
    const total = blocks.length;
    const completed = blocks.filter(b => b.status === "completed").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, progress };
  }, [blocks]);

  const resetBlockForm = () => {
    setBlockDiscipline("");
    setBlockSubject("");
    setBlockDodUrl("");
    setBlockQuestionsUrl("");
    setBlockNotes("");
    setBlockStudyTime("");
    setBlockStatus("pending");
    setBlockColor("#3b82f6");
    setEditingBlock(null);
  };

  const createBlockMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = blocks.reduce((max, b) => Math.max(max, b.sort_order), -1);
      const { error } = await supabase.from("schedule_blocks").insert({
        schedule_id: id!,
        block_date: new Date().toISOString().split("T")[0],
        sort_order: maxOrder + 1,
        discipline: blockDiscipline,
        subject: blockSubject,
        dod_url: blockDodUrl,
        questions_url: blockQuestionsUrl,
        notes: blockNotes,
        study_time: blockStudyTime,
        status: blockStatus,
        color: blockColor,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
      setShowBlockForm(false);
      resetBlockForm();
      toast.success("Ciclo criado!");
    },
    onError: () => toast.error("Erro ao criar ciclo"),
  });

  const updateBlockMutation = useMutation({
    mutationFn: async () => {
      if (!editingBlock) return;
      const { error } = await supabase.from("schedule_blocks").update({
        discipline: blockDiscipline,
        subject: blockSubject,
        dod_url: blockDodUrl,
        questions_url: blockQuestionsUrl,
        notes: blockNotes,
        study_time: blockStudyTime,
        status: blockStatus,
        color: blockColor,
      }).eq("id", editingBlock.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
      setShowBlockForm(false);
      resetBlockForm();
      toast.success("Ciclo atualizado!");
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
      toast.success("Ciclo excluído!");
    },
  });

  const toggleStatus = async (block: ScheduleBlock) => {
    const next = block.status === "pending" ? "in_progress" : block.status === "in_progress" ? "completed" : "pending";
    await supabase.from("schedule_blocks").update({ status: next }).eq("id", block.id);
    queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex(b => b.id === active.id);
    const newIndex = blocks.findIndex(b => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...blocks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    await Promise.all(
      reordered.map((b, i) => supabase.from("schedule_blocks").update({ sort_order: i }).eq("id", b.id))
    );
    queryClient.invalidateQueries({ queryKey: ["schedule-blocks", id] });
  };

  const openEditBlock = (block: ScheduleBlock) => {
    setEditingBlock(block);
    setBlockDiscipline(block.discipline);
    setBlockSubject(block.subject);
    setBlockDodUrl(block.dod_url);
    setBlockQuestionsUrl(block.questions_url);
    setBlockNotes(block.notes);
    setBlockStudyTime(block.study_time || "");
    setBlockStatus(block.status);
    setBlockColor(block.color);
    setShowBlockForm(true);
  };

  const draggedBlock = activeId ? blocks.find(b => b.id === activeId) : null;

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cronograma")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground">{schedule?.title || "Cronograma"}</h1>
          {schedule?.career && (
            <Badge variant="outline" className="mt-1 text-[10px] bg-background/50 border-border/50">
              {schedule.career}
            </Badge>
          )}
        </div>
        {isAdmin && (
          <Button size="sm" className="gap-2" onClick={() => { resetBlockForm(); setShowBlockForm(true); }}>
            <Plus className="h-4 w-4" /> Novo Ciclo
          </Button>
        )}
      </div>

      {/* Progress */}
      {blocks.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{stats.progress}% concluído</span>
              </div>
              <span className="text-xs text-muted-foreground">{stats.completed}/{stats.total} ciclos</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Tabs: Cronograma Fixo | Meu Planner */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="cronograma" className="gap-2">
            <Calendar className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="planner" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Meu Planner
          </TabsTrigger>
        </TabsList>

        {/* ─── Fixed Schedule (Cycles) ─── */}
        <TabsContent value="cronograma" className="mt-5">
          {blocks.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhum ciclo cadastrado</p>
              {isAdmin && <p className="text-sm text-muted-foreground mt-1">Adicione o primeiro ciclo ao cronograma.</p>}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
                  {blocks.map((block, i) => (
                    <SortableCycleCard
                      key={block.id}
                      block={block}
                      index={i}
                      isAdmin={isAdmin}
                      onEdit={() => openEditBlock(block)}
                      onDelete={() => {
                        if (confirm(`Excluir ciclo "${block.discipline}"?`)) {
                          deleteBlockMutation.mutate(block.id);
                        }
                      }}
                      onToggleStatus={() => toggleStatus(block)}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {draggedBlock && (
                  <div className="w-[300px]">
                    <CycleCardContent
                      block={draggedBlock}
                      index={blocks.indexOf(draggedBlock)}
                      isAdmin={false}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onToggleStatus={() => {}}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </TabsContent>

        {/* ─── Student Planner ─── */}
        <TabsContent value="planner" className="mt-5">
          {user && id ? (
            <StudentPlanner scheduleId={id} userId={user.id} blocks={blocks} />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              Faça login para acessar seu planner pessoal.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Block Form Dialog ─── */}
      <Dialog open={showBlockForm} onOpenChange={open => { if (!open) { setShowBlockForm(false); resetBlockForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Editar Ciclo" : "Novo Ciclo de Estudo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Matéria *</label>
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
              <label className="text-xs text-muted-foreground mb-1 block">Link Questões</label>
              <Input placeholder="https://..." value={blockQuestionsUrl} onChange={e => setBlockQuestionsUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Link DOD (Dizer o Direito)</label>
              <Input placeholder="https://www.dizerodireito.com.br/..." value={blockDodUrl} onChange={e => setBlockDodUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tempo de Estudo</label>
              <Input placeholder="Ex: 2h, 1h30min" value={blockStudyTime} onChange={e => setBlockStudyTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notas / Observações</label>
              <Textarea placeholder="Anotações sobre o ciclo..." value={blockNotes} onChange={e => setBlockNotes(e.target.value)} rows={2} />
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
              {editingBlock ? "Salvar Alterações" : "Criar Ciclo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
