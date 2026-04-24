import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { studySessions, addStudySession, getUserStudyStats, getWeeklyChartData } from "@/data/mockData";
import { useDisciplines } from "@/hooks/useDisciplines";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, Square, Flame, Clock, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { toast } from "sonner";

type TimerStatus = "running" | "paused" | "completed" | "cancelled";

interface TimerSession {
  id: string;
  user_id: string;
  discipline: string | null;
  status: TimerStatus;
  start_time: string;
  paused_at: string | null;
  resumed_at: string | null;
  end_time: string | null;
  accumulated_seconds: number;
  total_seconds: number | null;
}

const TABLE = "study_timer_sessions" as const;

function formatTime(s: number) {
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

export default function StudyTimerPage() {
  const { user } = useAuth();
  const { disciplines } = useDisciplines();
  const userId = user?.id || "u1";

  const [session, setSession] = useState<TimerSession | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingRestore, setLoadingRestore] = useState(true);

  // Modals
  const [showStopModal, setShowStopModal] = useState(false);
  const [showRectifyModal, setShowRectifyModal] = useState(false);
  const [rectifyHours, setRectifyHours] = useState(0);
  const [rectifyMinutes, setRectifyMinutes] = useState(0);
  const [rectifyReason, setRectifyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeStrRef = useRef<string>("");

  // ── Restaurar sessão ativa ao montar ───────────────────────────────────
  const loadActive = useCallback(async () => {
    if (!user?.id) {
      setLoadingRestore(false);
      return;
    }
    const { data, error } = await (supabase as any)
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
      setSeconds(computeElapsed(s));
      startTimeStrRef.current = formatHour(new Date(s.start_time));
    }
    setLoadingRestore(false);
  }, [user?.id]);

  useEffect(() => {
    loadActive();
  }, [loadActive]);

  // ── Tick local apenas como render do tempo, sempre derivado de start_time
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

  // ── Iniciar ─────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!user?.id) {
      toast.error("Faça login para iniciar o cronômetro.");
      return;
    }
    if (session && (session.status === "running" || session.status === "paused")) {
      toast.info("Você já tem uma sessão em andamento.");
      return;
    }
    setSubmitting(true);
    const nowIso = new Date().toISOString();
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .insert({
        user_id: user.id,
        discipline: selectedDiscipline || null,
        status: "running",
        start_time: nowIso,
        accumulated_seconds: 0,
      })
      .select("*")
      .single();
    setSubmitting(false);
    if (error) {
      // Conflito de unicidade → já existe sessão ativa, recarrega
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
    startTimeStrRef.current = formatHour(new Date(s.start_time));
  };

  // ── Pausar ──────────────────────────────────────────────────────────────
  const handlePause = async () => {
    if (!session || session.status !== "running") return;
    const elapsed = computeElapsed(session);
    const nowIso = new Date().toISOString();
    const { data, error } = await (supabase as any)
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

  // ── Continuar ───────────────────────────────────────────────────────────
  const handleResume = async () => {
    if (!session || session.status !== "paused") return;
    const nowIso = new Date().toISOString();
    const { data, error } = await (supabase as any)
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

  // ── Stop → abre modal ───────────────────────────────────────────────────
  const handleStopClick = () => {
    if (!session) return;
    setShowStopModal(true);
  };

  // ── Finaliza salvando o tempo informado ─────────────────────────────────
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
    };
    if (opts.rectified) {
      update.original_calculated_seconds = opts.originalSeconds ?? null;
      update.adjusted_total_seconds = opts.totalSeconds;
      update.adjustment_reason = opts.reason || null;
      update.adjusted_at = nowIso;
    }
    const { error } = await (supabase as any).from(TABLE).update(update).eq("id", session.id);
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao finalizar sessão.");
      return;
    }

    // Mantém compatibilidade com estatísticas/gráfico atuais (mock)
    if (opts.totalSeconds >= 60) {
      const now = new Date();
      addStudySession({
        id: `ss_${Date.now()}`,
        userId,
        discipline: session.discipline || selectedDiscipline || "Geral",
        startTime: startTimeStrRef.current || formatHour(new Date(session.start_time)),
        endTime: formatHour(now),
        duration: Math.round(opts.totalSeconds / 60),
        date: now.toISOString().split("T")[0],
      });
    }

    toast.success(opts.rectified ? "Sessão finalizada com tempo retificado." : "Sessão finalizada!");
    setSession(null);
    setSeconds(0);
    setShowStopModal(false);
    setShowRectifyModal(false);
    setRectifyHours(0);
    setRectifyMinutes(0);
    setRectifyReason("");
    setRefreshKey(k => k + 1);
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

  // ── Estatísticas (mantidas como antes) ──────────────────────────────────
  const stats = useMemo(() => getUserStudyStats(userId), [userId, refreshKey]);
  const chartData = useMemo(() => getWeeklyChartData(userId), [userId, refreshKey]);
  const todaySessions = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return studySessions.filter(s => s.userId === userId && s.date === todayStr);
  }, [userId, refreshKey]);

  const fmtHours = (h: number) => {
    const totalMinutes = Math.round((h || 0) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
  };

  const isRunning = session?.status === "running";
  const isPaused = session?.status === "paused";
  const hasActive = isRunning || isPaused;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Cronômetro de Estudos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registre suas sessões e acompanhe seu progresso
        </p>
      </div>

      {hasActive && !loadingRestore && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
          <AlertCircle className="h-4 w-4" />
          Você possui uma sessão de estudos em andamento.
        </div>
      )}

      {/* Timer */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className={`gradient-card border-border ${isRunning ? "border-primary/30 glow-electric" : ""} transition-all`}>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Select
                value={selectedDiscipline}
                onValueChange={setSelectedDiscipline}
                disabled={hasActive}
              >
                <SelectTrigger className="w-64 mx-auto bg-secondary border-border">
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines.map(d => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className={`text-6xl md:text-8xl font-display font-bold tracking-wider mb-8 ${
                isRunning ? "text-primary animate-pulse-glow" : "text-foreground"
              }`}
            >
              {formatTime(seconds)}
            </div>

            <div className="flex items-center justify-center gap-3">
              {!hasActive && (
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={submitting || loadingRestore}
                  className="gradient-electric text-white font-semibold px-8"
                >
                  <Play className="h-5 w-5 mr-2" /> Iniciar
                </Button>
              )}
              {isRunning && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePause}
                  className="border-primary/30 text-primary px-8"
                >
                  <Pause className="h-5 w-5 mr-2" /> Pausar
                </Button>
              )}
              {isPaused && (
                <Button
                  size="lg"
                  onClick={handleResume}
                  className="gradient-electric text-white font-semibold px-8"
                >
                  <Play className="h-5 w-5 mr-2" /> Continuar
                </Button>
              )}
              {hasActive && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStopClick}
                  className="border-border text-muted-foreground"
                >
                  <Square className="h-5 w-5 mr-2" /> Finalizar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Hoje" value={fmtHours(stats.todayHours)} icon={Clock} variant="electric" />
        <StatCard title="Semana" value={fmtHours(stats.weekHours)} icon={Calendar} variant="default" />
        <StatCard title="Mês" value={fmtHours(stats.monthHours)} icon={TrendingUp} variant="purple" />
        <StatCard
          title="Sequência"
          value={`${stats.streak} dia${stats.streak !== 1 ? "s" : ""}`}
          icon={Flame}
          variant="gold"
        />
      </div>

      {/* Chart + Sessions */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="gradient-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horas na Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 18%, 11%)",
                    border: "1px solid hsl(220, 14%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 20%, 92%)",
                  }}
                />
                <Bar dataKey="hours" fill="hsl(270, 60%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessões de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sessão registrada hoje</p>
            )}
            {todaySessions.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">{s.discipline}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.startTime} - {s.endTime}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">{(s.duration / 60).toFixed(1)}h</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Modal de confirmação ao parar */}
      <Dialog open={showStopModal} onOpenChange={setShowStopModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar sessão de estudos?</DialogTitle>
            <DialogDescription>
              Você deseja finalizar esta sessão agora ou ajustar manualmente o tempo estudado antes de salvar?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-secondary/40 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Tempo registrado</p>
            <p className="font-mono text-2xl font-bold text-primary tabular-nums">
              {formatTime(session ? computeElapsed(session) : 0)}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowStopModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleOpenRectify} disabled={submitting}>
              Retificar tempo
            </Button>
            <Button
              onClick={handleFinalizeNow}
              disabled={submitting}
              className="gradient-electric text-white"
            >
              Finalizar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de retificação */}
      <Dialog open={showRectifyModal} onOpenChange={setShowRectifyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retificar tempo estudado</DialogTitle>
            <DialogDescription>
              Ajuste o tempo total da sessão. O tempo originalmente cronometrado será preservado para auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Horas</label>
                <Input
                  type="number"
                  min={0}
                  value={rectifyHours}
                  onChange={e => setRectifyHours(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Minutos</label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={rectifyMinutes}
                  onChange={e => setRectifyMinutes(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowRectifyModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRectify}
              disabled={submitting}
              className="gradient-electric text-white"
            >
              Salvar tempo ajustado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
