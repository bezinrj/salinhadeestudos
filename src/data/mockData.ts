export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  targetCareer: string;
  totalScore: number;
  rankPosition: number;
  weeklyHours: number;
  totalEssays: number;
  averageGrade: number;
  streak: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  category?: string;
}

export interface Question {
  id: string;
  title: string;
  career: "Delegado" | "Magistratura" | "Promotoria";
  discipline: string;
  statement: string;
  difficulty: "Fácil" | "Médio" | "Difícil";
  participants: number;
  isWeekly?: boolean;
  deadline?: string;
  barema?: BaremaItem[];
}

export interface BaremaItem {
  letter: string;
  title: string;
  maxScore: number;
  subitems: BaremaSubitem[];
}

export interface BaremaSubitem {
  id: string;
  description: string;
  maxScore: number;
  keywords: string[];
}

export interface CorrectionResult {
  id: string;
  questionId: string;
  userId: string;
  answer: string;
  grade: number;
  maxGrade: number;
  mirror: string;
  positives: string[];
  errors: string[];
  omissions: string[];
  idealAnswer: string;
  feedback: string;
  createdAt: string;
  baremaBreakdown: BaremaScore[];
}

export interface BaremaScore {
  letter: string;
  title: string;
  maxScore: number;
  earnedScore: number;
  subitems: { description: string; maxScore: number; earnedScore: number; status: "full" | "partial" | "missed" }[];
}

export interface StudySession {
  id: string;
  userId: string;
  discipline: string;
  startTime: string;
  endTime: string;
  duration: number;
  date: string;
}

export interface RankingEntry {
  userId: string;
  name: string;
  avatar: string;
  score: number;
  position: number;
}

// ========== BADGES ==========

export const badges: Badge[] = [
  // Discursivas
  { id: "b1", name: "Primeira Discursiva Enviada", description: "Enviou sua primeira resposta discursiva", icon: "✍️", earned: true, earnedAt: "2026-02-10", category: "discursivas" },
  { id: "b2", name: "5 Discursivas Respondidas", description: "Respondeu 5 questões discursivas", icon: "📝", earned: true, earnedAt: "2026-02-15", category: "discursivas" },
  { id: "b3", name: "10 Discursivas Respondidas", description: "Respondeu 10 questões discursivas", icon: "🔥", earned: true, earnedAt: "2026-02-20", category: "discursivas" },
  // Notas
  { id: "b4", name: "Nota 8+", description: "Tirou nota 8 ou mais em uma discursiva", icon: "🎯", earned: true, earnedAt: "2026-02-22", category: "notas" },
  { id: "b5", name: "Nota 9+", description: "Tirou nota 9 ou mais em uma discursiva", icon: "⭐", earned: false, category: "notas" },
  // Ranking
  { id: "b6", name: "Top 10 do Ranking", description: "Entrou no top 10 do ranking geral", icon: "🏅", earned: true, earnedAt: "2026-02-25", category: "ranking" },
  { id: "b7", name: "Top 3 da Semana", description: "Ficou entre os 3 melhores da semana", icon: "🏆", earned: true, earnedAt: "2026-03-01", category: "ranking" },
  { id: "b8", name: "Elite da Salinha", description: "Alcançou o 1º lugar do ranking geral", icon: "👑", earned: false, category: "ranking" },
  // Estudo
  { id: "b9", name: "10 Horas de Estudo", description: "Acumulou 10 horas de estudo", icon: "📖", earned: true, earnedAt: "2026-02-12", category: "estudo" },
  { id: "b10", name: "50 Horas de Estudo", description: "Acumulou 50 horas de estudo", icon: "📚", earned: true, earnedAt: "2026-03-02", category: "estudo" },
  { id: "b11", name: "100 Horas de Estudo", description: "Acumulou 100 horas de estudo", icon: "🧠", earned: false, category: "estudo" },
  // Sequência
  { id: "b12", name: "7 Dias de Sequência", description: "Estudou 7 dias seguidos", icon: "🏃", earned: true, earnedAt: "2026-02-28", category: "constância" },
  { id: "b13", name: "30 Dias de Sequência", description: "Estudou 30 dias seguidos", icon: "💎", earned: false, category: "constância" },
  { id: "b14", name: "Mestre da Constância", description: "Manteve estudo diário por 60 dias", icon: "🔱", earned: false, category: "constância" },
  // Semana
  { id: "b15", name: "Participou da Questão da Semana", description: "Respondeu o desafio semanal", icon: "📅", earned: true, earnedAt: "2026-03-03", category: "semanal" },
  // Evolução
  { id: "b16", name: "Evolução Rápida", description: "Melhorou sua nota média em 1 ponto em 7 dias", icon: "🚀", earned: false, category: "evolução" },
];

