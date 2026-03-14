import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { disciplines, studySessions, addStudySession, getUserStudyStats, getWeeklyChartData } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Pause, Square, Flame, Clock, Calendar, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

export default function StudyTimerPage() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string>("");

  const userId = user?.id || "u1";

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const formatHour = (d: Date) => `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  const handleStart = () => {
    startTimeRef.current = formatHour(new Date());
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleStop = () => {
    setIsRunning(false);
    if (seconds >= 60) {
      const now = new Date();
      addStudySession({
        id: `ss_${Date.now()}`,
        userId,
        discipline: selectedDiscipline || "Geral",
        startTime: startTimeRef.current,
        endTime: formatHour(now),
        duration: Math.round(seconds / 60),
        date: now.toISOString().split("T")[0],
      });
      setRefreshKey(k => k + 1);
    }
    setSeconds(0);
  };

  const stats = useMemo(() => getUserStudyStats(userId), [userId, refreshKey]);
  const chartData = useMemo(() => getWeeklyChartData(userId), [userId, refreshKey]);
  const todaySessions = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return studySessions.filter(s => s.userId === userId && s.date === todayStr);
  }, [userId, refreshKey]);

  const fmtHours = (h: number) => h < 10 ? `${h.toFixed(1)}h` : `${Math.round(h)}h`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Cronômetro de Estudos</h1>
        <p className="text-sm text-muted-foreground mt-1">Registre suas sessões e acompanhe seu progresso</p>
      </div>

      {/* Timer */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className={`gradient-card border-border ${isRunning ? "border-primary/30 glow-electric" : ""} transition-all`}>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger className="w-64 mx-auto bg-secondary border-border">
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={`text-6xl md:text-8xl font-display font-bold tracking-wider mb-8 ${isRunning ? "text-primary animate-pulse-glow" : "text-foreground"}`}>
              {formatTime(seconds)}
            </div>

            <div className="flex items-center justify-center gap-3">
              {!isRunning ? (
                <Button size="lg" onClick={handleStart} className="gradient-electric text-white font-semibold px-8">
                  <Play className="h-5 w-5 mr-2" /> Iniciar
                </Button>
              ) : (
                <Button size="lg" variant="outline" onClick={handlePause} className="border-primary/30 text-primary px-8">
                  <Pause className="h-5 w-5 mr-2" /> Pausar
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={handleStop} disabled={seconds === 0} className="border-border text-muted-foreground">
                <Square className="h-5 w-5 mr-2" /> Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Hoje" value={fmtHours(stats.todayHours)} icon={Clock} variant="electric" />
        <StatCard title="Semana" value={fmtHours(stats.weekHours)} icon={Calendar} variant="default" />
        <StatCard title="Mês" value={fmtHours(stats.monthHours)} icon={TrendingUp} variant="purple" />
        <StatCard title="Sequência" value={`${stats.streak} dia${stats.streak !== 1 ? "s" : ""}`} icon={Flame} variant="gold" />
      </div>

      {/* Chart + Sessions */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="gradient-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horas na Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 11%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", color: "hsl(210, 20%, 92%)" }} />
                <Bar dataKey="hours" fill="hsl(270, 60%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessões de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sessão registrada hoje</p>
            )}
            {todaySessions.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{s.discipline}</p>
                  <p className="text-xs text-muted-foreground">{s.startTime} - {s.endTime}</p>
                </div>
                <span className="text-sm font-bold text-primary">{(s.duration / 60).toFixed(1)}h</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
