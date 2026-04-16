import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Schedule = {
  id: string;
  title: string;
  career: string | null;
  cover_image_url: string | null;
  access_type: string;
  status: string;
  sort_order: number;
};

export default function Schedules() {
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const { subscribed } = useAuth();
  const navigate = useNavigate();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules-listing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("id, title, career, cover_image_url, access_type, status, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Schedule[];
    },
  });

  // Non-admin users only see published schedules
  const visible = (isAdmin || isModerator) ? schedules : schedules.filter(s => s.status === "published");

  const grouped = visible.reduce<Record<string, Schedule[]>>((acc, s) => {
    const key = s.career || "Outros";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const careerOrder = ["Delegado", "Ministério Público", "Magistratura Estadual", "Defensoria", "Procuradoria"];
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const ia = careerOrder.indexOf(a);
    const ib = careerOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const handleClick = (s: Schedule) => {
    const isPremium = s.access_type === "premium";
    if (isPremium && !subscribed && !isAdmin && !isModerator) {
      navigate("/meu-plano");
      return;
    }
    navigate(`/cronograma/${s.id}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-8 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Cronogramas</h1>
        <p className="text-sm text-muted-foreground">Sua biblioteca de planos de estudo</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Carregando cronogramas...</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto h-14 w-14 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-lg">Nenhum cronograma disponível</p>
        </div>
      ) : (
        sortedKeys.map(cat => (
          <CareerRow key={cat} category={cat} items={grouped[cat]} subscribed={subscribed} isAdmin={isAdmin} isModerator={isModerator} onClick={handleClick} />
        ))
      )}
    </div>
  );
}

function CareerRow({ category, items, subscribed, isAdmin, isModerator, onClick }: {
  category: string;
  items: Schedule[];
  subscribed: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  onClick: (s: Schedule) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-semibold text-foreground">{category}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
        {items.map((s, i) => {
          const isPremium = s.access_type === "premium";
          const locked = isPremium && !subscribed && !isAdmin && !isModerator;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex-shrink-0 w-[160px] md:w-[180px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <div
                className="group relative cursor-pointer rounded-xl overflow-hidden border border-border/50 bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                onClick={() => onClick(s)}
              >
                <div className="relative aspect-[3/4] bg-muted/50 overflow-hidden">
                  {s.cover_image_url ? (
                    <img src={s.cover_image_url} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                      <Calendar className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {isPremium ? (
                    <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 border-0 font-semibold">Premium</Badge>
                  ) : (
                    <Badge variant="outline" className="absolute top-2 left-2 bg-background/70 backdrop-blur-sm text-[10px] px-1.5 py-0.5 border-border/50 text-foreground">Gratuito</Badge>
                  )}
                  {locked && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="h-6 w-6 text-accent" />
                        <span className="text-[10px] text-accent font-semibold">PREMIUM</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{s.title}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
