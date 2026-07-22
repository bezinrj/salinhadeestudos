import { useState } from "react";
import { useDisciplines } from "@/hooks/useDisciplines";
import { QuestionCard } from "@/components/QuestionCard";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectTreeSelect } from "@/components/SubjectTreeSelect";

const careers = ["Todas", "Delegado", "Magistratura Estadual", "Magistratura Federal", "Ministério Público", "Defensoria", "Procuradoria", "Analista", "EMERJ", "OAB 2ª Fase", "ENAM"] as const;
const types = ["Todas", "Gratuitas", "Premium"] as const;
const bancas = ["Todas", "CEBRASPE", "FGV", "VUNESP", "INÉDITA"] as const;
const statusOptions = ["Todas", "Resolvidas", "Não resolvidas"] as const;
const years = ["Todos", "2021", "2022", "2023", "2024", "2025", "2026"] as const;

export default function Discursivas() {
  const { disciplines } = useDisciplines();
  const [career, setCareer] = useState<string>("Todas");
  const [type, setType] = useState<string>("Todas");
  const [selectedBanca, setSelectedBanca] = useState<string>("Todas");
  const [statusFilter, setStatusFilter] = useState<string>("Todas");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("Todas");
  const [selectedSubject, setSelectedSubject] = useState<string>("Todas");
  const [selectedYear, setSelectedYear] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allQuestions = [], isLoading } = useQuery({
    queryKey: ["discursivas-questions"],
    queryFn: async () => {
      const [questionsRes, participantsRes] = await Promise.all([
        supabase
          .from("weekly_questions")
          .select("*")
          .is("album_id", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("weekly_answers")
          .select("question_id, user_id"),
      ]);
      if (questionsRes.error) throw questionsRes.error;

      // Count distinct users per question
      const countMap: Record<string, Set<string>> = {};
      for (const a of participantsRes.data || []) {
        if (!countMap[a.question_id]) countMap[a.question_id] = new Set();
        countMap[a.question_id].add(a.user_id);
      }

      return (questionsRes.data || []).map((q: any) => ({
        id: q.id,
        publicId: q.public_id as number,
        title: q.title,
        career: q.career,
        discipline: q.discipline,
        subject: q.subject || null,
        disciplines: Array.isArray(q.disciplines) ? q.disciplines : [],
        subjects: Array.isArray(q.subjects) ? q.subjects : [],
        statement: q.statement,
        difficulty: q.difficulty,
        participants: countMap[q.id]?.size || 0,
        isWeekly: q.is_weekly,
        isPremium: q.is_premium || q.is_weekly,
        banca: q.banca || null,
        year: q.year || null,
        deadline: q.deadline,
        barema: q.barema,
      }));
    },
  });

  // Fetch user's answered question IDs
  const { data: answeredIds = [] } = useQuery({
    queryKey: ["user-answered-ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("weekly_answers")
        .select("question_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((a: any) => a.question_id);
    },
    enabled: !!user?.id,
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
    if (q.isWeekly && q.deadline && new Date(q.deadline) > new Date()) return false;
    // Search by ID or title
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      // Match Q-code like "Q-001" or just "001" or "1"
      const qCodeMatch = query.match(/^q?-?(\d+)$/i);
      const matchesPublicId = qCodeMatch && q.publicId === parseInt(qCodeMatch[1]);
      const matchesTitle = q.title.toLowerCase().includes(query);
      if (!matchesPublicId && !matchesTitle) return false;
    }
    if (career !== "Todas" && q.career !== career) return false;
    if (selectedDiscipline !== "Todas" && q.discipline !== selectedDiscipline && !(q.disciplines || []).includes(selectedDiscipline)) return false;
    if (selectedSubject !== "Todas" && q.subject !== selectedSubject && !(q.subjects || []).includes(selectedSubject)) return false;
    if (selectedBanca !== "Todas" && q.banca !== selectedBanca) return false;
    if (selectedYear !== "Todos" && String(q.year) !== selectedYear) return false;
    const isPremium = q.isPremium || q.isWeekly;
    if (type === "Gratuitas" && isPremium) return false;
    if (type === "Premium" && !isPremium) return false;
    if (statusFilter === "Resolvidas" && !answeredIds.includes(q.id)) return false;
    if (statusFilter === "Não resolvidas" && answeredIds.includes(q.id)) return false;
    return true;
  });

  const handleDisciplineChange = (value: string) => {
    setSelectedDiscipline(value);
    setSelectedSubject("Todas");
  };

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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID ou título da questão..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 bg-secondary border-border"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Carreira - chips */}
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

        {/* Banca - chips */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Banca</p>
          <div className="flex flex-wrap gap-2">
            {bancas.map(b => (
              <Badge
                key={b}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors text-xs px-3 py-1",
                  selectedBanca === b
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
                onClick={() => setSelectedBanca(b)}
              >
                {b}
              </Badge>
            ))}
          </div>
        </div>

        {/* Ano - chips */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Ano</p>
          <div className="flex flex-wrap gap-2">
            {years.map(y => (
              <Badge
                key={y}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors text-xs px-3 py-1",
                  selectedYear === y
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
                onClick={() => setSelectedYear(y)}
              >
                {y}
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

        {/* Status - chips */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Status</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(s => (
              <Badge
                key={s}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors text-xs px-3 py-1",
                  statusFilter === s
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Matéria - dropdown */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Matéria</p>
            <Select value={selectedDiscipline} onValueChange={handleDisciplineChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as matérias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {disciplines.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assunto - tree select, depends on Matéria */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Assunto</p>
            <SubjectTreeSelect
              discipline={selectedDiscipline === "Todas" ? "" : selectedDiscipline}
              value={selectedSubject}
              onValueChange={setSelectedSubject}
              disabled={selectedDiscipline === "Todas"}
              placeholder={selectedDiscipline === "Todas" ? "Selecione uma matéria" : "Todos os assuntos"}
            />
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
