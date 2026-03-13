import { useState } from "react";
import { questions } from "@/data/mockData";
import { QuestionCard } from "@/components/QuestionCard";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const difficulties = ["Todas", "Fácil", "Médio", "Difícil"] as const;
const careers = ["Todas", "Delegado", "Magistratura", "Promotoria"] as const;

export default function Discursivas() {
  const [difficulty, setDifficulty] = useState<string>("Todas");
  const [career, setCareer] = useState<string>("Todas");

  const filtered = questions.filter(q => {
    if (difficulty !== "Todas" && q.difficulty !== difficulty) return false;
    if (career !== "Todas" && q.career !== career) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Discursivas</h1>
        <p className="text-sm text-muted-foreground mt-1">Escolha uma questão e envie sua resposta para correção</p>
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