export const currentUser: User = {
  id: "u1",
  name: "Carlos Silva",
  email: "carlos@email.com",
  avatar: "CS",
  targetCareer: "Delegado",
  totalScore: 2450,
  rankPosition: 4,
  weeklyHours: 23.5,
  totalEssays: 18,
  averageGrade: 7.8,
  streak: 12,
  badges: badges.filter(b => b.earned),
};

export const mockUsers: RankingEntry[] = [
  { userId: "u10", name: "Ana Beatriz", avatar: "AB", score: 3200, position: 1 },
  { userId: "u11", name: "Pedro Henrique", avatar: "PH", score: 3050, position: 2 },
  { userId: "u12", name: "Marina Costa", avatar: "MC", score: 2800, position: 3 },
  { userId: "u1", name: "Carlos Silva", avatar: "CS", score: 2450, position: 4 },
  { userId: "u13", name: "Lucas Oliveira", avatar: "LO", score: 2300, position: 5 },
  { userId: "u14", name: "Juliana Santos", avatar: "JS", score: 2150, position: 6 },
  { userId: "u15", name: "Rafael Mendes", avatar: "RM", score: 2000, position: 7 },
  { userId: "u16", name: "Fernanda Lima", avatar: "FL", score: 1850, position: 8 },
  { userId: "u17", name: "Gustavo Rocha", avatar: "GR", score: 1700, position: 9 },
  { userId: "u18", name: "Isabela Ferreira", avatar: "IF", score: 1550, position: 10 },
  { userId: "u19", name: "Thiago Alves", avatar: "TA", score: 1400, position: 11 },
  { userId: "u20", name: "Camila Ramos", avatar: "CR", score: 1250, position: 12 },
  { userId: "u21", name: "Diego Martins", avatar: "DM", score: 1100, position: 13 },
  { userId: "u22", name: "Larissa Nunes", avatar: "LN", score: 950, position: 14 },
  { userId: "u23", name: "Bruno Cardoso", avatar: "BC", score: 800, position: 15 },
];

// ========== QUESTÃO ÚNICA ==========

const questionBarema: BaremaItem[] = [
  {
    letter: "a",
    title: "Diferença entre prova ilegal, ilícita e ilegítima",
    maxScore: 2.5,
    subitems: [
      { id: "a1", description: "Prova ilegal = gênero, abrangendo desconformidade com o ordenamento jurídico", maxScore: 0.6, keywords: ["ilegal", "gênero", "desconformidade", "ordenamento"] },
      { id: "a2", description: "Prova ilícita = violação a norma material ou direito fundamental (CF art. 5º, LVI), interceptação sem ordem judicial", maxScore: 0.9, keywords: ["ilícita", "norma material", "direito fundamental", "art. 5", "interceptação", "LVI"] },
      { id: "a3", description: "Prova ilegítima = violação a norma processual, forma, rito ou garantias processuais", maxScore: 0.7, keywords: ["ilegítima", "norma processual", "forma", "rito", "garantia"] },
      { id: "a4", description: "Consequência jurídica = inadmissibilidade/desentranhamento para ilícitas e nulidades para ilegítimas", maxScore: 0.3, keywords: ["inadmissibilidade", "desentranhamento", "nulidade", "consequência"] },
    ],
  },
  {
    letter: "b",
    title: "Serendipidade: conceito, espécies e incidência",
    maxScore: 2.5,
    subitems: [
      { id: "b1", description: "Conceito = achado fortuito de prova de crime ou pessoa diversa durante diligência lícita", maxScore: 1.0, keywords: ["serendipidade", "achado fortuito", "encontro fortuito", "crime diverso", "diligência"] },
      { id: "b2", description: "Espécies = objetiva (crime diverso) e subjetiva (pessoa diversa)", maxScore: 0.8, keywords: ["objetiva", "subjetiva", "crime diverso", "pessoa diversa", "espécie"] },
      { id: "b3", description: "Caso concreto = não incide serendipidade válida, pois achado decorreu de atuação ilícita", maxScore: 0.7, keywords: ["não incide", "ilícita", "sem autorização", "atuação irregular", "não se aplica"] },
    ],
  },
  {
    letter: "c",
    title: "Frutos da árvore envenenada + exceções",
    maxScore: 2.5,
    subitems: [
      { id: "c1", description: "Regra = prova derivada de prova ilícita também é ilícita (fruits of the poisonous tree)", maxScore: 1.2, keywords: ["derivada", "ilícita", "frutos", "árvore envenenada", "contaminada", "poisonous"] },
      { id: "c2", description: "Base legal = CPP, art. 157, §1º, matriz constitucional de inadmissibilidade", maxScore: 0.6, keywords: ["art. 157", "CPP", "§1", "constitucional", "inadmissibilidade"] },
      { id: "c3", description: "Exceções = fonte independente, descoberta inevitável e nexo causal atenuado / mancha purgada", maxScore: 0.7, keywords: ["fonte independente", "descoberta inevitável", "nexo causal atenuado", "mancha purgada", "exceção", "independent source"] },
    ],
  },
  {
    letter: "d",
    title: "Busca e apreensão: licitude no caso concreto",
    maxScore: 2.5,
    subitems: [
      { id: "d1", description: "Sim, é possível reconhecer a licitude, se houver rompimento do nexo causal", maxScore: 1.3, keywords: ["sim", "possível", "licitude", "lícita", "rompimento", "nexo causal"] },
      { id: "d2", description: "Teoria = fonte independente, caminho probatório autônomo, ausência de dependência da prova ilícita", maxScore: 0.9, keywords: ["fonte independente", "autônomo", "independent source", "caminho probatório", "independente"] },
      { id: "d3", description: "Aplicação = denúncia anônima + diligências independentes + decisão judicial fundamentada; denúncia anônima isolada não basta", maxScore: 0.3, keywords: ["denúncia anônima", "diligência", "decisão judicial", "fundamentada", "corroboração"] },
    ],
  },
];

