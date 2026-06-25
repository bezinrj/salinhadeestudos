import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, Square, RotateCcw, Settings2, Share2, TrendingUp, TrendingDown, BookOpen, Target } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useCronoMaterias, useMediaHorasGeral, Periodo, periodoStart, CronoMateria } from "@/hooks/useCrono";
import { CronoMateriasManager } from "@/components/cronometro/CronoMateriasManager";
import { CronoShareCard } from "@/components/cronometro/CronoShareCard";
import { toPng } from "html-to-image";

type TimerStatus = "running" | "paused" | "completed" | "cancelled";

interface TimerSession {
  id: string;
  user_id: string;
  discipline: string | null;
  assunto: string | null;
  materia_id: string | null;
  assunto_id: string | null;
  status: TimerStatus;
  start_time: string;
  paused_at: string | null;
  resumed_at: string | null;
  end_time: string | null;
  accumulated_seconds: number;
  total_seconds: number | null;
  questoes_feitas: number | null;
  questoes_acertos: number | null;
}

const TABLE = "study_timer_sessions" as const;
const sb = supabase as any;

function formatTimerDisplay(s: number) {
  const safe = Math.max(0, Math.floor(s));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const sec = safe % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
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

const PERIODOS: Periodo[] = ["Diário", "Mensal", "Anual"];

export default function StudyTimerPage() {
  const { user } = useAuth();
  const { materias, assuntos } = useCronoMaterias();

  const [session, setSession] = useState<TimerSession | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [selectedMateriaId, setSelectedMateriaId] = useState("");
  const [selectedAssuntoId, setSelectedAssuntoId] = useState("");
  const [loadingRestore, setLoadingRestore] = useState(true);

  const [periodo, setPeriodo] = useState<Periodo>("Mensal");

  const [showStopModal, setShowStopModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [qFeitas, setQFeitas] = useState<string>("");
  const [qAcertos, setQAcertos] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shareRef = useRef<HTMLDivElement | null>(null);

  // ----- Sessões do usuário -----
  const { data: allSessions = [], refetch } = useQuery({
    queryKey: ["crono_sessoes_completed", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await sb
        .from(TABLE)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed");
      if (error) throw error;
      return (data || []) as TimerSession[];
    },
    enabled: !!user?.id,
  });

  const filteredSessions = useMemo(() => {
    const start = periodoStart(periodo);
    return allSessions.filter(s => {
      if (!s.end_time || !s.total_seconds) return false;
      return new Date(s.end_time) >= start;
    });
  }, [allSessions, periodo]);

  const materiaMap = useMemo(() => {
    const m = new Map<string, CronoMateria>();
    materias.forEach(x => m.set(x.id, x));
    return m;
  }, [materias]);

  const chartData = useMemo(() => {
    const map = new Map<string, { seconds: number; cor: string }>();
    filteredSessions.forEach(s => {
      const mat = s.materia_id ? materiaMap.get(s.materia_id) : undefined;
      const nome = mat?.nome || s.discipline || "Outros";
      const cor = mat?.cor || "#6B7280";
      const cur = map.get(nome) || { seconds: 0, cor };
      cur.seconds += s.total_seconds || 0;
      cur.cor = cor;
      map.set(nome, cur);
    });
    const arr = Array.from(map.entries()).map(([nome, v]) => ({
      nome,
      cor: v.cor,
      seconds: v.seconds,
      horas: v.seconds / 3600,
    }));
    arr.sort((a, b) => b.seconds - a.seconds);
    const total = arr.reduce((a, b) => a + b.seconds, 0) || 1;
    return arr.map(a => ({ ...a, pct: (a.seconds / total) * 100 }));
  }, [filteredSessions, materiaMap]);

  const totalSeconds = chartData.reduce((a, b) => a + b.seconds, 0);
  const totalHoras = totalSeconds / 3600;

  const questoesFeitas = filteredSessions.reduce((a, s) => a + (s.questoes_feitas || 0), 0);
  const questoesAcertos = filteredSessions.reduce((a, s) => a + (s.questoes_acertos || 0), 0);
  const acertoPct = questoesFeitas > 0 ? (questoesAcertos / questoesFeitas) * 100 : 0;

  // ----- Comparação social -----
  const { data: mediaGeral = 0 } = useMediaHorasGeral(periodo);
  const diffHoras = totalHoras - mediaGeral;
  const acima = diffHoras >= 0;
  const barPct = mediaGeral > 0 ? Math.min(100, (totalHoras / (mediaGeral * 2)) * 100) : (totalHoras > 0 ? 100 : 0);

  // ----- Restaurar sessão ativa -----
  const loadActive = useCallback(async () => {
    if (!user?.id) { setLoadingRestore(false); return; }
    const { data } = await sb
      .from(TABLE)
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["running", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      const s = data as TimerSession;
      setSession(s);
      setSelectedMateriaId(s.materia_id || "");
      setSelectedAssuntoId(s.assunto_id || "");
      setSeconds(computeElapsed(s));
    }
    setLoadingRestore(false);
  }, [user?.id]);

  useEffect(() => { loadActive(); }, [loadActive]);

  useEffect(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (session && session.status === "running") {
      const tick = () => setSeconds(computeElapsed(session));
      tick();
      tickRef.current = setInterval(tick, 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [session]);

  const selectedMateria = materias.find(m => m.id === selectedMateriaId);
  const filteredAssuntos = assuntos.filter(a => a.materia_id === selectedMateriaId);

  // ----- Ações -----
  const handleStart = async () => {
    if (!user?.id) { toast.error("Faça login."); return; }
    if (!selectedMateriaId) { toast.error("Selecione uma matéria."); return; }
    if (session && (session.status === "running" || session.status === "paused")) {
      toast.info("Já há uma sessão em andamento."); return;
    }
    const mat = materiaMap.get(selectedMateriaId);
    const ass = assuntos.find(a => a.id === selectedAssuntoId);
    setSubmitting(true);
    const { data, error } = await sb
      .from(TABLE)
      .insert({
        user_id: user.id,
        materia_id: selectedMateriaId,
        assunto_id: selectedAssuntoId || null,
        discipline: mat?.nome || null,
        assunto: ass?.nome || null,
        status: "running",
        start_time: new Date().toISOString(),
        accumulated_seconds: 0,
      })
      .select("*")
      .single();
    setSubmitting(false);
    if (error) { toast.error("Erro ao iniciar."); return; }
    setSession(data as TimerSession);
    setSeconds(0);
  };

  const handlePause = async () => {
    if (!session || session.status !== "running") return;
    const elapsed = computeElapsed(session);
    const { data, error } = await sb.from(TABLE).update({
      status: "paused", paused_at: new Date().toISOString(), accumulated_seconds: elapsed,
    }).eq("id", session.id).select("*").single();
    if (error) { toast.error("Erro ao pausar."); return; }
    setSession(data as TimerSession); setSeconds(elapsed);
  };

  const handleResume = async () => {
    if (!session || session.status !== "paused") return;
    const { data, error } = await sb.from(TABLE).update({
      status: "running", resumed_at: new Date().toISOString(),
    }).eq("id", session.id).select("*").single();
    if (error) { toast.error("Erro ao retomar."); return; }
    setSession(data as TimerSession);
  };

  const handleStopClick = () => {
    if (!session) return;
    setQFeitas(""); setQAcertos("");
    setShowStopModal(true);
  };

  const handleConfirmStop = async () => {
    if (!session) return;
    setSubmitting(true);
    const total = computeElapsed(session);
    const feitas = qFeitas.trim() ? Math.max(0, parseInt(qFeitas, 10) || 0) : null;
    let acertos: number | null = qAcertos.trim() ? Math.max(0, parseInt(qAcertos, 10) || 0) : null;
    if (feitas !== null && acertos !== null && acertos > feitas) acertos = feitas;

    const { error } = await sb.from(TABLE).update({
      status: "completed",
      end_time: new Date().toISOString(),
      total_seconds: total,
      accumulated_seconds: total,
      questoes_feitas: feitas,
      questoes_acertos: acertos,
    }).eq("id", session.id);
    setSubmitting(false);
    if (error) { toast.error("Erro ao finalizar."); return; }
    toast.success("Sessão registrada!");
    setSession(null); setSeconds(0); setShowStopModal(false);
    refetch();
  };

  const handleResetConfirm = async () => {
    if (!session) { setShowResetModal(false); return; }
    setSubmitting(true);
    const { error } = await sb.from(TABLE).update({
      status: "cancelled", end_time: new Date().toISOString(), total_seconds: 0,
    }).eq("id", session.id);
    setSubmitting(false);
    if (error) { toast.error("Erro ao zerar."); return; }
    toast.success("Cronômetro zerado.");
    setSession(null); setSeconds(0); setShowResetModal(false);
  };

  const handleShare = async () => {
    if (!shareRef.current) return;
    try {
      const dataUrl = await toPng(shareRef.current, { cacheBust: true, pixelRatio: 1 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `salinha-progresso-${periodo}-${new Date().toISOString().slice(0,10)}.png`;
      a.click();
      toast.success("Imagem baixada! Agora é só postar.");
    } catch (e) {
      console.error(e);
      toast.error("Não consegui gerar a imagem.");
    }
  };

  const isRunning = session?.status === "running";
  const isPaused = session?.status === "paused";
  const hasActive = isRunning || isPaused;

  const nomeAluno = (user?.user_metadata?.full_name as string) || (user?.email?.split("@")[0]) || "Estudante";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header com seletor de período */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cronômetro de Estudos</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seu tempo, suas questões e seu progresso.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-card border border-border p-1 rounded-lg">
            {PERIODOS.map(p => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  periodo === p ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>{p}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowManager(true)}>
            <Settings2 className="h-4 w-4 mr-2" /> Matérias
          </Button>
        </div>
      </div>

      {/* Timer */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto mb-6">
              <Select value={selectedMateriaId} onValueChange={(v) => { setSelectedMateriaId(v); setSelectedAssuntoId(""); }} disabled={hasActive}>
                <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
                <SelectContent>
                  {materias.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Cadastre uma matéria primeiro</div>}
                  {materias.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.cor }} />
                        {m.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedAssuntoId} onValueChange={setSelectedAssuntoId} disabled={hasActive || !selectedMateriaId}>
                <SelectTrigger><SelectValue placeholder="Assunto (opcional)" /></SelectTrigger>
                <SelectContent>
                  {filteredAssuntos.map(a => (<SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="text-6xl md:text-8xl font-display font-bold tracking-wider mb-8"
              style={{ color: isRunning ? "hsl(var(--gold))" : "white" }}
            >
              {formatTimerDisplay(seconds)}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!hasActive && (
                <Button size="lg" onClick={handleStart} disabled={submitting || loadingRestore}
                  className="bg-gold text-gold-foreground hover:opacity-90 font-semibold px-8">
                  <Play className="h-5 w-5 mr-2" /> Iniciar
                </Button>
              )}
              {isRunning && (
                <Button size="lg" variant="outline" onClick={handlePause} className="px-8">
                  <Pause className="h-5 w-5 mr-2" /> Pausar
                </Button>
              )}
              {isPaused && (
                <Button size="lg" onClick={handleResume} className="bg-gold text-gold-foreground hover:opacity-90 font-semibold px-8">
                  <Play className="h-5 w-5 mr-2" /> Retomar
                </Button>
              )}
              {hasActive && (
                <>
                  <Button size="lg" variant="outline" onClick={handleStopClick}>
                    <Square className="h-5 w-5 mr-2" /> Finalizar
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setShowResetModal(true)}
                    className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                    <RotateCcw className="h-5 w-5 mr-2" /> Zerar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Total no período</span>
              {acima
                ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                : <TrendingDown className="h-4 w-4 text-amber-400" />}
            </div>
            <div className="text-3xl font-bold" style={{ color: "hsl(var(--gold))" }}>
              {totalHoras.toFixed(1)} <span className="text-base text-muted-foreground">hr</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {periodo === "Diário" ? "Hoje" : periodo === "Mensal" ? "Este mês" : "Este ano"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Questões feitas</span>
              <BookOpen className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{questoesFeitas}</div>
            <div className="text-xs text-muted-foreground mt-1">no período selecionado</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">% de acerto</span>
              <Target className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold">
              {questoesFeitas > 0 ? `${acertoPct.toFixed(0)}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {questoesFeitas > 0 ? `${questoesAcertos}/${questoesFeitas}` : "registre questões para ver"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donut + Comparação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Distribuição por matéria</h2>
              <Button size="sm" variant="outline" onClick={() => setShowShare(true)} disabled={totalSeconds === 0}>
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar
              </Button>
            </div>

            {chartData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
                Nenhuma sessão registrada neste período.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="relative h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="seconds" nameKey="nome" innerRadius="60%" outerRadius="90%" paddingAngle={2}
                        label={(p: any) => p.pct >= 8 ? `${p.pct.toFixed(0)}%` : ""} labelLine={false} stroke="none">
                        {chartData.map((d, i) => (<Cell key={i} fill={d.cor} />))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "white" }}
                        formatter={(v: any, _n, p: any) => [`${(Number(v)/3600).toFixed(2)} hr`, p?.payload?.nome]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-3xl font-bold" style={{ color: "hsl(var(--gold))" }}>{totalHoras.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">horas</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {chartData.map(d => (
                    <div key={d.nome} className="flex items-center gap-3 text-sm">
                      <span className="h-3 w-3 rounded-full" style={{ background: d.cor }} />
                      <span className="flex-1 truncate">{d.nome}</span>
                      <span className="tabular-nums text-muted-foreground">{d.horas.toFixed(1)}h</span>
                      <span className="tabular-nums text-xs text-muted-foreground w-10 text-right">{d.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-1">Comparação social</h2>
            <p className="text-xs text-muted-foreground mb-5">Você vs. média geral dos alunos no período.</p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Você</span>
                  <span className="font-semibold" style={{ color: "hsl(var(--gold))" }}>{totalHoras.toFixed(1)}h</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${barPct}%`, background: "hsl(var(--gold))" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Média geral</span>
                  <span>{mediaGeral.toFixed(1)}h</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-white/30"
                    style={{ width: `${mediaGeral > 0 ? 50 : 0}%` }} />
                </div>
              </div>
            </div>

            <div className={`mt-5 rounded-lg p-3 text-sm font-medium flex items-center gap-2 ${
              acima ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
            }`}>
              {acima ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {mediaGeral === 0
                ? "Seja o primeiro a estudar neste período!"
                : acima
                  ? `Você está ${(diffHoras).toFixed(1)}h acima da média 🔥`
                  : `Faltam ${Math.abs(diffHoras).toFixed(1)}h para atingir a média`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Stop / salvar sessão */}
      <Dialog open={showStopModal} onOpenChange={setShowStopModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Salvar sessão</DialogTitle>
            <DialogDescription>
              Tempo registrado: <span className="font-semibold text-foreground">{formatTimerDisplay(seconds)}</span>.
              Você pode informar quantas questões resolveu (opcional).
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Questões feitas</Label>
              <Input type="number" min={0} value={qFeitas} onChange={(e) => setQFeitas(e.target.value)} placeholder="ex: 20" />
            </div>
            <div>
              <Label className="text-xs">Acertos</Label>
              <Input type="number" min={0} value={qAcertos} onChange={(e) => setQAcertos(e.target.value)} placeholder="ex: 15" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopModal(false)}>Cancelar</Button>
            <Button onClick={handleConfirmStop} disabled={submitting}
              className="bg-gold text-gold-foreground hover:opacity-90">Salvar sessão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Reset */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Zerar cronômetro?</DialogTitle>
            <DialogDescription>
              A sessão atual será descartada e o tempo não contará para suas estatísticas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleResetConfirm} disabled={submitting}>Zerar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Gerenciar matérias */}
      <CronoMateriasManager open={showManager} onOpenChange={setShowManager} />

      {/* Modal: Compartilhar */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar progresso</DialogTitle>
            <DialogDescription>
              Vamos gerar uma imagem vertical (1080×1920) prontinha para os stories.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg overflow-hidden border border-border">
            <div style={{ width: "100%", aspectRatio: "1080 / 1920", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, transform: "scale(0.3)", transformOrigin: "top left" }}>
                <CronoShareCard
                  ref={shareRef}
                  nome={nomeAluno}
                  periodoLabel={periodo}
                  totalHoras={totalHoras}
                  mediaGeral={mediaGeral}
                  fatias={chartData.map(d => ({ nome: d.nome, cor: d.cor, horas: d.horas, pct: d.pct }))}
                  questoesFeitas={questoesFeitas}
                  questoesAcertos={questoesAcertos}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShare(false)}>Fechar</Button>
            <Button onClick={handleShare} className="bg-gold text-gold-foreground hover:opacity-90">
              <Share2 className="h-4 w-4 mr-2" /> Baixar imagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
