import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { weeklyQuestion, getWeeklyRanking } from "@/data/mockData";
import { RankingTable } from "@/components/RankingTable";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";

function getTimeRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Encerrado";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h restantes`;
}

export default function WeeklyChallenge() {
  const navigate = useNavigate();
  const ranking = getWeeklyRanking().filter(r => r.score > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Questões da Semana</h1>
        <p className="text-sm text-muted-foreground mt-1">Desafios semanais que geram pontuação para o ranking</p>
      </div>

      {/* Current Challenge */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-card border-gold/20 glow-gold">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">🏆 Desafio da Semana</Badge>
              <Badge variant="outline" className="text-primary border-primary/20 text-[10px]">{weeklyQuestion.career}</Badge>
              <Badge variant="outline" className="text-red-400 border-red-500/20 text-[10px]">{weeklyQuestion.difficulty}</Badge>
            </div>
            <CardTitle className="font-display text-xl">{weeklyQuestion.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground/85 leading-relaxed line-clamp-6">{weeklyQuestion.statement}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gold" />
                <span>{getTimeRemaining(weeklyQuestion.deadline!)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{ranking.length} participantes</span>
              </div>
            </div>

            <Button onClick={() => navigate(`/discursivas/${weeklyQuestion.id}`)} className="gradient-electric text-white font-semibold">
              Responder desafio
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Ranking */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" /> Ranking da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length > 0 ? (
            <RankingTable entries={ranking.slice(0, 10)} />
          ) : (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma resposta enviada ainda. Seja o primeiro!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
