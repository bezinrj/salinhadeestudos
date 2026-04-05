import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Eye, EyeOff, FileEdit, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Schedule = {
  id: string;
  title: string;
  description: string;
  status: string;
  color_theme: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type BlockStats = {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
};

export default function Schedules() {
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [colorTheme, setColorTheme] = useState("blue");

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Schedule[];
    },
  });

  const { data: blockStats = {} } = useQuery({
    queryKey: ["schedule-block-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_blocks")
        .select("schedule_id, status");
      if (error) throw error;
      const stats: Record<string, BlockStats> = {};
      (data || []).forEach((block: any) => {
        if (!stats[block.schedule_id]) {
          stats[block.schedule_id] = { total: 0, completed: 0, in_progress: 0, pending: 0 };
        }
        stats[block.schedule_id].total++;
        if (block.status === "completed") stats[block.schedule_id].completed++;
        else if (block.status === "in_progress") stats[block.schedule_id].in_progress++;
        else stats[block.schedule_id].pending++;
      });
      return stats;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("schedules").insert({
        title,
        description,
        status,
        color_theme: colorTheme,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setShowCreate(false);
      resetForm();
      toast.success("Cronograma criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar cronograma"),
  });

  const updateMutation = useMutation({
    mutationFn: async (schedule: Schedule) => {
      const { error } = await supabase
        .from("schedules")
        .update({ title: schedule.title, description: schedule.description, status: schedule.status, color_theme: schedule.color_theme })
        .eq("id", schedule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setEditingSchedule(null);
      toast.success("Cronograma atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Cronograma excluído!");
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("draft");
    setColorTheme("blue");
  };

  const statusLabel = (s: string) => {
    if (s === "draft") return "Rascunho";
    if (s === "published") return "Publicado";
    return "Oculto";
  };

  const statusColor = (s: string) => {
    if (s === "draft") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (s === "published") return "bg-green-500/10 text-green-400 border-green-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  const themeColors: Record<string, string> = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
    green: "from-green-500/20 to-green-600/5 border-green-500/30",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/30",
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/30",
    red: "from-red-500/20 to-red-600/5 border-red-500/30",
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cronogramas</h1>
          <p className="text-sm text-muted-foreground">Planeje seus estudos de forma organizada</p>
        </div>
        {isAdmin && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Novo Cronograma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Cronograma</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Título do cronograma" value={title} onChange={e => setTitle(e.target.value)} />
                <Textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="hidden">Oculto</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={colorTheme} onValueChange={setColorTheme}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">🔵 Azul</SelectItem>
                      <SelectItem value="green">🟢 Verde</SelectItem>
                      <SelectItem value="purple">🟣 Roxo</SelectItem>
                      <SelectItem value="orange">🟠 Laranja</SelectItem>
                      <SelectItem value="red">🔴 Vermelho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Criando..." : "Criar Cronograma"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando cronogramas...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum cronograma disponível</p>
          {isAdmin && <p className="text-sm text-muted-foreground mt-2">Crie seu primeiro cronograma clicando no botão acima.</p>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule, i) => {
            const stats = blockStats[schedule.id] || { total: 0, completed: 0, in_progress: 0, pending: 0 };
            const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`cursor-pointer hover:shadow-lg transition-all border bg-gradient-to-br ${themeColors[schedule.color_theme] || themeColors.blue}`}
                  onClick={() => navigate(`/cronograma/${schedule.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-foreground">{schedule.title}</CardTitle>
                      <Badge variant="outline" className={statusColor(schedule.status)}>
                        {statusLabel(schedule.status)}
                      </Badge>
                    </div>
                    {schedule.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{schedule.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      <span>{stats.total} blocos</span>
                      <span>•</span>
                      <span>{stats.completed} concluídos</span>
                      <span>•</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />

                    {isAdmin && (
                      <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setTitle(schedule.title);
                            setDescription(schedule.description);
                            setStatus(schedule.status);
                            setColorTheme(schedule.color_theme);
                          }}
                        >
                          <FileEdit className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Excluir este cronograma e todos seus blocos?")) {
                              deleteMutation.mutate(schedule.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Excluir
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSchedule} onOpenChange={open => { if (!open) setEditingSchedule(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cronograma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="hidden">Oculto</SelectItem>
                </SelectContent>
              </Select>
              <Select value={colorTheme} onValueChange={setColorTheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">🔵 Azul</SelectItem>
                  <SelectItem value="green">🟢 Verde</SelectItem>
                  <SelectItem value="purple">🟣 Roxo</SelectItem>
                  <SelectItem value="orange">🟠 Laranja</SelectItem>
                  <SelectItem value="red">🔴 Vermelho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (editingSchedule) {
                  updateMutation.mutate({ ...editingSchedule, title, description, status, color_theme: colorTheme });
                }
              }}
              disabled={!title.trim() || updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
