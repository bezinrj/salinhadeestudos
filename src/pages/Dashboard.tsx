import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Trophy, FileText, Timer, TrendingUp, Flame, Target, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { recentCorrections, weeklyStudyData } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_announcements").select("*").eq("is_active", true).order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Check if user is on waitlist and a new question is available
  const { data: weeklyNotification } = useQuery({
    queryKey: ["weekly-notification"],
    queryFn: async () => {
      if (!profile) return null;
      // Check waitlist entry
      const { data: waitEntry } = await supabase
        .from("weekly_waitlist")
        .select("*")
        .eq("user_id", profile.id)
        .eq("notified", false)
        .maybeSingle();
      if (!waitEntry) return null;
      // Check if there's a new active question
      const { data: activeQ } = await supabase
        .from("weekly_questions")
        .select("id, title")
        .eq("is_active", true)
        .gt("deadline", new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (!activeQ) return null;
      return { waitEntryId: waitEntry.id, question: activeQ };
    },
    enabled: !!profile,
  });

  // Mark as notified when banner is shown
  useEffect(() => {
    if (weeklyNotification) {
      supabase
        .from("weekly_waitlist")
        .update({ notified: true })
        .eq("id", weeklyNotification.waitEntryId)
        .then();
    }
  }, [weeklyNotification]);

  const activeAnnouncements = announcements?.filter((a: any) => !dismissedAnnouncements.includes(a.id)) || [];

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Announcement Banners */}
      {activeAnnouncements.map((a: any) => (
        <motion.div key={a.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-gold/30 bg-gold/10 p-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">📢</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge className="bg-gold text-gold-foreground hover:bg-gold/90 border-none text-[10px] px-2 py-0.5">AVISO</Badge>
              <p className="text-sm font-semibold text-gold">{a.title}</p>
            </div>
            <p className="text-sm text-foreground/80 mt-1">{a.message}</p>
          </div>
          <button onClick={() => setDismissedAnnouncements((prev) => [...prev, a.id])} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      ))}

      {/* Weekly Challenge Notification */}
      {weeklyNotification && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-primary/30 bg-primary/10 p-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">🏆</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 border-none text-[10px] px-2 py-0.5">NOVO DESAFIO</Badge>
              <p className="text-sm font-semibold text-primary">Nova questão da semana disponível!</p>
            </div>
            <p className="text-sm text-foreground/80 mt-1">{weeklyNotification.question.title}</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-primary/30 hover:bg-primary/10" onClick={() => navigate("/desafio-semanal")}>
            Ver desafio
          </Button>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          Olá, <span className="text-primary">{(profile.name || profile.username).split(" ")[0]}</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Continue evoluindo. Seu progresso está sendo registrado!</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Pontuação" value={profile.total_score.toLocaleString("pt-BR")} icon={TrendingUp} variant="electric" />
        <StatCard title="Ranking" value={profile.rank_position > 0 ? `#${profile.rank_position}` : "—"} icon={Trophy} variant="gold" />
        <StatCard title="Horas/Semana" value={`${profile.weekly_hours}h`} icon={Timer} variant="purple" />
        <StatCard title="Discursivas" value={profile.total_essays} subtitle={profile.average_grade > 0 ? `Média: ${profile.average_grade}` : undefined} icon={FileText} variant="default" />
      </div>

      {/* Streak + Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="gradient-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-gold/10 p-2.5">
                <Flame className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-display font-bold text-lg">{profile.streak} dias</p>
                <p className="text-xs text-muted-foreground">Sequência de estudos 🔥</p>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < Math.min(profile.streak, 7) ? "bg-gold" : "bg-secondary"}`} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground mb-3">Atalhos rápidos</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="flex-col h-auto py-3 border-border hover:border-primary/30 hover:bg-primary/5" onClick={() => navigate("/discursivas")}>
                <FileText className="h-5 w-5 mb-1 text-primary" />
                <span className="text-[10px]">Discursivas</span>
              </Button>
              <Button variant="outline" className="flex-col h-auto py-3 border-border hover:border-gold/30 hover:bg-gold/5" onClick={() => navigate("/ranking")}>
                <Trophy className="h-5 w-5 mb-1 text-gold" />
                <span className="text-[10px]">Ranking</span>
              </Button>
              <Button variant="outline" className="flex-col h-auto py-3 border-border hover:border-purple/30 hover:bg-purple/5" onClick={() => navigate("/cronometro")}>
                <Timer className="h-5 w-5 mb-1 text-purple" />
                <span className="text-[10px]">Cronômetro</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly chart + Recent corrections */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="gradient-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horas Estudadas na Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyStudyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 11%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", color: "hsl(210, 20%, 92%)" }} />
                <Bar dataKey="hours" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Últimas Correções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCorrections.length > 0 ? recentCorrections.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.questionTitle}</p>
                  <p className="text-xs text-muted-foreground">{c.career} · {c.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{c.grade}/{c.maxGrade}</p>
                  <Progress value={(c.grade / c.maxGrade) * 100} className="h-1 w-16 mt-1" />
                </div>
              </div>
            )) : (
              <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma correção ainda. Responda uma discursiva!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