export const questions: Question[] = [
  {
    id: "q1",
    title: "Provas Ilícitas, Serendipidade e Frutos da Árvore Envenenada",
    career: "Delegado",
    discipline: "Processo Penal",
    statement: `No curso de investigação policial instaurada para apuração de crime diverso, um investigador, sem autorização judicial e fora dos limites de meio de obtenção de prova legal, teve acesso fortuito a comunicações privadas de um suspeito, tomando conhecimento de que um galpão estaria sendo usado para guardar entorpecentes. A informação não decorreu de diligência autorizada nem de técnica investigativa lícita, configurando achado casual oriundo de atuação irregular.

Ocorre que, sem que o conteúdo dessa captação irregular fosse documentado, compartilhado ou utilizado na investigação, outra equipe policial, atuando de forma autônoma no mesmo procedimento, recebeu denúncia anônima minuciosa, indicando o mesmo endereço como ponto de armazenamento de drogas e descrevendo a dinâmica do imóvel e apontando horários e pessoas envolvidas na guarda do local diariamente.

Com base nessa notícia, o delegado promoveu diligências preliminares independentes e, a partir dos elementos colhidos, representou ao Judiciário pela expedição de mandado de busca e apreensão, deferido por decisão fundamentada.

No cumprimento da ordem, foram apreendidos entorpecentes em grande quantidade e armamento de uso restrito, culminando na prisão em flagrante do investigado. A defesa sustenta a ilicitude das provas, por derivação, invocando a teoria dos frutos da árvore envenenada.

Diante desse contexto, responda, de forma fundamentada:

a) Diferencie prova ilegal, ilícita e ilegítima.

b) Conceitue a serendipidade e analise sua incidência no caso concreto.

c) Explique a Teoria dos Frutos da Árvore Envenenada, indicando sua aplicação no ordenamento jurídico brasileiro e as principais exceções admitidas pela legislação e pela jurisprudência.

d) É possível reconhecer a licitude das provas obtidas por meio da busca e apreensão no caso narrado? Em caso afirmativo, indique a teoria aplicável, seus pressupostos e a razão pela qual a prova não deve ser considerada contaminada.`,
    difficulty: "Difícil",
    participants: 45,
    barema: questionBarema,
  },
];

export const weeklyQuestion: Question = {
  ...questions[0],
  id: "qw1",
  title: "Desafio Semanal: Provas Ilícitas e Serendipidade",
  isWeekly: true,
  deadline: "2026-03-15T23:59:59",
  participants: 28,
};

// ========== CORRECTION ENGINE ==========

