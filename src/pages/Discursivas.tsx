import { useState } from "react";
import { questions } from "@/data/mockData";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const careers = ["Todos", "Delegado", "Magistratura", "Promotoria"];
const disciplinesList = ["Todas", "Processo Penal", "Direito Penal", "Direito Constitucional", "Direito Administrativo", "Legislação Penal Especial", "Direito Processual Civil"];

export default function Discursivas() {
  const [career, setCareer] = useState("Todos");
  const [discipline, setDiscipline] = useState("Todas");

  const filtered = questions.filter(q => {
    if (career !== "Todos" && q.career !== career) return false;
    if (discipline !== "Todas" && q.discipline !== discipline) return false;
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
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Carreira</p>
          <div className="flex flex-wrap gap-2">
            {careers.map(c => (
              <Button key={c} variant="outline" size="sm"
                className={cn("text-xs", career === c ? "bg-primary/10 border-primary/30 text-primary" : "border-border")}
                onClick={() => setCareer(c)}>
                {c}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Disciplina</p>
          <div className="flex flex-wrap gap-2">
            {disciplinesList.map(d => (
              <Badge key={d} variant="outline"
                className={cn("cursor-pointer text-xs py-1", discipline === d ? "bg-secondary border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground")}
                onClick={() => setDiscipline(d)}>
                {d}
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
          <p>Nenhuma questão encontrada com os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
}
