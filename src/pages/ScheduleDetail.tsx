import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, BookOpen, BarChart3, Clock } from "lucide-react";
import { useState, useMemo } from "react";

import CronogramaProgressBar from "@/components/cronograma/CronogramaProgressBar";
import MatrizTable from "@/components/cronograma/MatrizTable";
import CronogramaCalendar from "@/components/cronograma/CronogramaCalendar";
import CronogramaTimer from "@/components/cronograma/CronogramaTimer";
import CronogramaPerformance from "@/components/cronograma/CronogramaPerformance";

export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("matriz");

  const isAdminOrMod = isAdmin || isModerator;

  // Fetch schedule info
  const { data: cronograma } = useQuery({
    queryKey: ["cronograma", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedules").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch matriz
  const { data: topicos = [] } = useQuery({
    queryKey: ["cronograma-matriz", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cronograma_matriz")
        .select("*")
        .eq("cronograma_id", id!)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  // Fetch user progress
  const { data: progress = [] } = useQuery({
    queryKey: ["user-progress", id],
    queryFn: async () => {
      if (!user) return [];
      const topicoIds = topicos.map(t => t.id);
      if (topicoIds.length === 0) return [];
      const { data, error } = await supabase
        .from("user_topico_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("topico_id", topicoIds);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && topicos.length > 0,
  });

  // Fetch calendar events
  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["calendar-events", id],
    queryFn: async () => {
      if (!user) return [];
      const topicoIds = topicos.map(t => t.id);
      if (topicoIds.length === 0) return [];
      const { data, error } = await supabase
        .from("user_calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .in("topico_id", topicoIds);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && topicos.length > 0,
  });

  // Fetch study sessions
  const { data: studySessions = [] } = useQuery({
    queryKey: ["study-sessions", id],
    queryFn: async () => {
      if (!user) return [];
      const topicoIds = topicos.map(t => t.id);
      if (topicoIds.length === 0) return [];
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .in("topico_id", topicoIds);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && topicos.length > 0,
  });

  const completedCount = useMemo(() => progress.filter((p: any) => p.concluido).length, [progress]);

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cronograma")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground">{cronograma?.title || "Cronograma"}</h1>
          {cronograma?.career && (
            <Badge variant="outline" className="mt-1 text-[10px] bg-background/50 border-border/50">
              {cronograma.career}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {topicos.length > 0 && (
        <CronogramaProgressBar completed={completedCount} total={topicos.length} />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="matriz" className="gap-1 text-xs">
            <Calendar className="h-3.5 w-3.5" /> Matriz
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-1 text-xs">
            <BookOpen className="h-3.5 w-3.5" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="cronometro" className="gap-1 text-xs">
            <Clock className="h-3.5 w-3.5" /> Estudar
          </TabsTrigger>
          <TabsTrigger value="desempenho" className="gap-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Desempenho
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matriz" className="mt-5">
          <MatrizTable
            cronogramaId={id!}
            topicos={topicos}
            progress={progress}
            isAdminOrMod={isAdminOrMod}
            userId={user?.id || ""}
          />
        </TabsContent>

        <TabsContent value="calendario" className="mt-5">
          {user && id ? (
            <CronogramaCalendar
              cronogramaId={id}
              userId={user.id}
              events={calendarEvents}
              topicos={topicos}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">Faça login para acessar.</p>
          )}
        </TabsContent>

        <TabsContent value="cronometro" className="mt-5">
          {user && id ? (
            <CronogramaTimer
              cronogramaId={id}
              userId={user.id}
              events={calendarEvents}
              topicos={topicos}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">Faça login para acessar.</p>
          )}
        </TabsContent>

        <TabsContent value="desempenho" className="mt-5">
          {user && id ? (
            <CronogramaPerformance
              cronogramaId={id}
              userId={user.id}
              sessions={studySessions}
              topicos={topicos}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">Faça login para acessar.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
