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
}

export interface Correction {
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
}

export interface StudySession {
  id: string;
  userId: string;
  discipline: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  date: string;
}

export interface RankingEntry {
  userId: string;
  name: string;
  avatar: string;
  score: number;
  position: number;
}

export const badges: Badge[] = [
  { id: "1", name: "Primeira Discursiva", description: "Respondeu sua primeira discursiva", icon: "✍️", earned: true, earnedAt: "2026-02-10" },
  { id: "2", name: "10 Questões", description: "Respondeu 10 discursivas", icon: "🔥", earned: true, earnedAt: "2026-02-20" },
  { id: "3", name: "Maratonista", description: "Estudou 7 dias seguidos", icon: "🏃", earned: true, earnedAt: "2026-02-28" },
  { id: "4", name: "Top 3 Semanal", description: "Ficou entre os 3 melhores da semana", icon: "🏆", earned: true, earnedAt: "2026-03-01" },
  { id: "5", name: "Nota Máxima", description: "Tirou nota máxima em uma discursiva", icon: "⭐", earned: false },
  { id: "6", name: "100 Horas", description: "Acumulou 100 horas de estudo", icon: "📚", earned: false },
  { id: "7", name: "Mestre das Peças", description: "Respondeu 50 discursivas", icon: "👑", earned: false },
  { id: "8", name: "Incansável", description: "Estudou 30 dias seguidos", icon: "💎", earned: false },
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

export const questions: Question[] = [
  { id: "q1", title: "Prisão em Flagrante e Controle Judicial", career: "Delegado", discipline: "Processo Penal", statement: "Discorra sobre a prisão em flagrante delito, abordando: (a) as espécies de flagrante previstas no CPP; (b) o procedimento a ser adotado pela autoridade policial; (c) a necessidade de controle judicial e o prazo para análise pelo juiz; (d) as medidas alternativas à conversão em prisão preventiva.", difficulty: "Difícil", participants: 45 },
  { id: "q2", title: "Princípio da Insignificância", career: "Magistratura", discipline: "Direito Penal", statement: "Analise o princípio da insignificância no Direito Penal brasileiro, discorrendo sobre: (a) conceito e fundamento; (b) requisitos para aplicação segundo a jurisprudência do STF; (c) hipóteses em que a jurisprudência veda sua aplicação; (d) relação com o princípio da intervenção mínima.", difficulty: "Médio", participants: 62 },
  { id: "q3", title: "Controle de Constitucionalidade", career: "Promotoria", discipline: "Direito Constitucional", statement: "Disserte sobre o controle de constitucionalidade no Brasil, abordando: (a) as espécies de controle quanto ao momento e ao órgão; (b) as ações do controle concentrado; (c) a legitimidade ativa para propositura; (d) os efeitos da decisão de inconstitucionalidade.", difficulty: "Difícil", participants: 38 },
  { id: "q4", title: "Responsabilidade Civil do Estado", career: "Magistratura", discipline: "Direito Administrativo", statement: "Aborde a responsabilidade civil do Estado, discorrendo sobre: (a) fundamento constitucional; (b) teoria do risco administrativo vs. risco integral; (c) excludentes de responsabilidade; (d) ação regressiva contra o agente público.", difficulty: "Médio", participants: 51 },
  { id: "q5", title: "Inquérito Policial", career: "Delegado", discipline: "Processo Penal", statement: "Discorra sobre o inquérito policial, abordando: (a) natureza jurídica e características; (b) formas de instauração; (c) prazo para conclusão; (d) arquivamento e desarquivamento; (e) investigação pelo Ministério Público.", difficulty: "Fácil", participants: 73 },
  { id: "q6", title: "Crimes contra a Administração Pública", career: "Promotoria", discipline: "Direito Penal", statement: "Analise os crimes de corrupção passiva e corrupção ativa, abordando: (a) elementos típicos; (b) distinções entre os tipos; (c) causa de aumento de pena; (d) corrupção privilegiada.", difficulty: "Médio", participants: 44 },
  { id: "q7", title: "Ação Civil Pública", career: "Promotoria", discipline: "Direito Processual Civil", statement: "Disserte sobre a Ação Civil Pública como instrumento de tutela coletiva, abordando: (a) objeto e cabimento; (b) legitimidade ativa; (c) competência; (d) efeitos da coisa julgada.", difficulty: "Difícil", participants: 29 },
  { id: "q8", title: "Lei Maria da Penha", career: "Delegado", discipline: "Legislação Penal Especial", statement: "Discorra sobre a Lei 11.340/2006 (Lei Maria da Penha), abordando: (a) formas de violência doméstica; (b) medidas protetivas de urgência; (c) papel da autoridade policial; (d) inaplicabilidade da Lei 9.099/95.", difficulty: "Médio", participants: 56 },
  { id: "q9", title: "Direitos Fundamentais Sociais", career: "Magistratura", discipline: "Direito Constitucional", statement: "Analise os direitos fundamentais sociais na CF/88, abordando: (a) natureza prestacional; (b) eficácia e aplicabilidade; (c) reserva do possível vs. mínimo existencial; (d) controle judicial de políticas públicas.", difficulty: "Difícil", participants: 41 },
  { id: "q10", title: "Cadeia de Custódia da Prova", career: "Delegado", discipline: "Processo Penal", statement: "Discorra sobre a cadeia de custódia da prova no processo penal, abordando: (a) conceito e previsão legal; (b) etapas da cadeia de custódia; (c) consequências da quebra; (d) jurisprudência do STJ sobre o tema.", difficulty: "Médio", participants: 35 },
];

export const weeklyQuestion: Question = {
  id: "qw1",
  title: "Desafio Semanal: Abuso de Autoridade",
  career: "Delegado",
  discipline: "Legislação Penal Especial",
  statement: "Analise a Lei 13.869/2019 (Lei de Abuso de Autoridade), discorrendo sobre: (a) o elemento subjetivo especial do tipo; (b) as principais condutas tipificadas; (c) as penas e efeitos da condenação; (d) a ação penal e as causas de aumento de pena. Fundamente sua resposta com base na doutrina e jurisprudência.",
  difficulty: "Difícil",
  participants: 28,
  isWeekly: true,
  deadline: "2026-03-08T23:59:59",
};

export const sampleCorrection: Correction = {
  id: "c1",
  questionId: "q1",
  userId: "u1",
  answer: "A prisão em flagrante delito está prevista nos artigos 301 a 310 do CPP...",
  grade: 7.5,
  maxGrade: 10,
  mirror: "O espelho de resposta exigia a abordagem das quatro espécies de flagrante (próprio, impróprio, presumido e esperado), o procedimento do art. 304 do CPP, o controle judicial em 24 horas (art. 310) e as medidas cautelares diversas do art. 319.",
  positives: [
    "Identificou corretamente as espécies de flagrante próprio e impróprio",
    "Mencionou o prazo de 24 horas para comunicação ao juiz",
    "Citou fundamentos legais adequados (arts. 301-310 do CPP)",
    "Boa estrutura argumentativa e organização textual",
  ],
  errors: [
    "Confundiu flagrante esperado com flagrante preparado/provocado",
    "Afirmou incorretamente que o relaxamento é automático após 24h",
  ],
  omissions: [
    "Não abordou o flagrante presumido (art. 302, IV do CPP)",
    "Não mencionou as medidas cautelares do art. 319 como alternativas",
    "Faltou citar a audiência de custódia (Resolução 213/CNJ)",
  ],
  idealAnswer: "A prisão em flagrante delito constitui modalidade de prisão cautelar que prescinde de ordem judicial prévia. O CPP prevê quatro espécies: flagrante próprio (art. 302, I e II), flagrante impróprio ou quase-flagrante (art. 302, III), flagrante presumido ou ficto (art. 302, IV) e flagrante esperado (construção doutrinária). O procedimento envolve a lavratura do APF (art. 304), comunicação ao juiz em 24h, entrega de nota de culpa e remessa ao MP. O controle judicial, previsto no art. 310, impõe ao juiz a análise em 24h para relaxar (se ilegal), converter em preventiva ou conceder liberdade provisória. As alternativas incluem as medidas cautelares diversas do art. 319 (como monitoração eletrônica, proibição de contato, etc.).",
  feedback: "Sua resposta demonstra bom conhecimento da matéria, mas precisa aprofundar nas espécies de flagrante e nas alternativas à prisão preventiva. Recomendo revisar o art. 319 do CPP e a audiência de custódia para complementar seus estudos.",
  createdAt: "2026-03-05",
};

export const recentCorrections: { questionTitle: string; grade: number; maxGrade: number; date: string; career: string }[] = [
  { questionTitle: "Prisão em Flagrante e Controle Judicial", grade: 7.5, maxGrade: 10, date: "2026-03-05", career: "Delegado" },
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
