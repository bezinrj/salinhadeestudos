import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, RotateCcw, Info } from "lucide-react";
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

function isSameDay(d1: string, d2: string) {
  return d1 === d2;
}

export default function CronogramaCalendar({ cronogramaId, userId, events, topicos }: Props) {
  const queryClient = useQueryClient();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [horasDia, setHorasDia] = useState(3);
  const [popupDay, setPopupDay] = useState<string | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<number | null>(null);

  const topicoMap = useMemo(() => new Map(topicos.map(t => [t.id, t])), [topicos]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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

      // Get pending topicos
      const completedTopicoIds = new Set(events.filter(e => e.concluido).map(e => e.topico_id));
      const pendingTopicos = topicos.filter(t => !completedTopicoIds.has(t.id));

      // Distribute starting from first day of current view month
      let currentDate = new Date(viewYear, viewMonth, 1);
      let hoursLeft = horasDia;
      const newEvents: { user_id: string; topico_id: number; data: string; horas_dia: number; is_revisao: boolean; concluido: boolean }[] = [];

      for (const t of pendingTopicos) {
        // Skip sundays
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
      toast.success("Calendário recalculado!");
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
    const hasOverdue = dayEvents.some(e => {
      if (e.concluido) return false;
      const diff = Math.floor((today.getTime() - new Date(e.data + "T23:59:59").getTime()) / 86400000);
      return diff > 0;
    });
    const overdueDays = dayEvents.reduce((max, e) => {
      if (e.concluido) return max;
      const diff = Math.floor((today.getTime() - new Date(e.data + "T23:59:59").getTime()) / 86400000);
      return Math.max(max, diff);
    }, 0);

    let bg = "bg-card/50";
    let border = "border-border/30";

    if (hasRevisao) { bg = "bg-blue-500/5"; border = "border-blue-500/40"; }
    if (hasOverdue && overdueDays >= 4) { bg = "bg-red-500/5"; border = "border-red-500/40"; }
    else if (hasOverdue && overdueDays >= 1) { bg = "bg-amber-500/5"; border = "border-amber-500/40"; }
    if (isToday) border = "border-primary border-2";

    return `${bg} ${border}`;
  }, [todayStr]);

  // Day names
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-4">
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
                <RotateCcw className="h-3 w-3" /> Recalcular
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
                  return (
                    <div
                      key={ev.id}
                      draggable={!ev.concluido}
                      onDragStart={() => handleDragStart(ev.id)}
                      className={`text-[9px] px-1 py-0.5 rounded mb-0.5 truncate cursor-move ${
                        ev.is_revisao
                          ? "bg-blue-500/15 text-blue-400"
                          : ev.concluido
                          ? "bg-green-500/10 text-green-400 line-through"
                          : "bg-muted/50 text-foreground/70"
                      }`}
                    >
                      {ev.is_revisao ? "Rev: " : ""}{t?.materia || "—"}
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
                      return (
                        <div key={ev.id} className="p-2 rounded-lg bg-muted/30 border border-border/30">
                          <Badge variant="outline" className="text-[9px] px-1 py-0 mb-1">{t?.materia || "?"}</Badge>
                          <p className="text-[11px] text-foreground/80">{t?.assunto || "—"}</p>
                          <p className="text-[9px] text-muted-foreground">{t?.fonte_legal || ""}</p>
                          {(t?.link_questoes || t?.link_dod) && (
                            <div className="flex gap-2 mt-1">
                              {t?.link_questoes && <a href={t.link_questoes} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary">Questões</a>}
                              {t?.link_dod && <a href={t.link_dod} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary">DOD</a>}
                            </div>
                          )}
                          <p className={`text-[9px] mt-1 font-semibold ${ev.concluido ? "text-green-400" : "text-amber-400"}`}>
                            {ev.concluido ? "✓ Concluído" : "Pendente"}
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
    </div>
  );
}
