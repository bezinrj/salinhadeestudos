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

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

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

function getMateriaColor(t: TopicoMatriz): string {
  if (t.cor) return t.cor;
  return COLOR_PALETTE[hashString(t.materia) % COLOR_PALETTE.length];
}

function getPctPillStyle(pct: number) {
  if (pct >= 80) return { backgroundColor: "rgba(21,128,61,0.15)", color: "#15803d" };
  if (pct >= 60) return { backgroundColor: "rgba(34,197,94,0.15)", color: "#16a34a" };
  if (pct >= 50) return { backgroundColor: "rgba(239,159,39,0.15)", color: "#d97706" };
  return { backgroundColor: "rgba(226,75,74,0.15)", color: "#dc2626" };
}

export default function CronogramaPerformance({ cronogramaId, userId, sessions, topicos }: Props) {
  const queryClient = useQueryClient();
  const topicoMap = useMemo(() => new Map(topicos.map(t => [t.id, t])), [topicos]);

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

      {/* Session history - enhanced layout */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Histórico de sessões</h3>
        {recentSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma sessão registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map(s => {
              const t = topicoMap.get(s.topico_id);
              const color = t ? getMateriaColor(t) : "#888";
              return (
                <div key={s.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className="text-[10px] font-medium text-white rounded-full px-2.5 py-0.5 mt-0.5 whitespace-nowrap flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {t?.materia || "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{t?.assunto || "—"}</p>
                      {t?.fonte_legal && (
                        <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>{t.fonte_legal}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDateBR(s.data)}</span>
                    <span className="text-[11px] text-foreground/70 whitespace-nowrap">{s.tempo_estudado || "—"}</span>
                    {s.questoes > 0 ? (
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap"
                        style={getPctPillStyle(s.percentual_acerto)}
                      >
                        {s.percentual_acerto}%
                      </span>
                    ) : (
                      <span className="text-[10px] rounded-full px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: "rgba(107,114,128,0.15)", color: "#6b7280" }}>
                        sem questões
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
