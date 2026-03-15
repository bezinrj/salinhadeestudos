export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  avatarUrl?: string;
  bio: string;
  targetCareer: string;
  totalScore: number;
  rankPosition: number;
  weeklyHours: number;
  totalEssays: number;
  averageGrade: number;
  streak: number;
  badges: Badge[];
  createdAt: string;
  subscription?: Subscription;
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

export interface Subscription {
  planId: string;
  planName: string;
  billingCycle: "monthly" | "quarterly" | "annual";
  priceMonthly: number;
  priceTotal: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
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
  avatarUrl?: string;
  score: number;
  position: number;
}

// ========== DB ENTITIES (mock) ==========

export interface DbDiscursiveAnswer {
  id: string;
  userId: string;
  questionId: string;
  answerText: string;
  score: number;
  feedback: string;
  createdAt: string;
}

export interface DbWeeklyRanking {
  userId: string;
  totalScore: number;
  updatedAt: string;
}

export interface DbAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface DbUserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

// ========== BADGES ==========

export const badges: Badge[] = [
  { id: "b1", name: "Primeira Discursiva Enviada", description: "Enviou sua primeira resposta discursiva", icon: "✍️", earned: false, category: "discursivas" },
  { id: "b2", name: "5 Discursivas Respondidas", description: "Respondeu 5 questões discursivas", icon: "📝", earned: false, category: "discursivas" },
  { id: "b3", name: "10 Discursivas Respondidas", description: "Respondeu 10 questões discursivas", icon: "🔥", earned: false, category: "discursivas" },
  { id: "b4", name: "Nota 8+", description: "Tirou nota 8 ou mais em uma discursiva", icon: "🎯", earned: false, category: "notas" },
  { id: "b5", name: "Nota 9+", description: "Tirou nota 9 ou mais em uma discursiva", icon: "⭐", earned: false, category: "notas" },
  { id: "b6", name: "Top 10 do Ranking", description: "Entrou no top 10 do ranking geral", icon: "🏅", earned: false, category: "ranking" },
  { id: "b7", name: "Top 3 da Semana", description: "Ficou entre os 3 melhores da semana", icon: "🏆", earned: false, category: "ranking" },
  { id: "b8", name: "Elite da Salinha", description: "Alcançou o 1º lugar do ranking geral", icon: "👑", earned: false, category: "ranking" },
  { id: "b9", name: "10 Horas de Estudo", description: "Acumulou 10 horas de estudo", icon: "📖", earned: false, category: "estudo" },
  { id: "b10", name: "50 Horas de Estudo", description: "Acumulou 50 horas de estudo", icon: "📚", earned: false, category: "estudo" },
  { id: "b11", name: "100 Horas de Estudo", description: "Acumulou 100 horas de estudo", icon: "🧠", earned: false, category: "estudo" },
  { id: "b12", name: "7 Dias de Sequência", description: "Estudou 7 dias seguidos", icon: "🏃", earned: false, category: "constância" },
  { id: "b13", name: "30 Dias de Sequência", description: "Estudou 30 dias seguidos", icon: "💎", earned: false, category: "constância" },
  { id: "b14", name: "Mestre da Constância", description: "Manteve estudo diário por 60 dias", icon: "🔱", earned: false, category: "constância" },
  { id: "b15", name: "Participou da Questão da Semana", description: "Respondeu o desafio semanal", icon: "📅", earned: false, category: "semanal" },
  { id: "b16", name: "Evolução Rápida", description: "Melhorou sua nota média em 1 ponto em 7 dias", icon: "🚀", earned: false, category: "evolução" },
];

// ========== MOCK USERS DB ==========

export const registeredUsers: User[] = [
  {
    id: "u1", username: "carlos_silva", name: "Carlos Silva", email: "carlos@email.com", password: "12345678",
    avatar: "CS", bio: "Concurseiro focado em Delegado. Estudando há 2 anos.", targetCareer: "Delegado",
    totalScore: 0, rankPosition: 0, weeklyHours: 0, totalEssays: 0, averageGrade: 0, streak: 0,
    badges: [], createdAt: "2026-01-15",
  },
];

// Current user starts null (must login)
export let currentUser: User | null = null;

export function setCurrentUser(user: User | null) {
  currentUser = user;
}

export function isUsernameTaken(username: string, excludeUserId?: string): boolean {
  return registeredUsers.some(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== excludeUserId);
}

export function registerUser(username: string, email: string, password: string): User {
  const initials = username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U";
  const newUser: User = {
    id: `u${Date.now()}`, username, name: username, email, password,
    avatar: initials, bio: "", targetCareer: "", totalScore: 0, rankPosition: 0,
    weeklyHours: 0, totalEssays: 0, averageGrade: 0, streak: 0,
    badges: [...badges], createdAt: new Date().toISOString().split("T")[0],
  };
  registeredUsers.push(newUser);
  return newUser;
}

export function loginUser(email: string, password: string): User | null {
  return registeredUsers.find(u => u.email === email && u.password === password) || null;
}

export function updateUserProfile(userId: string, updates: Partial<Pick<User, "name" | "bio" | "avatarUrl" | "targetCareer" | "username">>): User | null {
  const user = registeredUsers.find(u => u.id === userId);
  if (!user) return null;
  Object.assign(user, updates);
  return user;
}

// ========== DEMO RANKING (landing page only) ==========

export const demoRanking: RankingEntry[] = [
  { userId: "demo1", name: "Ana Beatriz", avatar: "AB", score: 87, position: 1 },
  { userId: "demo2", name: "Pedro Henrique", avatar: "PH", score: 72, position: 2 },
  { userId: "demo3", name: "Marina Costa", avatar: "MC", score: 65, position: 3 },
  { userId: "demo4", name: "Lucas Oliveira", avatar: "LO", score: 53, position: 4 },
  { userId: "demo5", name: "Juliana Santos", avatar: "JS", score: 41, position: 5 },
];

