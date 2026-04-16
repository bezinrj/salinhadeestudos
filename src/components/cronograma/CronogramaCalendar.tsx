import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, RotateCcw, Info, Play, Pause, Square } from "lucide-react";
import { toast } from "sonner";
import type { TopicoMatriz } from "./MatrizTable";

export type CalendarEvent = {
  id: number;
  user_id: string;
  topico_id: number;
  data: string;
  horas_dia: number;
  is_revisao: boolean;
  concluido: boolean;
};

interface Props {
  cronogramaId: string;
  userId: string;
  events: CalendarEvent[];
  topicos: TopicoMatriz[];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const MATERIA_COLORS: Record<string, string> = {
  "Direito Constitucional": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Direito Civil": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Processo Civil": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Direito Processual Civil": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Direito Penal": "bg-red-400/20 text-red-400 border-red-400/30",
  "Direito Processual Penal": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Direito Administrativo": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Direito Tributário": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Direito Empresarial": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Direitos Humanos": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Legislação Penal Especial": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Criminologia": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Medicina Legal": "bg-lime-500/20 text-lime-400 border-lime-500/30",
};

function getMateriaColor(materia: string) {
  return MATERIA_COLORS[materia] || "bg-muted/50 text-foreground/70 border-border/30";
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getPercentColor(pct: number) {
  if (pct < 50) return "bg-red-500";
  if (pct < 60) return "bg-orange-500";
  if (pct < 80) return "bg-green-500";
  return "bg-green-700";
}

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MONTHS_LABEL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export default function CronogramaCalendar({ cronogramaId, userId, events, topicos }: Props) {
  const queryClient = useQueryClient();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [horasDia, setHorasDia] = useState(3);
  const [popupDay, setPopupDay] = useState<string | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<number | null>(null);

  // Timer state
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const topicoMap = useMemo(() => new Map(topicos.map(t => [t.id, t])), [topicos]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dayLabel = `${WEEKDAYS[today.getDay()]}, ${today.getDate()} de ${MONTHS_LABEL[today.getMonth()]}`;

  const todayEvents = useMemo(() => events.filter(e => e.data === todayStr && !e.concluido), [events, todayStr]);

  // Session data per event
  const [sessionData, setSessionData] = useState<Record<number, { tempo: string; questoes: number; acertos: number; concluir: boolean }>>({});

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!map[e.data]) map[e.data] = [];
      map[e.data].push(e);
    });
    return map;
  }, [events]);

  const navMonth = (dir: number) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const shiftEvents = useMutation({
    mutationFn: async (days: number) => {
      const incompleteEvents = events.filter(e => !e.concluido);
      if (incompleteEvents.length === 0) return;
      for (const ev of incompleteEvents) {
        const d = new Date(ev.data + "T12:00:00");
        d.setDate(d.getDate() + days);
        const newDate = d.toISOString().split("T")[0];
        await supabase.from("user_calendar_events").update({ data: newDate }).eq("id", ev.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", cronogramaId] });
      toast.success("Eventos deslocados!");
    },
  });

  const recalculate = useMutation({
    mutationFn: async () => {
      // Delete incomplete non-revision events
      const toDelete = events.filter(e => !e.concluido && !e.is_revisao);
      for (const e of toDelete) {
        await supabase.from("user_calendar_events").delete().eq("id", e.id);
      }

      // Get pending topicos (not completed)
      const completedTopicoIds = new Set(events.filter(e => e.concluido).map(e => e.topico_id));
      const pendingTopicos = topicos.filter(t => !completedTopicoIds.has(t.id));

      // Distribute starting from TODAY, skip sundays
      let currentDate = new Date();
      currentDate.setHours(12, 0, 0, 0);
      let hoursLeft = horasDia;
      const newEvents: { user_id: string; topico_id: number; data: string; horas_dia: number; is_revisao: boolean; concluido: boolean }[] = [];

      for (const t of pendingTopicos) {
        while (currentDate.getDay() === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        const dateStr = currentDate.toISOString().split("T")[0];
        newEvents.push({
          user_id: userId,
          topico_id: t.id,
          data: dateStr,
          horas_dia: Math.min(t.horas_estimadas, horasDia),
          is_revisao: false,
          concluido: false,
        });
        hoursLeft -= t.horas_estimadas;
        if (hoursLeft <= 0) {
          currentDate.setDate(currentDate.getDate() + 1);
          hoursLeft = horasDia;
        }
      }

      if (newEvents.length > 0) {
        const { error } = await supabase.from("user_calendar_events").insert(newEvents);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", cronogramaId] });
      toast.success("Calendário calculado!");
    },
  });

  const moveEvent = useMutation({
    mutationFn: async ({ eventId, newDate }: { eventId: number; newDate: string }) => {
      const { error } = await supabase.from("user_calendar_events").update({ data: newDate }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar-events", cronogramaId] }),
  });

  const handleDragStart = (eventId: number) => setDraggedEventId(eventId);
  const handleDrop = (dayStr: string) => {
    if (draggedEventId !== null) {
      moveEvent.mutate({ eventId: draggedEventId, newDate: dayStr });
      setDraggedEventId(null);
    }
  };

  const getCellColor = useCallback((dayStr: string, dayEvents: CalendarEvent[]) => {
    const isToday = dayStr === todayStr;
    const hasRevisao = dayEvents.some(e => e.is_revisao && !e.concluido);
    const overdueDays = dayEvents.reduce((max, e) => {
      if (e.concluido) return max;
      const diff = Math.floor((today.getTime() - new Date(e.data + "T23:59:59").getTime()) / 86400000);
      return Math.max(max, diff);
    }, 0);

    let bg = "bg-card/50";
    let border = "border-border/30";

    if (hasRevisao) { bg = "bg-blue-500/5"; border = "border-blue-500/40"; }
    if (overdueDays >= 4) { bg = "bg-red-500/5"; border = "border-red-500/40"; }
    else if (overdueDays >= 1) { bg = "bg-amber-500/5"; border = "border-amber-500/40"; }
    if (isToday) border = "border-primary border-2";

    return `${bg} ${border}`;
  }, [todayStr]);

  // --- Timer functions ---
  const startTimer = () => {
    setRunning(true);
    setPaused(false);
    intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
  };

  const pauseTimer = () => {
    setPaused(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resumeTimer = () => {
    setPaused(false);
    intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
  };

  const stopTimer = () => {
    setRunning(false);
    setPaused(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const perEvent = Math.floor(elapsed / Math.max(todayEvents.length, 1));
    const updated: typeof sessionData = {};
    todayEvents.forEach(ev => {
      updated[ev.id] = {
        tempo: formatTime(perEvent),
        questoes: sessionData[ev.id]?.questoes ?? 0,
        acertos: sessionData[ev.id]?.acertos ?? 0,
        concluir: sessionData[ev.id]?.concluir ?? false,
      };
    });
    setSessionData(updated);
    setShowModal(true);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const updateField = (evId: number, field: string, value: any) => {
    setSessionData(prev => ({ ...prev, [evId]: { ...prev[evId], [field]: value } }));
  };

  const saveSessions = useMutation({
    mutationFn: async () => {
      for (const ev of todayEvents) {
        const d = sessionData[ev.id];
        if (!d) continue;
        const pct = d.questoes > 0 ? Math.round(Math.min(d.acertos, d.questoes) / d.questoes * 100) : 0;

        await supabase.from("study_sessions").insert({
          user_id: userId,
          topico_id: ev.topico_id,
          tempo_estudado: d.tempo,
          questoes: d.questoes,
          acertos: d.acertos,
          percentual_acerto: d.questoes > 0 ? pct : 0,
          data: todayStr,
        });

        if (d.concluir) {
          await supabase.from("user_topico_progress").upsert({
            user_id: userId,
            topico_id: ev.topico_id,
            concluido: true,
          }, { onConflict: "user_id,topico_id" });
          await supabase.from("user_calendar_events").update({ concluido: true }).eq("id", ev.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", cronogramaId] });
      queryClient.invalidateQueries({ queryKey: ["user-progress", cronogramaId] });
      queryClient.invalidateQueries({ queryKey: ["study-sessions", cronogramaId] });
      setShowModal(false);
      setElapsed(0);
      setSessionData({});
      toast.success("Sessão salva com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar sessão"),
  });

  // Popup status helper
  function getEventStatus(ev: CalendarEvent) {
    if (ev.concluido) return { label: "✓ Concluído", color: "text-green-400" };
    const diff = Math.floor((today.getTime() - new Date(ev.data + "T23:59:59").getTime()) / 86400000);
    if (diff >= 4) return { label: "Atrasado", color: "text-[#E24B4A]" };
    if (diff >= 1) return { label: "Atrasado", color: "text-[#EF9F27]" };
    return { label: "Pendente", color: "text-muted-foreground" };
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-4">
      {/* Timer Section */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-5">
          <p className="text-sm text-foreground font-medium capitalize">{dayLabel}</p>
          {todayEvents.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {todayEvents.map(ev => {
                const t = topicoMap.get(ev.topico_id);
                return (
                  <Badge key={ev.id} variant="outline" className="text-[10px]">
                    {ev.is_revisao ? "Rev: " : ""}{t?.materia || "?"}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Nenhuma matéria programada para hoje</p>
          )}

          <div className="mt-4 flex items-center gap-4">
            {!running ? (
              <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={startTimer} disabled={todayEvents.length === 0}>
                <Play className="h-4 w-4" /> Iniciar estudos!
              </Button>
            ) : (
              <>
                <div className={`text-3xl font-mono font-bold tabular-nums ${paused ? "text-amber-400" : "text-green-400"}`} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatTime(elapsed)}
                </div>
                {paused ? (
                  <Button variant="outline" className="gap-1 border-amber-500/50 text-amber-400" onClick={resumeTimer}>
                    <Play className="h-3.5 w-3.5" /> Continuar
                  </Button>
                ) : (
                  <Button variant="outline" className="gap-1" onClick={pauseTimer}>
                    <Pause className="h-3.5 w-3.5" /> Pausar
                  </Button>
                )}
                <Button variant="outline" className="gap-1 border-red-500/50 text-red-400" onClick={stopTimer}>
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Deslocar tudo:</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => shiftEvents.mutate(-7)}>−7d</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => shiftEvents.mutate(-1)}>−1d</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => shiftEvents.mutate(1)}>+1d</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => shiftEvents.mutate(7)}>+7d</Button>
            </div>

            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={12} value={horasDia} onChange={e => setHorasDia(Number(e.target.value))} className="h-7 w-16 text-xs" />
              <span className="text-xs text-muted-foreground">h/dia</span>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => recalculate.mutate()}>
                <RotateCcw className="h-3 w-3" /> Calcular
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <div className="grid grid-cols-7">
          {dayNames.map(d => (
            <div key={d} className="p-2 text-center text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/30 bg-muted/20">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="min-h-[80px] border-b border-r border-border/20 bg-muted/5" />;

            const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDay[dayStr] || [];
            const cellColor = getCellColor(dayStr, dayEvents);

            return (
              <div
                key={i}
                className={`min-h-[80px] border-b border-r border-border/20 p-1 relative ${cellColor}`}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(dayStr)}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[11px] font-medium ${dayStr === todayStr ? "text-primary font-bold" : "text-foreground/70"}`}>{day}</span>
                  {dayEvents.length > 0 && (
                    <button
                      onClick={() => setPopupDay(popupDay === dayStr ? null : dayStr)}
                      className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {dayEvents.slice(0, 2).map(ev => {
                  const t = topicoMap.get(ev.topico_id);
                  const materia = t?.materia || "—";
                  const colorClass = ev.concluido
                    ? "bg-green-500/15 text-green-400 border border-green-500/30 line-through"
                    : ev.is_revisao
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : `border ${getMateriaColor(materia)}`;
                  return (
                    <div
                      key={ev.id}
                      draggable={!ev.concluido}
                      onDragStart={() => handleDragStart(ev.id)}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full mb-0.5 truncate cursor-move font-medium ${colorClass}`}
                    >
                      {ev.is_revisao ? "Rev: " : ""}{materia}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 2}</span>
                )}

                {/* Popup */}
                {popupDay === dayStr && dayEvents.length > 0 && (
                  <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg p-3 space-y-2" style={{ maxHeight: 300, overflowY: "auto" }}>
                    {dayEvents.map(ev => {
                      const t = topicoMap.get(ev.topico_id);
                      const status = getEventStatus(ev);
                      return (
                        <div key={ev.id} className="p-2 rounded-lg bg-muted/30 border border-border/30">
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 mb-1 ${getMateriaColor(t?.materia || "")}`}>{t?.materia || "?"}</Badge>
                          <p className="text-[11px] text-foreground/80">{t?.assunto || "—"}</p>
                          <p className="text-[9px] text-muted-foreground">{t?.fonte_legal || ""}</p>
                          {(t?.link_questoes || t?.link_dod) && (
                            <div className="flex gap-2 mt-1">
                              {t?.link_questoes && <a href={t.link_questoes} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary">Questões</a>}
                              {t?.link_dod && <a href={t.link_dod} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary">DOD</a>}
                            </div>
                          )}
                          <p className={`text-[9px] mt-1 font-semibold ${status.color}`}>
                            {status.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar sessão de estudo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {todayEvents.map(ev => {
              const t = topicoMap.get(ev.topico_id);
              const d = sessionData[ev.id];
              if (!d) return null;
              const pct = d.questoes > 0 ? Math.round(Math.min(d.acertos, d.questoes) / d.questoes * 100) : null;

              return (
                <Card key={ev.id} className="border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{t?.materia || "?"}</Badge>
                      <span className="text-xs text-foreground/80">{t?.assunto || ""}</span>
                    </div>
                    {t?.fonte_legal && <p className="text-[10px] text-muted-foreground">{t.fonte_legal}</p>}

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Tempo</label>
                        <Input value={d.tempo} onChange={e => updateField(ev.id, "tempo", e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Questões</label>
                        <Input type="number" min={0} value={d.questoes} onChange={e => updateField(ev.id, "questoes", Number(e.target.value))} className="h-7 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Acertos</label>
                        <Input type="number" min={0} value={d.acertos} onChange={e => updateField(ev.id, "acertos", Number(e.target.value))} className="h-7 text-xs" />
                      </div>
                    </div>

                    {pct !== null && (
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">Percentual</span>
                          <span className="font-semibold text-foreground">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${getPercentColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Switch checked={d.concluir} onCheckedChange={v => updateField(ev.id, "concluir", v)} />
                      <span className="text-xs text-foreground/80">Marcar como concluída</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setElapsed(0); }}>Descartar</Button>
              <Button className="flex-1" onClick={() => saveSessions.mutate()} disabled={saveSessions.isPending}>
                {saveSessions.isPending ? "Salvando..." : "Salvar sessão"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
