import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankingTable } from "@/components/RankingTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { RankingEntry } from "@/data/mockData";

export default function Ranking() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch general ranking: sum of weekly_answers scores per user
  const { data: ranking = [] } = useQuery({
    queryKey: ["ranking-general"],
    queryFn: async () => {
      // Get all weekly answers
      const { data: answers } = await (supabase.from("weekly_answers" as any) as any)
        .select("user_id, score");
      
      // Get profiles
      const { data: profiles } = await supabase.from("profiles").select("id, name, username, avatar_url");
      
      if (!answers || !profiles) return [];

      // Sum scores per user
      const scoreMap = new Map<string, number>();
      for (const a of answers) {
        scoreMap.set(a.user_id, (scoreMap.get(a.user_id) || 0) + Number(a.score));
      }

      const entries: RankingEntry[] = [];
      for (const [userId, score] of scoreMap) {
        if (score <= 0) continue;
        const profile = profiles.find((p: any) => p.id === userId);
        const name = profile?.name || profile?.username || "Usuário";
        const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
        entries.push({
          userId,
          name,
          avatar: initials,
          avatarUrl: profile?.avatar_url || undefined,
          score: Math.round(score * 10) / 10,
          position: 0,
        });
      }

      entries.sort((a, b) => b.score - a.score);
      entries.forEach((e, i) => { e.position = i + 1; });
      return entries;
    },
    refetchInterval: 30_000,
  });

  const top3 = ranking.slice(0, 3);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Ranking</h1>
        <p className="text-sm text-muted-foreground mt-1">Pontuação baseada nas Questões da Semana</p>
      </div>

      {/* Podium */}
      {top3.length >= 3 && top3[0].score > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="gradient-card border-border overflow-hidden">
            <CardContent className="p-6">
               <div className="flex items-end justify-center gap-4 md:gap-8">
                <div className="text-center">
                  <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-muted-foreground/30 cursor-pointer" onClick={() => navigate(`/perfil/${top3[1].userId}`)}>
                    {top3[1].avatarUrl && <AvatarImage src={top3[1].avatarUrl} />}
                    <AvatarFallback className="bg-secondary text-sm font-bold">{top3[1].avatar}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/perfil/${top3[1].userId}`)}>{top3[1].name.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{top3[1].score} pts</p>
                  <div className="mt-2 h-20 w-20 rounded-t-lg bg-secondary/50 flex items-center justify-center">
                    <span className="text-3xl">🥈</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-1">🥇</div>
                  <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-gold/50 glow-gold cursor-pointer" onClick={() => navigate(`/perfil/${top3[0].userId}`)}>
                    {top3[0].avatarUrl && <AvatarImage src={top3[0].avatarUrl} />}
                    <AvatarFallback className="bg-gold/10 text-gold text-sm font-bold">{top3[0].avatar}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-bold text-gold cursor-pointer hover:underline" onClick={() => navigate(`/perfil/${top3[0].userId}`)}>{top3[0].name.split(" ")[0]}</p>
                  <p className="text-xs text-gold/70">{top3[0].score} pts</p>
                  <div className="mt-2 h-28 w-20 rounded-t-lg gradient-gold flex items-center justify-center">
                    <span className="text-3xl">👑</span>
                  </div>
                </div>
                <div className="text-center">
                  <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-orange-400/30 cursor-pointer" onClick={() => navigate(`/perfil/${top3[2].userId}`)}>
                    {top3[2].avatarUrl && <AvatarImage src={top3[2].avatarUrl} />}
                    <AvatarFallback className="bg-secondary text-sm font-bold">{top3[2].avatar}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/perfil/${top3[2].userId}`)}>{top3[2].name.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{top3[2].score} pts</p>
                  <div className="mt-2 h-14 w-20 rounded-t-lg bg-orange-400/10 flex items-center justify-center">
                    <span className="text-3xl">🥉</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-secondary w-full grid grid-cols-2">
          <TabsTrigger value="general" className="text-xs"><Trophy className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Geral</TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs"><Calendar className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Semanal</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="gradient-card border-border">
            <CardContent className="p-4">
              {ranking.length > 0 ? (
                <RankingTable entries={ranking} currentUserId={user?.id} />
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma pontuação registrada ainda. Responda as Questões da Semana para aparecer no ranking!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <WeeklyRankingTab currentUserId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WeeklyRankingTab({ currentUserId }: { currentUserId?: string }) {
  const { data: weeklyRanking = [] } = useQuery({
    queryKey: ["ranking-weekly-current"],
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

      const entries: RankingEntry[] = answers.map((a: any) => {
        const profile = profiles.find((p: any) => p.id === a.user_id);
        const name = profile?.name || profile?.username || "Usuário";
        const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
        return {
          userId: a.user_id,
          name,
          avatar: initials,
          avatarUrl: profile?.avatar_url || undefined,
          score: Number(a.score),
          position: 0,
        };
      }).filter((e: RankingEntry) => e.score > 0);

      entries.sort((a: RankingEntry, b: RankingEntry) => b.score - a.score);
      entries.forEach((e: RankingEntry, i: number) => { e.position = i + 1; });
      return entries;
    },
    refetchInterval: 30_000,
  });

  return (
    <Card className="gradient-card border-border">
      <CardContent className="p-4">
        {weeklyRanking.length > 0 ? (
          <RankingTable entries={weeklyRanking} currentUserId={currentUserId} />
        ) : (
          <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma pontuação semanal ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}
