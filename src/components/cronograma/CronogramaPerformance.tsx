import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, RotateCcw } from "lucide-react";
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
  if (pct < 50) return "#dc2626";
  if (pct < 60) return "#ea580c";
  if (pct < 80) return "#16a34a";
  return "#15803d";
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

export default function CronogramaPerformance({ cronogramaId, userId, sessions, topicos }: Props) {
  const queryClient = useQueryClient();
  const topicoMap = useMemo(() => new Map(topicos.map(t => [t.id, t])), [topicos]);

  // Fetch revision calendar events for this user
  const { data: revisionEvents = [] } = useQuery({
    queryKey: ["revision-events", cronogramaId, userId],
    queryFn: async () => {
      const topicoIds = topicos.map(t => t.id);
      if (topicoIds.length === 0) return [];
      const { data } = await supabase
        .from("user_calendar_events")
        .select("*")
        .eq("user_id", userId)
        .eq("is_revisao", true)
        .in("topico_id", topicoIds);
      return (data || []) as { id: number; topico_id: number; concluido: boolean; data: string }[];
    },
  });

  // User averages per topic
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

  // Topics with pending revision (is_revisao=true, concluido=false)
  const pendingRevisionTopicos = useMemo(() => {
    const set = new Set<number>();
    revisionEvents.forEach(ev => {
      if (!ev.concluido) set.add(ev.topico_id);
    });
    return set;
  }, [revisionEvents]);

  // Topics with at least one completed revision
  const completedRevisionTopicos = useMemo(() => {
    const set = new Set<number>();
    revisionEvents.forEach(ev => {
      if (ev.concluido) set.add(ev.topico_id);
    });
    return set;
  }, [revisionEvents]);

  // Weak topics: avg < 60% AND no pending revision
  const weakTopicos = useMemo(() => {
    return Object.entries(userAvgs)
      .filter(([id, avg]) => avg < 60 && !pendingRevisionTopicos.has(Number(id)))
      .map(([id]) => Number(id))
      .filter(id => topicoMap.has(id));
  }, [userAvgs, pendingRevisionTopicos, topicoMap]);

  // Revision history: topics with completed revision events
  const revisionHistory = useMemo(() => {
    const items: { topicoId: number; worst: number; best: number; lastDate: string; currentAvg: number }[] = [];
    completedRevisionTopicos.forEach(topicoId => {
      const topicSessions = sessions.filter(s => s.topico_id === topicoId && s.questoes > 0);
      if (topicSessions.length === 0) return;
      const pcts = topicSessions.map(s => s.percentual_acerto);
      const worst = Math.min(...pcts);
      const best = Math.max(...pcts);
      const completedRevs = revisionEvents
        .filter(ev => ev.topico_id === topicoId && ev.concluido)
        .sort((a, b) => b.data.localeCompare(a.data));
      const lastDate = completedRevs[0]?.data || topicSessions.sort((a, b) => b.data.localeCompare(a.data))[0]?.data || "";
      const avg = userAvgs[topicoId] || 0;
      items.push({ topicoId, worst, best, lastDate, currentAvg: avg });
    });
    return items.sort((a, b) => a.currentAvg - b.currentAvg);
  }, [completedRevisionTopicos, sessions, revisionEvents, userAvgs]);

  // Add revision mutation
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
      queryClient.invalidateQueries({ queryKey: ["revision-events", cronogramaId, userId] });
      toast.success("Revisão agendada no calendário!");
    },
  });

  return (
    <div className="space-y-6">
      {/* Weak subjects panel */}
      {weakTopicos.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
            Matérias abaixo de 60%
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {weakTopicos.map(id => {
              const t = topicoMap.get(id)!;
              const myPct = userAvgs[id] || 0;
              const globalPct = globalAvgs[id] || 0;
              const diff = myPct - globalPct;

              return (
                <div
                  key={id}
                  style={{
                    backgroundColor: "var(--card-bg, #ffffff)",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 14,
                  }}
                  className="dark:!bg-[#1e1e2e] dark:!border-[#374151]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[11px] font-medium rounded-full px-2.5 py-0.5"
                      style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
                    >
                      {t.materia}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1 px-2"
                      style={{ color: "#374151" }}
                      onClick={() => addRevision.mutate(id)}
                    >
                      <BookmarkPlus className="h-3 w-3" /> Revisão
                    </Button>
                  </div>

                  <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 8 }} className="dark:!text-[#e5e7eb]">
                    {t.assunto || "—"}
                  </p>

                  {/* My performance bar */}
                  <div className="mb-1.5">
                    <div className="flex justify-between" style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
                      <span>Meu desempenho</span>
                      <span style={{ fontWeight: 600, color: getBarColor(myPct) }}>{myPct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, backgroundColor: "#e5e7eb", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${myPct}%`, backgroundColor: getBarColor(myPct), transition: "width 0.4s" }} />
                    </div>
                  </div>

                  {/* Global avg bar */}
                  <div className="mb-1.5">
                    <div className="flex justify-between" style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
                      <span>Média dos alunos</span>
                      <span style={{ fontWeight: 600 }}>{globalPct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, backgroundColor: "#e5e7eb", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${globalPct}%`, backgroundColor: "#d1d5db", transition: "width 0.4s" }} />
                    </div>
                  </div>

                  <p style={{ fontSize: 11, fontWeight: 600, color: diff >= 0 ? "#16a34a" : "#dc2626" }}>
                    {diff >= 0 ? "+" : ""}{diff}% vs média
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revision history */}
      {revisionHistory.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 12 }} className="dark:!text-[#e5e7eb]">
            Histórico de Revisões
          </h3>
          <div className="space-y-1.5">
            {revisionHistory.map(item => {
              const t = topicoMap.get(item.topicoId);
              if (!t) return null;
              const needsReview = item.currentAvg < 60;

              return (
                <div
                  key={item.topicoId}
                  className="flex items-center justify-between p-3 rounded-lg dark:!bg-[#1e1e2e] dark:!border-[#374151]"
                  style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                >
                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }} className="dark:!text-[#e5e7eb]">
                      {t.materia} — {t.assunto || "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      Pior: <span style={{ fontWeight: 600, color: "#E24B4A" }}>{item.worst}%</span>
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      Melhor: <span style={{ fontWeight: 600, color: "#1D9E75" }}>{item.best}%</span>
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      {item.lastDate ? formatDateBR(item.lastDate) : "—"}
                    </span>

                    {needsReview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2"
                        style={{ color: "#374151" }}
                        onClick={() => addRevision.mutate(item.topicoId)}
                      >
                        <RotateCcw className="h-3 w-3" /> Revisar novamente
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {weakTopicos.length === 0 && revisionHistory.length === 0 && (
        <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", padding: "32px 0" }}>
          Nenhum dado de desempenho registrado ainda.
        </p>
      )}
    </div>
  );
}
