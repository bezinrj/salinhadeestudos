import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, Square } from "lucide-react";
import { toast } from "sonner";
import type { TopicoMatriz } from "./MatrizTable";
import type { CalendarEvent } from "./CronogramaCalendar";

interface Props {
  cronogramaId: string;
  userId: string;
  events: CalendarEvent[];
  topicos: TopicoMatriz[];
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
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export default function CronogramaTimer({ cronogramaId, userId, events, topicos }: Props) {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayLabel = `${WEEKDAYS[today.getDay()]}, ${today.getDate()} de ${MONTHS[today.getMonth()]}`;

  const topicoMap = useMemo(() => new Map(topicos.map(t => [t.id, t])), [topicos]);
  const todayEvents = useMemo(() => events.filter(e => e.data === todayStr && !e.concluido), [events, todayStr]);

  // Session data per event
  const [sessionData, setSessionData] = useState<Record<number, { tempo: string; questoes: number; acertos: number; concluir: boolean }>>({});

  useEffect(() => {
    if (todayEvents.length > 0 && Object.keys(sessionData).length === 0) {
      const totalTime = formatTime(elapsed);
      const perEvent = Math.floor(elapsed / todayEvents.length);
      const init: typeof sessionData = {};
      todayEvents.forEach(ev => {
        init[ev.id] = { tempo: formatTime(perEvent), questoes: 0, acertos: 0, concluir: false };
      });
      setSessionData(init);
    }
  }, [todayEvents]);

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
    // Update session data times
    const perEvent = Math.floor(elapsed / Math.max(todayEvents.length, 1));
    const updated = { ...sessionData };
    todayEvents.forEach(ev => {
      if (updated[ev.id]) updated[ev.id].tempo = formatTime(perEvent);
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

        // Insert study session
        await supabase.from("study_sessions").insert({
          user_id: userId,
          topico_id: ev.topico_id,
          tempo_estudado: d.tempo,
          questoes: d.questoes,
          acertos: d.acertos,
          percentual_acerto: d.questoes > 0 ? pct : 0,
          data: todayStr,
        });

        // Mark completed if toggled
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

  return (
    <div className="space-y-4">
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
