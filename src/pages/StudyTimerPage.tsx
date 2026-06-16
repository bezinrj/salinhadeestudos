import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { UserMateriaAssuntoPicker } from "@/components/UserMateriaAssuntoPicker";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, Square, AlertCircle, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

type TimerStatus = "running" | "paused" | "completed" | "cancelled";

interface TimerSession {
  id: string;
  user_id: string;
  discipline: string | null;
  assunto: string | null;
  status: TimerStatus;
  start_time: string;
  paused_at: string | null;
  resumed_at: string | null;
  end_time: string | null;
  accumulated_seconds: number;
  total_seconds: number | null;
}

const TABLE = "study_timer_sessions" as const;

const COLORS = [
  "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", 
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"
];

function formatTime(s: number) {
  const safe = Math.max(0, Math.floor(s));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const sec = safe % 60;
  
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatTimerDisplay(s: number) {
  const safe = Math.max(0, Math.floor(s));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const sec = safe % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function formatHour(d: Date) {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function computeElapsed(session: TimerSession): number {
  const acc = session.accumulated_seconds || 0;
  if (session.status === "running") {
    const anchor = session.resumed_at || session.start_time;
    const delta = Math.floor((Date.now() - new Date(anchor).getTime()) / 1000);
    return acc + Math.max(0, delta);
  }
  return acc;
}

type FilterOption = "Dia" | "Semana" | "Mês" | "Ano" | "Tudo";

export default function StudyTimerPage() {
  const { user } = useAuth();
  
  const [session, setSession] = useState<TimerSession | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [selectedAssunto, setSelectedAssunto] = useState("");
  const [loadingRestore, setLoadingRestore] = useState(true);

  // Filtros
  const [filterType, setFilterType] = useState<FilterOption>("Mês");

  // Modals
  const [showStopModal, setShowStopModal] = useState(false);
  const [showRectifyModal, setShowRectifyModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [rectifyHours, setRectifyHours] = useState(0);
  const [rectifyMinutes, setRectifyMinutes] = useState(0);
  const [rectifyReason, setRectifyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: allSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["study_timer_sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed");
      if (error) throw error;
      return data as TimerSession[];
    },
    enabled: !!user?.id
  });

  const filteredSessions = useMemo(() => {
    const now = new Date();
    return allSessions.filter(s => {
      if (!s.end_time || !s.total_seconds) return false;
      const end = new Date(s.end_time);
      if (filterType === "Tudo") return true;
      if (filterType === "Dia") return end.toDateString() === now.toDateString();
      if (filterType === "Semana") {
         const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
         return end >= pastWeek;
      }
      if (filterType === "Mês") {
         return end.getMonth() === now.getMonth() && end.getFullYear() === now.getFullYear();
      }
      if (filterType === "Ano") {
         return end.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [allSessions, filterType]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    filteredSessions.forEach(s => {
      const disc = s.discipline || "Outros";
      map.set(disc, (map.get(disc) || 0) + (s.total_seconds || 0));
    });
    
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSessions]);

  const totalFilteredSeconds = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const loadActive = useCallback(async () => {
    if (!user?.id) {
      setLoadingRestore(false);
      return;
    }
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["running", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const s = data as TimerSession;
      setSession(s);
      setSelectedDiscipline(s.discipline || "");
      setSelectedAssunto(s.assunto || "");
      setSeconds(computeElapsed(s));
    }
    setLoadingRestore(false);
  }, [user?.id]);

  useEffect(() => {
    loadActive();
  }, [loadActive]);

  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (session && session.status === "running") {
      const tick = () => setSeconds(computeElapsed(session));
      tick();
      tickRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [session]);

  const handleStart = async () => {
    if (!user?.id) {
      toast.error("Faça login para iniciar o cronômetro.");
      return;
    }
    if (!selectedDiscipline) {
      toast.error("Selecione uma matéria antes de iniciar.");
      return;
    }
    if (session && (session.status === "running" || session.status === "paused")) {
      toast.info("Você já tem uma sessão em andamento.");
      return;
    }
    setSubmitting(true);
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        user_id: user.id,
        discipline: selectedDiscipline || null,
        assunto: selectedAssunto || null,
        status: "running",
        start_time: nowIso,
        accumulated_seconds: 0,
      })
      .select("*")
      .single();
      
    setSubmitting(false);
    if (error) {
      if ((error as any).code === "23505") {
        toast.info("Sessão ativa detectada. Restaurando...");
        await loadActive();
        return;
      }
      toast.error("Erro ao iniciar sessão.");
      return;
    }
    const s = data as TimerSession;
    setSession(s);
    setSeconds(0);
  };

  const handlePause = async () => {
    if (!session || session.status !== "running") return;
    const elapsed = computeElapsed(session);
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        status: "paused",
        paused_at: nowIso,
        accumulated_seconds: elapsed,
      })
      .eq("id", session.id)
      .select("*")
      .single();
    if (error) {
      toast.error("Erro ao pausar.");
      return;
    }
    setSession(data as TimerSession);
    setSeconds(elapsed);
  };

  const handleResume = async () => {
    if (!session || session.status !== "paused") return;
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        status: "running",
        resumed_at: nowIso,
      })
      .eq("id", session.id)
      .select("*")
      .single();
    if (error) {
      toast.error("Erro ao retomar.");
      return;
    }
    setSession(data as TimerSession);
  };

  const handleStopClick = () => {
    if (!session) return;
    setShowStopModal(true);
  };

  const finalize = async (opts: {
    totalSeconds: number;
    rectified: boolean;
    originalSeconds?: number;
    reason?: string;
  }) => {
    if (!session) return;
    setSubmitting(true);
    const nowIso = new Date().toISOString();
    const update: Record<string, unknown> = {
      status: "completed",
      end_time: nowIso,
      total_seconds: opts.totalSeconds,
      accumulated_seconds: opts.totalSeconds,
      discipline: selectedDiscipline || session.discipline || null,
      assunto: selectedAssunto || session.assunto || null,
    };
    if (opts.rectified) {
      update.original_calculated_seconds = opts.originalSeconds ?? null;
      update.adjusted_total_seconds = opts.totalSeconds;
      update.adjustment_reason = opts.reason || null;
      update.adjusted_at = nowIso;
    }
    const { error } = await supabase.from(TABLE).update(update).eq("id", session.id);
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao finalizar sessão.");
      return;
    }

    toast.success(opts.rectified ? "Sessão finalizada com tempo retificado." : "Sessão finalizada!");
    setSession(null);
    setSeconds(0);
    setShowStopModal(false);
    setShowRectifyModal(false);
    setRectifyHours(0);
    setRectifyMinutes(0);
    setRectifyReason("");
    refetchSessions();
  };

  const handleFinalizeNow = async () => {
    if (!session) return;
    const total = computeElapsed(session);
    await finalize({ totalSeconds: total, rectified: false });
  };

  const handleOpenRectify = () => {
    if (!session) return;
    const elapsed = computeElapsed(session);
    setRectifyHours(Math.floor(elapsed / 3600));
    setRectifyMinutes(Math.floor((elapsed % 3600) / 60));
    setShowStopModal(false);
    setShowRectifyModal(true);
  };

  const handleConfirmRectify = async () => {
    if (!session) return;
    const h = Math.max(0, Math.floor(rectifyHours || 0));
    const m = Math.max(0, Math.min(59, Math.floor(rectifyMinutes || 0)));
    const total = h * 3600 + m * 60;
    if (total <= 0) {
      toast.error("Informe um tempo maior que zero.");
      return;
    }
    const original = computeElapsed(session);
    await finalize({
      totalSeconds: total,
      rectified: true,
      originalSeconds: original,
      reason: rectifyReason.trim() || undefined,
    });
  };

  const handleResetConfirm = async () => {
    if (!session) {
      setShowResetModal(false);
      return;
    }
    setSubmitting(true);
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from(TABLE)
      .update({
        status: "cancelled",
        end_time: nowIso,
        total_seconds: 0,
      })
      .eq("id", session.id);
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao zerar cronômetro.");
      return;
    }
    toast.success("Cronômetro zerado.");
    setSession(null);
    setSeconds(0);
    setShowResetModal(false);
    setShowStopModal(false);
  };

  const isRunning = session?.status === "running";
  const isPaused = session?.status === "paused";
  const hasActive = isRunning || isPaused;

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      
      {/* Aviso Sessão Ativa */}
      {hasActive && !loadingRestore && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
          <AlertCircle className="h-4 w-4" />
          Você possui uma sessão de estudos em andamento.
        </div>
      )}

      {/* Timer Section */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className={`bg-[#11131F] border-border ${isRunning ? "border-primary/30" : ""} transition-all`}>
          <CardContent className="p-8 text-center">
            
            <div className="flex flex-col gap-3 mb-8 max-w-sm mx-auto">
              <UserMateriaAssuntoPicker
                selectedDiscipline={selectedDiscipline}
                setSelectedDiscipline={setSelectedDiscipline}
                selectedAssunto={selectedAssunto}
                setSelectedAssunto={setSelectedAssunto}
                disabled={hasActive}
              />
            </div>

            <div
              className={`text-6xl md:text-8xl font-display font-bold tracking-wider mb-8 ${
                isRunning ? "text-blue-500" : "text-white"
              }`}
            >
              {formatTimerDisplay(seconds)}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!hasActive && (
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={submitting || loadingRestore}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
                >
                  <Play className="h-5 w-5 mr-2" /> Iniciar
                </Button>
              )}
              {isRunning && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePause}
                  className="border-blue-500/30 text-blue-400 px-8 hover:bg-blue-500/10"
                >
                  <Pause className="h-5 w-5 mr-2" /> Pausar
                </Button>
              )}
              {isPaused && (
                <Button
                  size="lg"
                  onClick={handleResume}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
                >
                  <Play className="h-5 w-5 mr-2" /> Continuar
                </Button>
              )}
              {hasActive && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStopClick}
                  className="border-white/10 text-white/70 hover:bg-white/5"
                >
                  <Square className="h-5 w-5 mr-2" /> Finalizar
                </Button>
              )}
              {hasActive && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowResetModal(true)}
                  className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  <RotateCcw className="h-5 w-5 mr-2" /> Zerar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chart Section */}
      <Card className="bg-[#11131F] border-border pt-6 pb-2">
        <div className="px-6 flex flex-col items-center mb-6">
          <div className="flex items-center justify-between w-full mb-4">
            <h2 className="text-lg font-bold">Todas as matérias</h2>
          </div>
          
          <div className="text-sm text-white/50 mb-4 capitalize">
            {currentMonthName}
          </div>

          <div className="flex bg-[#1B1E2B] p-1 rounded-lg border border-white/5 w-full max-w-md">
            {(["Dia", "Semana", "Mês", "Ano", "Tudo"] as FilterOption[]).map(f => (
              <button 
                key={f}
                onClick={() => setFilterType(f)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterType === f 
                    ? "bg-white text-black shadow-sm" 
                    : "text-white/60 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {totalFilteredSeconds === 0 ? (
          <div className="py-20 text-center text-white/40 text-sm">
            Nenhuma sessão registrada neste período.
          </div>
        ) : (
          <div className="px-6 pb-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={100}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatTime(value)}
                    contentStyle={{ backgroundColor: "#1B1E2B", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="text-center mt-4 mb-8">
              <div className="text-3xl font-bold font-display">
                {formatTime(totalFilteredSeconds)}
              </div>
            </div>

            <div className="space-y-3">
              {chartData.map((entry, index) => {
                const percentage = Math.round((entry.value / totalFilteredSeconds) * 100);
                return (
                  <div key={entry.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-1.5 h-4 rounded-sm" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                      />
                      <span className="text-white/90">{entry.name}</span>
                    </div>
                    <div className="flex gap-2 items-center font-medium">
                      <span>{formatTime(entry.value)}</span>
                      <span className="text-white/50 w-10 text-right">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <Dialog open={showStopModal} onOpenChange={setShowStopModal}>
        <DialogContent className="max-w-md bg-[#1B1E2B] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Finalizar sessão de estudos?</DialogTitle>
            <DialogDescription className="text-white/60">
              Você deseja finalizar esta sessão agora ou ajustar manualmente o tempo estudado antes de salvar?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-white/5 px-3 py-2 text-center my-4">
            <p className="text-xs text-white/50">Tempo registrado</p>
            <p className="font-mono text-2xl font-bold text-blue-400 tabular-nums">
              {formatTimerDisplay(session ? computeElapsed(session) : 0)}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setShowStopModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="outline" className="border-white/10 bg-transparent hover:bg-white/5" onClick={handleOpenRectify} disabled={submitting}>
              Retificar tempo
            </Button>
            <Button
              onClick={handleFinalizeNow}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Finalizar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRectifyModal} onOpenChange={setShowRectifyModal}>
        <DialogContent className="max-w-md bg-[#1B1E2B] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Retificar tempo estudado</DialogTitle>
            <DialogDescription className="text-white/60">
              Ajuste o tempo total da sessão. O tempo originalmente cronometrado será preservado para auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <UserMateriaAssuntoPicker
              selectedDiscipline={selectedDiscipline}
              setSelectedDiscipline={setSelectedDiscipline}
              selectedAssunto={selectedAssunto}
              setSelectedAssunto={setSelectedAssunto}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 block mb-1">Horas</label>
                <Input
                  type="number"
                  min={0}
                  value={rectifyHours}
                  onChange={e => setRectifyHours(Number(e.target.value))}
                  className="bg-[#11131F] border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1">Minutos</label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={rectifyMinutes}
                  onChange={e => setRectifyMinutes(Number(e.target.value))}
                  className="bg-[#11131F] border-white/10 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setShowRectifyModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRectify}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Salvar tempo ajustado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="max-w-md bg-[#1B1E2B] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Zerar cronômetro?</DialogTitle>
            <DialogDescription className="text-white/60">
              Esta ação descarta a sessão atual sem salvar o tempo. Não é possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-center my-4">
            <p className="text-xs text-red-400">Tempo que será descartado</p>
            <p className="font-mono text-2xl font-bold text-red-400 tabular-nums">
              {formatTimerDisplay(session ? computeElapsed(session) : 0)}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setShowResetModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleResetConfirm}
              disabled={submitting}
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Zerar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
