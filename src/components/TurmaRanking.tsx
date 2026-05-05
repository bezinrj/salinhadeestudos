import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Scale } from "lucide-react";

interface TurmaRankingProps {
  albumId: string;
  albumTitulo: string;
  albumCor: string;
  intervaloDias: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  questionId?: string;
  questionTitulo?: string;
}

interface RankingEntry {
  userId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  questoes: number;
  semGabarito: boolean;
}

const MEDALS = ["🥇", "🥈", "🥉"];

function RankingList({ entries, loading, albumCor }: {
  entries: RankingEntry[];
  loading: boolean;
  albumCor: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!entries.length) {
    return (
      <p className="text-center text-sm text-muted-foreground py-12">
        Nenhuma resposta registrada ainda.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((e, i) => {
        const initials = e.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        const isTop3 = i < 3;
        return (
          <div
            key={e.userId}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors",
              isTop3 && "border-primary/40 bg-primary/5"
            )}
          >
            <div className="w-8 text-center font-bold">
              {i < 3 ? (
                <span className="text-2xl">{MEDALS[i]}</span>
              ) : (
                <span className="text-sm text-muted-foreground">{i + 1}º</span>
              )}
            </div>

            <Avatar className="h-10 w-10">
              {e.avatarUrl && <AvatarImage src={e.avatarUrl} alt={e.name} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{e.name}</span>
                {e.semGabarito && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Scale className="h-3 w-3" />
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                @{e.username} · {e.questoes} questão(ões)
              </p>
            </div>

            <div
              className="text-lg font-bold tabular-nums"
              style={{ color: albumCor }}
            >
              {Number(e.score).toFixed(1)}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground pt-3 text-center">
        ⚖️ respondeu pela primeira vez sem baixar o gabarito
      </p>
    </div>
  );
}

export function TurmaRanking({
  albumId, albumTitulo, albumCor, intervaloDias, open, onOpenChange, questionId, questionTitulo
}: TurmaRankingProps) {
  const isSemanal = intervaloDias >= 7;

  const fetchRanking = async (fn: string, extraArg?: string): Promise<RankingEntry[]> => {
    const args: any = { p_album_id: albumId };
    if (extraArg) args.p_question_id = extraArg;
    const { data: rows, error } = await (supabase as any).rpc(fn, args);
    if (error) throw error;
    if (!rows?.length) return [];

    const userIds = rows.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url")
      .in("id", userIds);

    return rows.map((r: any) => {
      const p = profiles?.find((x: any) => x.id === r.user_id);
      return {
        userId: r.user_id,
        name: p?.name || p?.username || "Usuário",
        username: p?.username || "",
        avatarUrl: p?.avatar_url || null,
        score: Number(r.total_score ?? r.score ?? 0),
        questoes: Number(r.questoes_respondidas ?? 1),
        semGabarito: !!r.respondeu_sem_gabarito,
      };
    });
  };

  const { data: rankingPeriodo = [], isLoading: loadingPeriodo } = useQuery({
    queryKey: ["turma-ranking-periodo", albumId, questionId],
    queryFn: () => isSemanal
      ? fetchRanking("get_turma_ranking_semanal")
      : fetchRanking("get_turma_ranking_por_questao", questionId),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const { data: rankingGeral = [], isLoading: loadingGeral } = useQuery({
    queryKey: ["turma-ranking-geral", albumId],
    queryFn: () => fetchRanking("get_turma_ranking_geral"),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const periodoLabel = isSemanal ? "Semanal" : "Por Questão";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: albumCor }}
            />
            Ranking — {albumTitulo}
          </DialogTitle>
          {!isSemanal && questionTitulo && (
            <p className="text-sm text-muted-foreground">
              Questão: {questionTitulo}
            </p>
          )}
        </DialogHeader>

        <Tabs defaultValue="periodo" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="periodo">{periodoLabel}</TabsTrigger>
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>
          <TabsContent value="periodo" className="mt-4">
            <RankingList entries={rankingPeriodo} loading={loadingPeriodo} albumCor={albumCor} />
          </TabsContent>
          <TabsContent value="geral" className="mt-4">
            <RankingList entries={rankingGeral} loading={loadingGeral} albumCor={albumCor} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
