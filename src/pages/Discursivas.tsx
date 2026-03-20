import { useState } from "react";
import { disciplines } from "@/data/mockData";
import { QuestionCard } from "@/components/QuestionCard";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";

const difficulties = ["Todas", "Fácil", "Médio", "Difícil"] as const;
const careers = ["Todas", "Delegado", "Magistratura", "Promotoria"] as const;
const types = ["Todas", "Gratuitas", "Premium"] as const;
const bancas = ["Todas", "CEBRASPE", "FGV", "VUNESP", "INÉDITA"] as const;
const disciplineOptions = ["Todas", ...disciplines] as const;

export default function Discursivas() {
  const [difficulty, setDifficulty] = useState<string>("Todas");
  const [career, setCareer] = useState<string>("Todas");
  const [type, setType] = useState<string>("Todas");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("Todas");
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

  const { data: allQuestions = [], isLoading } = useQuery({
    queryKey: ["discursivas-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_questions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((q: any) => ({
        id: q.id,
        title: q.title,
        career: q.career,
        discipline: q.discipline,
        statement: q.statement,
        difficulty: q.difficulty,
        participants: q.participants || 0,
        isWeekly: q.is_weekly,
        isPremium: q.is_premium || q.is_weekly,
        deadline: q.deadline,
        barema: q.barema,
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weekly_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discursivas-questions"] });
      toast.success("Questão excluída com sucesso.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = allQuestions.filter(q => {
    // Hide active weekly questions (deadline not yet passed)
    if (q.isWeekly && q.deadline && new Date(q.deadline) > new Date()) return false;
    if (difficulty !== "Todas" && q.difficulty !== difficulty) return false;
    if (career !== "Todas" && q.career !== career) return false;
    if (selectedDiscipline !== "Todas" && q.discipline !== selectedDiscipline) return false;
    const isPremium = q.isPremium || q.isWeekly;
    if (type === "Gratuitas" && isPremium) return false;
    if (type === "Premium" && !isPremium) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Discursivas</h1>
        <p className="text-sm text-muted-foreground mt-1">Escolha uma questão e envie sua resposta para correção</p>
      </div>

      <div>
        <a href="/Folha_de_Resposta_30_linhas.pdf" download>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Rascunho - 30 linhas
          </Button>
        </a>
        <p className="text-xs text-muted-foreground mt-2">
          Treine a escrita, Aproveite a oportunidade e façam honestamente apenas com a lei seca.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Dificuldade</p>
          <div className="flex flex-wrap gap-2">
            {difficulties.map(d => (
              <Badge
                key={d}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors text-xs px-3 py-1",
                  difficulty === d
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Carreira</p>
          <div className="flex flex-wrap gap-2">
            {careers.map(c => (
              <Badge
                key={c}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors text-xs px-3 py-1",
                  career === c
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
                onClick={() => setCareer(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Matéria</p>
          <div className="flex flex-wrap gap-2">
            {disciplineOptions.map(d => (
              <Badge
                key={d}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors text-xs px-3 py-1",
                  selectedDiscipline === d
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
                onClick={() => setSelectedDiscipline(d)}
              >
                {d}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Tipo</p>
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <Badge
                key={t}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors text-xs px-3 py-1",
                  type === t
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
                onClick={() => setType(t)}
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Questions Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground"><p>Carregando questões...</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <QuestionCard
                question={q}
                onDelete={isAdmin ? (id) => deleteMutation.mutate(id) : undefined}
              />
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>Nenhuma questão encontrada com esses filtros.</p>
        </div>
      )}
    </div>
  );
}
