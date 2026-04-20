import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RankingTable } from "@/components/RankingTable";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Trophy, Hourglass, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

function getTimeRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Encerrado";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h restantes`;
}

export default function WeeklyChallenge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [waitlistCount, setWaitlistCount] = useState(0);

  // Fetch active weekly question (deadline in the future)
  const { data: activeQuestion, isLoading } = useQuery({
    queryKey: ["weekly-question-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_questions")
        .select("*")
        .eq("is_active", true)
        .eq("is_weekly", true)
        .gt("deadline", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Check if user is on waitlist
  const { data: waitlistEntry } = useQuery({
    queryKey: ["weekly-waitlist-self"],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("weekly_waitlist")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get waitlist count via a count query
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("weekly_waitlist")
        .select("*", { count: "exact", head: true });
      setWaitlistCount(count || 0);
    };
    fetchCount();

    // Realtime subscription for waitlist changes
    const channel = supabase
      .channel("weekly-waitlist-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "weekly_waitlist" }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Join waitlist mutation
  const joinWaitlist = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("weekly_waitlist")
        .upsert({ user_id: user.id, notified: false }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-waitlist-self"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Questões da Semana</h1>
        <p className="text-sm text-muted-foreground mt-1">Desafios semanais que geram pontuação para o ranking</p>
      </div>

      {activeQuestion ? (
        <>
          {/* Active Challenge */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="gradient-card border-gold/20 glow-gold">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">🏆 Desafio da Semana</Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[10px]">{activeQuestion.career}</Badge>
                  <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">{activeQuestion.discipline}</Badge>
                  {activeQuestion.subject && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">{activeQuestion.subject}</Badge>
                  )}
                </div>
                <CardTitle className="font-display text-xl">{activeQuestion.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground/85 leading-relaxed line-clamp-6">{activeQuestion.statement}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gold" />
                    <span>{getTimeRemaining(activeQuestion.deadline)}</span>
                  </div>
                </div>

                <Button onClick={() => navigate(`/semanal/${activeQuestion.id}`)} className="gradient-electric text-white font-semibold">
                  Responder desafio
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        /* Empty state - no active question */
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="gradient-card border-border">
            <CardContent className="py-12 text-center space-y-5">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Hourglass className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">Sem questões no momento</h2>
                <p className="text-sm text-muted-foreground mt-2">O próximo desafio será publicado em breve.</p>
              </div>

              {waitlistEntry ? (
                <Button variant="outline" disabled className="gap-2">
                  <Check className="h-4 w-4 text-green-400" />
                  Esperando o próximo desafio
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2 border-gold/30 hover:border-gold/50 hover:bg-gold/5"
                  onClick={() => joinWaitlist.mutate()}
                  disabled={joinWaitlist.isPending || !user}
                >
                  <Hourglass className="h-4 w-4 text-gold" />
                  Esperando o próximo desafio
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 inline mr-1" />
                {waitlistCount} {waitlistCount === 1 ? "pessoa esperando" : "pessoas esperando"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly Ranking */}
      <WeeklyRankingSection />
    </div>
  );
}

function WeeklyRankingSection() {
  const { data: ranking = [] } = useQuery({
    queryKey: ["weekly-challenge-ranking"],
    queryFn: async () => {
      // Get active weekly question
      const { data: activeQ } = await supabase
        .from("weekly_questions")
        .select("id")
        .eq("is_weekly", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!activeQ) return [];

      const { data: answers } = await (supabase.from("weekly_answers" as any) as any)
        .select("user_id, score")
        .eq("question_id", activeQ.id);

      const { data: profiles } = await supabase.from("profiles").select("id, name, username, avatar_url");

      if (!answers || !profiles) return [];

      return answers
        .filter((a: any) => Number(a.score) > 0)
        .map((a: any) => {
          const p = profiles.find((p: any) => p.id === a.user_id);
          const name = p?.name || p?.username || "Usuário";
          const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
          return { userId: a.user_id, name, avatar: initials, avatarUrl: p?.avatar_url, score: Number(a.score), position: 0 };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .map((e: any, i: number) => ({ ...e, position: i + 1 }));
    },
    refetchInterval: 30_000,
  });

  return (
    <Card className="gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gold" /> Ranking da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ranking.length > 0 ? (
          <RankingTable entries={ranking} />
        ) : (
          <p className="text-center py-8 text-muted-foreground text-sm">Ranking será exibido quando houver participantes.</p>
        )}
      </CardContent>
    </Card>
  );
}
