import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankingTable } from "@/components/RankingTable";
import { getWeeklyRanking, hoursRanking } from "@/data/mockData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function Ranking() {
  const ranking = getWeeklyRanking();
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
                  <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-muted-foreground/30">
                    <AvatarFallback className="bg-secondary text-sm font-bold">{top3[1].avatar}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold">{top3[1].name.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{top3[1].score} pts</p>
                  <div className="mt-2 h-20 w-20 rounded-t-lg bg-secondary/50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">2</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">👑</div>
                  <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-gold/50 glow-gold">
                    <AvatarFallback className="bg-gold/10 text-gold text-sm font-bold">{top3[0].avatar}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-bold text-gold">{top3[0].name.split(" ")[0]}</p>
                  <p className="text-xs text-gold/70">{top3[0].score} pts</p>
                  <div className="mt-2 h-28 w-20 rounded-t-lg gradient-gold flex items-center justify-center">
                    <span className="text-2xl font-bold text-black">1</span>
                  </div>
                </div>
                <div className="text-center">
                  <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-orange-400/30">
                    <AvatarFallback className="bg-secondary text-sm font-bold">{top3[2].avatar}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold">{top3[2].name.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{top3[2].score} pts</p>
                  <div className="mt-2 h-14 w-20 rounded-t-lg bg-orange-400/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-400">3</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-secondary w-full grid grid-cols-3">
          <TabsTrigger value="general" className="text-xs"><Trophy className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Geral</TabsTrigger>
          <TabsTrigger value="hours" className="text-xs"><Clock className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Horas</TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs"><Calendar className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Semanal</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="gradient-card border-border">
            <CardContent className="p-4">
              {ranking.length > 0 && ranking.some(r => r.score > 0) ? (
                <RankingTable entries={ranking.filter(r => r.score > 0)} />
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma pontuação registrada ainda. Responda as Questões da Semana para aparecer no ranking!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card className="gradient-card border-border">
            <CardContent className="p-4">
              {hoursRanking.length > 0 ? (
                <RankingTable entries={hoursRanking} valueLabel="horas" valueFormatter={(v) => `${v}h`} />
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma sessão de estudo registrada.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card className="gradient-card border-border">
            <CardContent className="p-4">
              {ranking.length > 0 && ranking.some(r => r.score > 0) ? (
                <RankingTable entries={ranking.filter(r => r.score > 0).slice(0, 10)} valueLabel="pts" />
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma pontuação semanal ainda.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
