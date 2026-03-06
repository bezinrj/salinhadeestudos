import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { badges, recentCorrections, studySessions } from "@/data/mockData";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { StatCard } from "@/components/StatCard";
import { Trophy, FileText, Timer, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold font-display">{user.avatar}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-xl font-display font-bold">{user.name}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="mt-2 text-primary border-primary/20 bg-primary/10 text-xs">
                  <Target className="h-3 w-3 mr-1" /> {user.targetCareer}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Pontuação" value={user.totalScore.toLocaleString("pt-BR")} icon={TrendingUp} variant="electric" />
        <StatCard title="Ranking" value={`#${user.rankPosition}`} icon={Trophy} variant="gold" />
        <StatCard title="Discursivas" value={user.totalEssays} icon={FileText} variant="default" />
        <StatCard title="Nota Média" value={user.averageGrade.toFixed(1)} icon={Target} variant="purple" />
      </div>

      {/* Badges */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">🏅 Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeDisplay badges={badges} />
        </CardContent>
      </Card>

      {/* Correction History */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">📝 Histórico de Correções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentCorrections.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-secondary/20 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.questionTitle}</p>
                <p className="text-xs text-muted-foreground">{c.career} · {c.date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">{c.grade}/{c.maxGrade}</p>
                <Progress value={(c.grade / c.maxGrade) * 100} className="h-1 w-16 mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Study History */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">⏱️ Sessões de Estudo Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {studySessions.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/20 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{s.discipline}</p>
                <p className="text-xs text-muted-foreground">{s.date} · {s.startTime} - {s.endTime}</p>
              </div>
              <span className="text-sm font-bold text-purple">{(s.duration / 60).toFixed(1)}h</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