// ========== REAL RANKINGS (zeroed, based on weekly scores) ==========

export const weeklyScores: DbDiscursiveAnswer[] = [];

export function getWeeklyRanking(): RankingEntry[] {
  const scoreMap = new Map<string, number>();
  for (const answer of weeklyScores) {
    scoreMap.set(answer.userId, (scoreMap.get(answer.userId) || 0) + answer.score);
  }
  const entries: RankingEntry[] = [];
  for (const user of registeredUsers) {
    entries.push({
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      avatarUrl: user.avatarUrl,
      score: scoreMap.get(user.id) || 0,
      position: 0,
    });
  }
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => { e.position = i + 1; });
  return entries;
}

export function addWeeklyScore(userId: string, questionId: string, score: number, answerText: string, feedback: string) {
  weeklyScores.push({
    id: `da-${Date.now()}`,
    userId,
    questionId,
    answerText,
    score,
    feedback,
    createdAt: new Date().toISOString(),
  });
  // Update user stats
  const user = registeredUsers.find(u => u.id === userId);
  if (user) {
    user.totalEssays += 1;
    const userScores = weeklyScores.filter(s => s.userId === userId);
    user.totalScore = userScores.reduce((sum, s) => sum + s.score, 0);
    user.averageGrade = userScores.length > 0 ? Math.round((user.totalScore / userScores.length) * 10) / 10 : 0;
    user.rankPosition = getWeeklyRanking().find(e => e.userId === userId)?.position || 0;
  }
}

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
  participants: 0,
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
    userId: currentUser?.id || "",
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

export const recentCorrections: { questionTitle: string; grade: number; maxGrade: number; date: string; career: string }[] = [];

export const weeklyStudyData = [
  { day: "Seg", hours: 0 },
  { day: "Ter", hours: 0 },
  { day: "Qua", hours: 0 },
  { day: "Qui", hours: 0 },
  { day: "Sex", hours: 0 },
  { day: "Sáb", hours: 0 },
  { day: "Dom", hours: 0 },
];

// Seed some mock study sessions for the current user
const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const seedSessions: StudySession[] = [
  { id: "ss1", userId: "u1", discipline: "Processo Penal", startTime: "08:00", endTime: "09:30", duration: 90, date: fmt(today) },
  { id: "ss2", userId: "u1", discipline: "Direito Penal", startTime: "10:00", endTime: "11:15", duration: 75, date: fmt(today) },
  { id: "ss3", userId: "u1", discipline: "Direito Constitucional", startTime: "14:00", endTime: "15:00", duration: 60, date: fmt(new Date(today.getTime() - 86400000)) },
  { id: "ss4", userId: "u1", discipline: "Processo Penal", startTime: "09:00", endTime: "11:00", duration: 120, date: fmt(new Date(today.getTime() - 2 * 86400000)) },
  { id: "ss5", userId: "u1", discipline: "Direito Administrativo", startTime: "15:00", endTime: "16:30", duration: 90, date: fmt(new Date(today.getTime() - 3 * 86400000)) },
  { id: "ss6", userId: "u1", discipline: "Direito Civil", startTime: "08:00", endTime: "09:00", duration: 60, date: fmt(new Date(today.getTime() - 4 * 86400000)) },
  { id: "ss7", userId: "u1", discipline: "Direito Penal", startTime: "10:00", endTime: "12:00", duration: 120, date: fmt(new Date(today.getTime() - 5 * 86400000)) },
  { id: "ss8", userId: "u1", discipline: "Legislação Penal Especial", startTime: "14:00", endTime: "15:30", duration: 90, date: fmt(new Date(today.getTime() - 6 * 86400000)) },
];

export const studySessions: StudySession[] = [...seedSessions];

export function addStudySession(session: StudySession) {
  studySessions.push(session);
}

export function getUserStudyStats(userId: string) {
  const now = new Date();
  const todayStr = fmt(now);
  const userSessions = studySessions.filter(s => s.userId === userId);

  // Hours today
  const todayMinutes = userSessions.filter(s => s.date === todayStr).reduce((sum, s) => sum + s.duration, 0);

  // Hours this week (Mon-Sun)
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon
  const mondayMs = now.getTime() - dayOfWeek * 86400000;
  const mondayStr = fmt(new Date(mondayMs));
  const weekMinutes = userSessions.filter(s => s.date >= mondayStr && s.date <= todayStr).reduce((sum, s) => sum + s.duration, 0);

  // Hours this month
  const monthStart = todayStr.slice(0, 8) + "01";
  const monthMinutes = userSessions.filter(s => s.date >= monthStart && s.date <= todayStr).reduce((sum, s) => sum + s.duration, 0);

  // Streak: consecutive days with sessions ending today
  const datesWithSessions = new Set(userSessions.map(s => s.date));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = fmt(new Date(now.getTime() - i * 86400000));
    if (datesWithSessions.has(checkDate)) {
      streak++;
    } else {
      break;
    }
  }

  return {
    todayHours: todayMinutes / 60,
    weekHours: weekMinutes / 60,
    monthHours: monthMinutes / 60,
    streak,
  };
}

export function getWeeklyChartData(userId: string) {
  const now = new Date();
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const mondayMs = now.getTime() - dayOfWeek * 86400000;
  const userSessions = studySessions.filter(s => s.userId === userId);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayMs + i * 86400000);
    const dateStr = fmt(d);
    const mins = userSessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.duration, 0);
    return { day: dayNames[d.getDay()], hours: +(mins / 60).toFixed(1) };
  });
}

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

export const hoursRanking: RankingEntry[] = [];