export function evaluateAnswer(answer: string, barema: BaremaItem[]): CorrectionResult {
  const normalizedAnswer = answer.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const baremaBreakdown: BaremaScore[] = [];
  let totalEarned = 0;
  const allPositives: string[] = [];
  const allErrors: string[] = [];
  const allOmissions: string[] = [];

  for (const item of barema) {
    const scoredSubitems: BaremaScore["subitems"] = [];
    let itemEarned = 0;

    for (const sub of item.subitems) {
      const normalizedKeywords = sub.keywords.map(k => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      const matchCount = normalizedKeywords.filter(kw => normalizedAnswer.includes(kw)).length;
      const matchRatio = matchCount / normalizedKeywords.length;

      let earnedScore: number;
      let status: "full" | "partial" | "missed";

      if (matchRatio >= 0.5) {
        earnedScore = sub.maxScore;
        status = "full";
        allPositives.push(`[Item ${item.letter}] ${sub.description}`);
      } else if (matchRatio > 0) {
        earnedScore = Math.round(sub.maxScore * 0.5 * 100) / 100;
        status = "partial";
        allErrors.push(`[Item ${item.letter}] Abordagem incompleta: ${sub.description}`);
      } else {
        earnedScore = 0;
        status = "missed";
        allOmissions.push(`[Item ${item.letter}] Não mencionou: ${sub.description}`);
      }

      itemEarned += earnedScore;
      scoredSubitems.push({ description: sub.description, maxScore: sub.maxScore, earnedScore, status });
    }

    itemEarned = Math.round(itemEarned * 100) / 100;
    totalEarned += itemEarned;
    baremaBreakdown.push({ letter: item.letter, title: item.title, maxScore: item.maxScore, earnedScore: itemEarned, subitems: scoredSubitems });
  }

  totalEarned = Math.round(totalEarned * 10) / 10;

  // Generate feedback
  let feedback: string;
  if (totalEarned >= 8) {
    feedback = "Excelente desempenho! Sua resposta demonstra domínio do conteúdo. Continue aperfeiçoando os pontos indicados para alcançar nota máxima.";
  } else if (totalEarned >= 6) {
    feedback = "Bom desempenho! Você demonstra conhecimento da matéria, mas precisa aprofundar em alguns pontos do espelho. Revise os itens com pontuação parcial ou zerada.";
  } else if (totalEarned >= 3) {
    feedback = "Desempenho mediano. Há lacunas significativas na sua resposta. Recomendo revisar todo o espelho e trabalhar os conceitos fundamentais de cada item.";
  } else {
    feedback = "Sua resposta apresenta muitas lacunas. Recomendo estudar o tema com profundidade antes de tentar novamente. Foque nos conceitos básicos e na estrutura do espelho.";
  }

  return {
    id: `corr-${Date.now()}`,
    questionId: "q1",
    userId: "u1",
    answer,
    grade: totalEarned,
    maxGrade: 10,
    mirror: "O espelho exigia: (a) diferenciação entre prova ilegal (gênero), ilícita (violação material/fundamental) e ilegítima (violação processual), com consequências jurídicas; (b) conceito de serendipidade, espécies objetiva e subjetiva, e análise de não incidência no caso por origem ilícita; (c) teoria dos frutos da árvore envenenada (art. 157, §1º, CPP) e exceções (fonte independente, descoberta inevitável, nexo atenuado); (d) possibilidade de reconhecer licitude pela teoria da fonte independente, dado o caminho probatório autônomo via denúncia anônima corroborada e decisão judicial fundamentada.",
    positives: allPositives.length > 0 ? allPositives : ["Nenhum ponto do espelho foi adequadamente abordado."],
    errors: allErrors.length > 0 ? allErrors : [],
    omissions: allOmissions.length > 0 ? allOmissions : [],
    idealAnswer: `a) Prova ilegal é gênero que abrange toda prova obtida em desconformidade com o ordenamento jurídico. A prova ilícita, espécie do gênero, resulta da violação a normas de direito material ou direitos fundamentais (CF, art. 5º, LVI), como interceptação sem autorização judicial. Já a prova ilegítima decorre de violação a normas processuais, de forma, rito ou garantias. A consequência da prova ilícita é sua inadmissibilidade e desentranhamento dos autos; para a ilegítima, aplica-se o regime das nulidades processuais.

b) Serendipidade é o achado fortuito de prova de crime ou pessoa diversa no curso de diligência lícita. Divide-se em objetiva (crime diverso do investigado) e subjetiva (pessoa diversa da investigada). No caso concreto, NÃO incide serendipidade válida, pois o achado decorreu de atuação irregular e ilícita do investigador, sem autorização judicial, não de diligência lícita.

c) A Teoria dos Frutos da Árvore Envenenada (fruits of the poisonous tree) estabelece que a prova derivada de prova ilícita também é ilícita, por contaminação. No Brasil, está positivada no art. 157, §1º do CPP, com matriz no art. 5º, LVI da CF. As exceções são: (i) fonte independente – quando a prova derivada puder ser obtida por fonte autônoma; (ii) descoberta inevitável – quando a prova seria inevitavelmente descoberta por meios lícitos; (iii) nexo causal atenuado (mancha purgada) – quando circunstâncias supervenientes rompem o vínculo com a ilicitude originária.

d) Sim, é possível reconhecer a licitude das provas da busca e apreensão. A teoria aplicável é a da fonte independente. No caso, outra equipe policial, atuando autonomamente, recebeu denúncia anônima detalhada, realizou diligências preliminares independentes e obteve decisão judicial fundamentada, sem qualquer utilização da prova ilícita originária. Houve caminho probatório inteiramente autônomo, rompendo o nexo causal com a ilicitude. Importante observar que a denúncia anônima isolada não bastaria – foi necessária sua corroboração por diligências independentes.`,
    feedback,
    createdAt: new Date().toISOString().split("T")[0],
    baremaBreakdown,
  };
}

export const recentCorrections: { questionTitle: string; grade: number; maxGrade: number; date: string; career: string }[] = [
  { questionTitle: "Provas Ilícitas e Serendipidade", grade: 7.5, maxGrade: 10, date: "2026-03-05", career: "Delegado" },
  { questionTitle: "Princípio da Insignificância", grade: 8.2, maxGrade: 10, date: "2026-03-03", career: "Magistratura" },
  { questionTitle: "Inquérito Policial", grade: 9.0, maxGrade: 10, date: "2026-03-01", career: "Delegado" },
  { questionTitle: "Lei Maria da Penha", grade: 6.8, maxGrade: 10, date: "2026-02-27", career: "Delegado" },
  { questionTitle: "Crimes contra a Adm. Pública", grade: 7.0, maxGrade: 10, date: "2026-02-25", career: "Promotoria" },
];

export const weeklyStudyData = [
  { day: "Seg", hours: 4.5 },
  { day: "Ter", hours: 3.0 },
  { day: "Qua", hours: 5.2 },
  { day: "Qui", hours: 2.8 },
  { day: "Sex", hours: 4.0 },
  { day: "Sáb", hours: 2.5 },
  { day: "Dom", hours: 1.5 },
];

export const studySessions: StudySession[] = [
  { id: "s1", userId: "u1", discipline: "Processo Penal", startTime: "08:00", endTime: "10:30", duration: 150, date: "2026-03-06" },
  { id: "s2", userId: "u1", discipline: "Direito Constitucional", startTime: "14:00", endTime: "16:00", duration: 120, date: "2026-03-06" },
  { id: "s3", userId: "u1", discipline: "Direito Penal", startTime: "19:00", endTime: "20:30", duration: 90, date: "2026-03-05" },
  { id: "s4", userId: "u1", discipline: "Direito Administrativo", startTime: "08:00", endTime: "11:00", duration: 180, date: "2026-03-05" },
];

export const disciplines = [
  "Processo Penal",
  "Direito Penal",
  "Direito Constitucional",
  "Direito Administrativo",
  "Direito Civil",
  "Processo Civil",
  "Legislação Penal Especial",
  "Direitos Humanos",
  "Criminologia",
  "Medicina Legal",
];

export const hoursRanking: RankingEntry[] = [
  { userId: "u12", name: "Marina Costa", avatar: "MC", score: 42, position: 1 },
  { userId: "u10", name: "Ana Beatriz", avatar: "AB", score: 38, position: 2 },
  { userId: "u11", name: "Pedro Henrique", avatar: "PH", score: 35, position: 3 },
  { userId: "u1", name: "Carlos Silva", avatar: "CS", score: 23.5, position: 4 },
  { userId: "u14", name: "Juliana Santos", avatar: "JS", score: 22, position: 5 },
  { userId: "u13", name: "Lucas Oliveira", avatar: "LO", score: 20, position: 6 },
  { userId: "u16", name: "Fernanda Lima", avatar: "FL", score: 18, position: 7 },
  { userId: "u15", name: "Rafael Mendes", avatar: "RM", score: 16, position: 8 },
  { userId: "u17", name: "Gustavo Rocha", avatar: "GR", score: 14, position: 9 },
  { userId: "u18", name: "Isabela Ferreira", avatar: "IF", score: 12, position: 10 },
];
