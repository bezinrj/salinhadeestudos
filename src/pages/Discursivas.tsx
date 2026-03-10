import { questions } from "@/data/mockData";
import { QuestionCard } from "@/components/QuestionCard";
import { motion } from "framer-motion";

export default function Discursivas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Discursivas</h1>
        <p className="text-sm text-muted-foreground mt-1">Escolha uma questão e envie sua resposta para correção</p>
      </div>

      {/* Questions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questions.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <QuestionCard question={q} />
          </motion.div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>Nenhuma questão disponível no momento.</p>
        </div>
      )}
    </div>
  );
}
