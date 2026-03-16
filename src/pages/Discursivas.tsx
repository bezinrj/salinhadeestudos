import { useState } from "react";
import { questions, getExpiredWeeklyQuestions, disciplines } from "@/data/mockData";
import { QuestionCard } from "@/components/QuestionCard";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

const difficulties = ["Todas", "Fácil", "Médio", "Difícil"] as const;
const careers = ["Todas", "Delegado", "Magistratura", "Promotoria"] as const;
const types = ["Todas", "Gratuitas", "Premium"] as const;
const disciplineOptions = ["Todas", ...disciplines] as const;

export default function Discursivas() {
  const [difficulty, setDifficulty] = useState<string>("Todas");
  const [career, setCareer] = useState<string>("Todas");
  const [type, setType] = useState<string>("Todas");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("Todas");

  const allQuestions = [...questions, ...getExpiredWeeklyQuestions()];

  const filtered = allQuestions.filter(q => {
    if (difficulty !== "Todas" && q.difficulty !== difficulty) return false;
    if (career !== "Todas" && q.career !== career) return false;
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <QuestionCard question={q} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>Nenhuma questão encontrada com esses filtros.</p>
        </div>
      )}
    </div>
  );
}
