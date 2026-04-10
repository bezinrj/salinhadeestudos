import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Calendar, Lock, MoreVertical, FileEdit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ScheduleFormDialog from "@/components/ScheduleFormDialog";

type Schedule = {
  id: string;
  title: string;
  description: string;
  status: string;
  color_theme: string;
  cover_image_url: string | null;
  career: string | null;
  access_type: string;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export default function Schedules() {
  const { isAdmin } = useIsAdmin();
  const { subscribed } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Schedule[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (schedule: Schedule) => {
      // Delete cover from storage if exists
      if (schedule.cover_image_url) {
        const path = schedule.cover_image_url.split("/schedule-covers/")[1];
        if (path) {
          await supabase.storage.from("schedule-covers").remove([path]);
        }
      }
      // Delete blocks first
      await supabase.from("schedule_blocks").delete().eq("schedule_id", schedule.id);
      const { error } = await supabase.from("schedules").delete().eq("id", schedule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Cronograma excluído!");
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  // Group schedules by career
  const groupedByCareer = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const key = s.career || "Sem carreira";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const careerOrder = [
    "Delegado",
    "Ministério Público",
    "Magistratura Estadual",
    "Defensoria",
    "Procuradoria",
  ];

  const sortedCareers = Object.keys(groupedByCareer).sort((a, b) => {
    const ia = careerOrder.indexOf(a);
    const ib = careerOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const handleCardClick = (schedule: Schedule) => {
    if (schedule.access_type === "premium" && !subscribed && !isAdmin) {
      navigate("/meu-plano");
      toast.info("Este cronograma é exclusivo para assinantes Premium.");
      return;
    }
    navigate(`/cronograma/${schedule.id}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-8 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Cronogramas</h1>
          <p className="text-sm text-muted-foreground">Sua biblioteca de planos de estudo</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="gap-2" onClick={() => { setEditingSchedule(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> Novo Cronograma
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Carregando cronogramas...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto h-14 w-14 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-lg">Nenhum cronograma disponível</p>
          {isAdmin && <p className="text-sm text-muted-foreground mt-2">Crie seu primeiro cronograma.</p>}
        </div>
      ) : (
        sortedCareers.map(career => (
          <CareerRow
            key={career}
            career={career}
            schedules={groupedByCareer[career]}
            isAdmin={isAdmin}
            subscribed={subscribed}
            onCardClick={handleCardClick}
            onEdit={(s) => { setEditingSchedule(s); setShowForm(true); }}
            onDelete={(s) => {
              if (confirm(`Excluir "${s.title}" e todos seus blocos?`)) {
                deleteMutation.mutate(s);
              }
            }}
          />
        ))
      )}

      {/* Form dialog */}
      <ScheduleFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        editData={editingSchedule ? {
          id: editingSchedule.id,
          title: editingSchedule.title,
          career: editingSchedule.career,
          access_type: editingSchedule.access_type,
          cover_image_url: editingSchedule.cover_image_url,
          status: editingSchedule.status,
          sort_order: editingSchedule.sort_order,
        } : null}
      />
    </div>
  );
}

function CareerRow({
  career,
  schedules,
  isAdmin,
  subscribed,
  onCardClick,
  onEdit,
  onDelete,
}: {
  career: string;
  schedules: Schedule[];
  isAdmin: boolean;
  subscribed: boolean;
  onCardClick: (s: Schedule) => void;
  onEdit: (s: Schedule) => void;
  onDelete: (s: Schedule) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground font-['Space_Grotesk']">{career}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {schedules.map((schedule, i) => (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            index={i}
            isAdmin={isAdmin}
            subscribed={subscribed}
            onClick={() => onCardClick(schedule)}
            onEdit={() => onEdit(schedule)}
            onDelete={() => onDelete(schedule)}
          />
        ))}
      </div>
    </section>
  );
}

function ScheduleCard({
  schedule,
  index,
  isAdmin,
  subscribed,
  onClick,
  onEdit,
  onDelete,
}: {
  schedule: Schedule;
  index: number;
  isAdmin: boolean;
  subscribed: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPremium = schedule.access_type === "premium";
  const isLocked = isPremium && !subscribed && !isAdmin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex-shrink-0 w-[160px] md:w-[180px]"
      style={{ scrollSnapAlign: "start" }}
    >
      <div
        className="group relative cursor-pointer rounded-xl overflow-hidden border border-border/50 bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
        onClick={onClick}
      >
        {/* Cover */}
        <div className="relative aspect-[3/4] bg-muted/50 overflow-hidden">
          {schedule.cover_image_url ? (
            <img
              src={schedule.cover_image_url}
              alt={schedule.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <Calendar className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Premium/Free badge */}
          {isPremium ? (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 border-0 font-semibold">
              Premium
            </Badge>
          ) : (
            <Badge variant="outline" className="absolute top-2 left-2 bg-background/70 backdrop-blur-sm text-[10px] px-1.5 py-0.5 border-border/50 text-foreground">
              Gratuito
            </Badge>
          )}

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <Lock className="h-6 w-6 text-accent" />
                <span className="text-[10px] text-accent font-semibold">PREMIUM</span>
              </div>
            </div>
          )}

          {/* Admin menu */}
          {isAdmin && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/70 backdrop-blur-sm hover:bg-background/90">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={onEdit}>
                    <FileEdit className="h-4 w-4 mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="p-3">
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{schedule.title}</p>
        </div>
      </div>
    </motion.div>
  );
}

type Schedule = {
  id: string;
  title: string;
  description: string;
  status: string;
  color_theme: string;
  cover_image_url: string | null;
  career: string | null;
  access_type: string;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
