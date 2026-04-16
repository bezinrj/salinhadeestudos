import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import type { TopicoMatriz } from "./MatrizTable";

type StudySession = {
  id: number;
  topico_id: number;
  tempo_estudado: string | null;
  questoes: number;
  acertos: number;
  percentual_acerto: number;
  data: string;
};

interface Props {
  cronogramaId: string;
  userId: string;
  sessions: StudySession[];
  topicos: TopicoMatriz[];
}

function getBarColor(pct: number) {
  if (pct < 50) return "bg-red-500";
  if (pct < 60) return "bg-orange-500";
  if (pct < 80) return "bg-green-500";
  return "bg-green-700";
}

function getNextBusinessDay() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function CronogramaPerformance({ cronogramaId, userId, sessions, topicos }: Props) {
  const queryClient = useQueryClient();
  const topicoMap = useMemo(() => new Map(topicos.map(t => [t.id, t])), [topicos]);

  // Avg per topico for this user
  const userAvgs = useMemo(() => {
    const map: Record<number, number[]> = {};
    sessions.forEach(s => {
      if (s.questoes > 0) {
        if (!map[s.topico_id]) map[s.topico_id] = [];
        map[s.topico_id].push(s.percentual_acerto);
      }
    });
    const result: Record<number, number> = {};
    Object.entries(map).forEach(([id, vals]) => {
      result[Number(id)] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    });
    return result;
  }, [sessions]);

  // Global averages
  const { data: globalAvgs = {} } = useQuery({
    queryKey: ["global-avgs", cronogramaId],
    queryFn: async () => {
      const topicoIds = topicos.map(t => t.id);
      if (topicoIds.length === 0) return {};
      const { data } = await supabase
        .from("study_sessions")
        .select("topico_id, percentual_acerto")
        .in("topico_id", topicoIds);
      if (!data) return {};
      const map: Record<number, number[]> = {};
      data.forEach((s: any) => {
        if (s.percentual_acerto > 0) {
          if (!map[s.topico_id]) map[s.topico_id] = [];
          map[s.topico_id].push(s.percentual_acerto);
        }
      });
      const result: Record<number, number> = {};
      Object.entries(map).forEach(([id, vals]) => {
        result[Number(id)] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      });
      return result;
    },
  });

  const weakTopicos = useMemo(() => {
    return Object.entries(userAvgs)
      .filter(([_, avg]) => avg < 60)
      .map(([id]) => Number(id))
      .filter(id => topicoMap.has(id));
  }, [userAvgs, topicoMap]);

  const addRevision = useMutation({
    mutationFn: async (topicoId: number) => {
      const { error } = await supabase.from("user_calendar_events").insert({
        user_id: userId,
        topico_id: topicoId,
        data: getNextBusinessDay(),
        is_revisao: true,
        concluido: false,
        horas_dia: 3,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", cronogramaId] });
      toast.success("Revisão adicionada ao calendário!");
    },
  });

  // Recent sessions
  const recentSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 20);
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Weak subjects */}
      {weakTopicos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Matérias abaixo de 60%</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {weakTopicos.map(id => {
              const t = topicoMap.get(id)!;
              const myPct = userAvgs[id] || 0;
              const globalPct = globalAvgs[id] || 0;
              const diff = myPct - globalPct;

              return (
                <Card key={id} className="border-border/50 bg-card/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="text-[10px]">{t.materia}</Badge>
                        <p className="text-xs text-foreground/80 mt-0.5">{t.assunto || "—"}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => addRevision.mutate(id)}
                      >
                        <BookmarkPlus className="h-3 w-3" /> Revisão
                      </Button>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">Meu desempenho</span>
                        <span className="font-semibold">{myPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${getBarColor(myPct)}`} style={{ width: `${myPct}%`, transition: "width 0.4s" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">Média dos alunos</span>
                        <span className="font-semibold">{globalPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${globalPct}%`, transition: "width 0.4s" }} />
                      </div>
                    </div>

                    <p className={`text-[10px] font-semibold ${diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {diff >= 0 ? "+" : ""}{diff}% vs média
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Session history */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Histórico de sessões</h3>
        {recentSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma sessão registrada ainda.</p>
        ) : (
          <div className="space-y-1.5">
            {recentSessions.map(s => {
              const t = topicoMap.get(s.topico_id);
              return (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">{t?.materia || "?"}</Badge>
                    <span className="text-[11px] text-muted-foreground">{s.data}</span>
                    <span className="text-[11px] text-foreground/70">{s.tempo_estudado}</span>
                  </div>
                  {s.questoes > 0 && (
                    <Badge
                      className={`text-[9px] px-1.5 py-0 border-0 ${
                        s.percentual_acerto >= 80 ? "bg-green-700/30 text-green-400"
                        : s.percentual_acerto >= 60 ? "bg-green-500/20 text-green-400"
                        : s.percentual_acerto >= 50 ? "bg-orange-500/20 text-orange-400"
                        : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {s.percentual_acerto}%
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
