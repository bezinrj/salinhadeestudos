import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, RotateCcw, Info, Play, Pause, Square, X, AlertTriangle, Trash2 } from "lucide-react";
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

function getMateriaColor(topico: TopicoMatriz): string {
  if (topico.cor) return topico.cor;
  return COLOR_PALETTE[hashString(topico.materia) % COLOR_PALETTE.length];
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
  const [detailDay, setDetailDay] = useState<string | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Timer state
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const topicoMap = useMemo(() => new Map(topicos.map(t => [t.id, t])), [topicos]);

  const colorMap = useMemo(() => {
    const m = new Map<number, string>();
    topicos.forEach(t => m.set(t.id, getMateriaColor(t)));
    return m;
  }, [topicos]);

  useEffect(() => {
    const toUpdate = topicos.filter(t => !t.cor);
    if (toUpdate.length === 0) return;
    toUpdate.forEach(t => {
      const color = COLOR_PALETTE[hashString(t.materia) % COLOR_PALETTE.length];
      supabase.from("cronograma_matriz").update({ cor: color }).eq("id", t.id).then(() => {});
    });
    queryClient.invalidateQueries({ queryKey: ["cronograma-matriz", cronogramaId] });
  }, [topicos]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dayLabel = `${WEEKDAYS[today.getDay()]}, ${today.getDate()} de ${MONTHS_LABEL[today.getMonth()]}`;

  const todayEvents = useMemo(() => events.filter(e => e.data === todayStr && !e.concluido), [events, todayStr]);

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

  const legendItems = useMemo(() => {
    const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const monthEvents = events.filter(e => e.data.startsWith(monthPrefix));
    const materiaSet = new Map<string, string>();
    let hasRevisao = false;
    let hasAtrasado1 = false;
    let hasAtrasado4 = false;

    monthEvents.forEach(e => {
      const t = topicoMap.get(e.topico_id);
      if (t) materiaSet.set(t.materia, colorMap.get(t.id) || "#888");
      if (e.is_revisao && !e.concluido) hasRevisao = true;
      if (!e.concluido) {
        const diff = Math.floor((today.getTime() - new Date(e.data + "T23:59:59").getTime()) / 86400000);
        if (diff >= 4) hasAtrasado4 = true;
        else if (diff >= 1) hasAtrasado1 = true;
      }
    });

    const items: { label: string; color: string }[] = [];
    materiaSet.forEach((color, name) => items.push({ label: name, color }));
    if (hasRevisao) items.push({ label: "Revisão", color: "#378ADD" });
    if (hasAtrasado1) items.push({ label: "Atrasado +1 dia", color: "#EF9F27" });
    if (hasAtrasado4) items.push({ label: "Atrasado +4 dias", color: "#E24B4A" });
    return items;
  }, [events, viewYear, viewMonth, topicoMap, colorMap]);

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
      const toDelete = events.filter(e => !e.concluido && !e.is_revisao);
      for (const e of toDelete) {
        await supabase.from("user_calendar_events").delete().eq("id", e.id);
      }

      const completedTopicoIds = new Set(events.filter(e => e.concluido).map(e => e.topico_id));
      const pendingTopicos = topicos.filter(t => !completedTopicoIds.has(t.id));

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

  const handleDragStart = (eventId: number, ev: CalendarEvent) => {
    if (ev.concluido) return;
    setDraggedEventId(eventId);
  };
  const handleDrop = (dayStr: string) => {
    if (draggedEventId !== null) {
      moveEvent.mutate({ eventId: draggedEventId, newDate: dayStr });
      setDraggedEventId(null);
      setDropTarget(null);
    }
  };

  // Timer functions
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

  function getEventStatus(ev: CalendarEvent) {
    if (ev.concluido) return { label: "✓ Concluído", color: "#1D9E75" };
    const diff = Math.floor((today.getTime() - new Date(ev.data + "T23:59:59").getTime()) / 86400000);
    if (diff >= 4) return { label: `Atrasado ${diff} dias`, color: "#E24B4A" };
    if (diff >= 1) return { label: `Atrasado ${diff} dia${diff > 1 ? "s" : ""}`, color: "#EF9F27" };
    return { label: "Pendente", color: "#9CA3AF" };
  }

  // Compute cell background/border based on events delay status
  function getCellStyle(dayEvents: CalendarEvent[]): { bg: string; border: string } | null {
    if (dayEvents.length === 0) return null;
    const allDone = dayEvents.every(e => e.concluido);
    if (allDone) return null;

    const pendingEvents = dayEvents.filter(e => !e.concluido);
    let maxDelay = 0;
    let hasRevisao = false;

    for (const ev of pendingEvents) {
      if (ev.is_revisao) hasRevisao = true;
      const diff = Math.floor((today.getTime() - new Date(ev.data + "T23:59:59").getTime()) / 86400000);
      if (diff > maxDelay) maxDelay = diff;
    }

    if (maxDelay >= 4) return { bg: "#FFF0F0", border: "#E24B4A" };
    if (maxDelay >= 1) return { bg: "#FFFBEA", border: "#EF9F27" };
    if (hasRevisao) return { bg: "#EFF6FF", border: "#378ADD" };
    return null;
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const detailEvents = detailDay ? (eventsByDay[detailDay] || []) : [];
  const detailDate = detailDay ? new Date(detailDay + "T12:00:00") : null;
  const detailDateLabel = detailDate
    ? `${WEEKDAYS[detailDate.getDay()]}, ${detailDate.getDate()} de ${MONTHS_LABEL[detailDate.getMonth()]} de ${detailDate.getFullYear()}`
    : "";

  const draggedColor = useMemo(() => {
    if (!draggedEventId) return null;
    const ev = events.find(e => e.id === draggedEventId);
    if (!ev) return null;
    return colorMap.get(ev.topico_id) || "#888";
  }, [draggedEventId, events, colorMap]);

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
                const color = colorMap.get(ev.topico_id) || "#888";
                return (
                  <span
                    key={ev.id}
                    className="text-[10px] font-medium text-white rounded-full px-2.5 py-0.5"
                    style={{ backgroundColor: color }}
                  >
                    {ev.is_revisao ? "Rev: " : ""}{t?.materia || "?"}
                  </span>
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
                <div className={`text-3xl font-mono font-bold ${paused ? "text-amber-400" : "text-green-400"}`} style={{ fontVariantNumeric: "tabular-nums" }}>
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

      {/* Legend */}
      {legendItems.length > 0 && (
        <div className="flex flex-wrap gap-3 px-1">
          {legendItems.map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-foreground/70">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="rounded-xl border border-[#e5e7eb] dark:border-border/50 overflow-hidden bg-white dark:bg-card/30">
        <div className="grid grid-cols-7">
          {dayNames.map(d => (
            <div key={d} className="p-2 text-center text-[11px] font-semibold uppercase border-b border-[#e5e7eb] dark:border-border/30 bg-gray-50 dark:bg-muted/20" style={{ color: "#6B7280" }}>
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="min-h-[80px] border-b border-r border-[#e5e7eb] dark:border-border/20 bg-gray-50/50 dark:bg-muted/5" />;

            const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDay[dayStr] || [];
            const isToday = dayStr === todayStr;
            const isDropTarget = dropTarget === dayStr && draggedEventId !== null;
            const cellStyle = getCellStyle(dayEvents);

            // Build inline styles for the cell
            let cellInline: React.CSSProperties = {};
            if (isDropTarget && draggedColor) {
              cellInline = { borderColor: draggedColor, borderWidth: 2, backgroundColor: `${draggedColor}10` };
            } else if (cellStyle) {
              cellInline = { backgroundColor: cellStyle.bg, borderColor: cellStyle.border, borderWidth: "1px", borderStyle: "solid" };
            }

            return (
              <div
                key={i}
                className={`min-h-[80px] border-b border-r border-[#e5e7eb] dark:border-border/20 p-1.5 transition-all duration-200 ${
                  !cellStyle && !isDropTarget ? "bg-white dark:bg-card/30" : ""
                }`}
                style={cellInline}
                onDragOver={e => { e.preventDefault(); setDropTarget(dayStr); }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={() => handleDrop(dayStr)}
              >
                <div className="flex items-center justify-between mb-1">
                  {isToday ? (
                    <span
                      className="text-[12px] font-semibold text-white flex items-center justify-center rounded-full"
                      style={{ backgroundColor: "#1D9E75", width: 24, height: 24 }}
                    >
                      {day}
                    </span>
                  ) : (
                    <span className="text-[12px] font-medium text-[#374151] dark:text-[#e5e7eb]">
                      {day}
                    </span>
                  )}
                  {dayEvents.length > 0 && (
                    <button
                      onClick={() => setDetailDay(dayStr)}
                      className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {dayEvents.map(ev => {
                  const t = topicoMap.get(ev.topico_id);
                  const materia = t?.materia || "—";
                  const color = colorMap.get(ev.topico_id) || "#888";

                  let pillBg = color;
                  let extraClass = "";

                  if (ev.concluido) {
                    pillBg = "#9CA3AF";
                    extraClass = "line-through opacity-60";
                  } else if (ev.is_revisao) {
                    pillBg = "#6B7280";
                  }

                  return (
                    <div
                      key={ev.id}
                      draggable={!ev.concluido}
                      onDragStart={() => handleDragStart(ev.id, ev)}
                      className={`text-[11px] px-2 py-[2px] rounded-full mb-[3px] font-medium text-white transition-all duration-200 ${
                        ev.concluido ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                      } ${extraClass}`}
                      style={{
                        backgroundColor: pillBg,
                        opacity: draggedEventId === ev.id ? 0.5 : undefined,
                      }}
                    >
                      {ev.is_revisao ? "Rev: " : ""}{materia}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {detailDay && detailEvents.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDetailDay(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative rounded-xl shadow-2xl w-[420px] max-h-[80vh] overflow-y-auto p-6 bg-white dark:bg-[#1e1e2e]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="capitalize" style={{ color: "#111827", fontSize: 15, fontWeight: 500 }}>{detailDateLabel}</h3>
              <button onClick={() => setDetailDay(null)} className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity" style={{ backgroundColor: "#e5e7eb" }}>
                <X className="h-4 w-4" style={{ color: "#374151" }} />
              </button>
            </div>
            <div className="space-y-3">
              {detailEvents.map(ev => {
                const t = topicoMap.get(ev.topico_id);
                const color = colorMap.get(ev.topico_id) || "#888";
                const status = getEventStatus(ev);
                const fontes: { sigla: string; descricao: string; link_questoes: string; link_dod: string }[] =
                  Array.isArray(t?.fontes) && (t?.fontes as any[]).length > 0
                    ? (t.fontes as any[])
                    : [];
                const hasMultipleFontes = fontes.length > 0;

                return (
                  <div key={ev.id} className="p-3 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                    <span
                      className="inline-block text-[10px] font-medium text-white rounded-full px-2.5 py-0.5 mb-1.5"
                      style={{ backgroundColor: ev.concluido ? "#9CA3AF" : ev.is_revisao ? "#6B7280" : color }}
                    >
                      {ev.is_revisao ? "Rev: " : ""}{t?.materia || "?"}
                    </span>
                    <p style={{ color: "#111827", fontSize: 13, fontWeight: 500 }}>{t?.assunto || "—"}</p>

                    {hasMultipleFontes ? (
                      <div style={{ marginTop: 6 }}>
                        {fontes.map((f, idx) => (
                          <div key={idx} style={{ paddingBottom: 6, marginBottom: 6, borderBottom: idx < fontes.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                            <p style={{ fontSize: 12 }}>
                              <span style={{ fontWeight: 600, color: "#111827" }}>{f.sigla}</span>
                              {f.descricao && <span style={{ color: "#6b7280", marginLeft: 4 }}>({f.descricao})</span>}
                            </p>
                            {(f.link_questoes || f.link_dod) && (
                              <div className="flex gap-3" style={{ marginTop: 2, paddingLeft: 2 }}>
                                {f.link_questoes && <a href={f.link_questoes} target="_blank" rel="noopener noreferrer" style={{ color: "#378ADD", fontSize: 11 }} className="hover:underline">Questões ↗</a>}
                                {f.link_dod && <a href={f.link_dod} target="_blank" rel="noopener noreferrer" style={{ color: "#378ADD", fontSize: 11 }} className="hover:underline">DOD ↗</a>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {t?.fonte_legal && <p style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{t.fonte_legal}</p>}
                        {(t?.link_questoes || t?.link_dod) && (
                          <div className="flex gap-3 mt-1.5">
                            {t?.link_questoes && <a href={t.link_questoes} target="_blank" rel="noopener noreferrer" style={{ color: "#378ADD", fontSize: 11 }} className="hover:underline">Questões ↗</a>}
                            {t?.link_dod && <a href={t.link_dod} target="_blank" rel="noopener noreferrer" style={{ color: "#378ADD", fontSize: 11 }} className="hover:underline">DOD ↗</a>}
                          </div>
                        )}
                      </>
                    )}

                    <p style={{ color: status.color, fontSize: 12, fontWeight: 500, marginTop: 6 }}>
                      {status.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Session Modal - improved legibility */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowModal(false); setElapsed(0); }}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto p-6 bg-white dark:bg-[#1e1e2e]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 16, fontWeight: 500, color: "#111827" }}>Registrar sessão de estudo</h3>
              <button onClick={() => { setShowModal(false); setElapsed(0); }} className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity" style={{ backgroundColor: "#e5e7eb" }}>
                <X className="h-4 w-4" style={{ color: "#9ca3af" }} />
              </button>
            </div>
            <div className="space-y-4">
              {todayEvents.map(ev => {
                const t = topicoMap.get(ev.topico_id);
                const color = colorMap.get(ev.topico_id) || "#888";
                const d = sessionData[ev.id];
                if (!d) return null;
                const pct = d.questoes > 0 ? Math.round(Math.min(d.acertos, d.questoes) / d.questoes * 100) : null;

                return (
                  <div key={ev.id} className="p-4 rounded-lg space-y-3 bg-[#f9fafb] dark:bg-[#2a2a3e] border border-[#e5e7eb] dark:border-[#3a3a4e]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium rounded-full px-2.5 py-0.5" style={{ backgroundColor: "#f3f4f6", color: "#374151" }}>
                        {t?.materia || "?"}
                      </span>
                      <span style={{ color: "#374151", fontSize: "13px" }}>{t?.assunto || ""}</span>
                    </div>
                    {t?.fonte_legal && <p style={{ color: "#6b7280", fontSize: "11px" }}>{t.fonte_legal}</p>}

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label style={{ color: "#6b7280", fontSize: "12px", display: "block", marginBottom: 4 }}>Tempo</label>
                        <input
                          value={d.tempo}
                          onChange={e => updateField(ev.id, "tempo", e.target.value)}
                          className="w-full"
                          style={{ backgroundColor: "#ffffff", border: "1px solid #d1d5db", color: "#111827", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
                        />
                      </div>
                      <div>
                        <label style={{ color: "#6b7280", fontSize: "12px", display: "block", marginBottom: 4 }}>Questões</label>
                        <input
                          type="number"
                          min={0}
                          value={d.questoes}
                          onChange={e => updateField(ev.id, "questoes", Number(e.target.value))}
                          className="w-full"
                          style={{ backgroundColor: "#ffffff", border: "1px solid #d1d5db", color: "#111827", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
                        />
                      </div>
                      <div>
                        <label style={{ color: "#6b7280", fontSize: "12px", display: "block", marginBottom: 4 }}>Acertos</label>
                        <input
                          type="number"
                          min={0}
                          value={d.acertos}
                          onChange={e => updateField(ev.id, "acertos", Number(e.target.value))}
                          className="w-full"
                          style={{ backgroundColor: "#ffffff", border: "1px solid #d1d5db", color: "#111827", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
                        />
                      </div>
                    </div>

                    {pct !== null && (
                      <div>
                        <div className="flex justify-between" style={{ fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: "#6b7280" }}>Percentual</span>
                          <span style={{ color: "#111827", fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, backgroundColor: "#e5e7eb", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 999,
                              width: `${pct}%`,
                              transition: "width 0.3s",
                              backgroundColor: "#9ca3af",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Switch checked={d.concluir} onCheckedChange={v => updateField(ev.id, "concluir", v)} />
                      <span style={{ color: "#374151", fontSize: 13 }}>Marcar como concluída</span>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 rounded-lg font-medium text-sm transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
                  onClick={() => { setShowModal(false); setElapsed(0); }}
                >
                  Descartar
                </button>
                <button
                  className="flex-1 py-2 rounded-lg font-medium text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#1D9E75" }}
                  onClick={() => saveSessions.mutate()}
                  disabled={saveSessions.isPending}
                >
                  {saveSessions.isPending ? "Salvando..." : "Salvar sessão"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
