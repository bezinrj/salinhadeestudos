

# Salinha de Estudos — Plano de Implementação

## Visão Geral
Plataforma web gamificada para concurseiros da área jurídica, com correção de discursivas, cronômetro de estudos e rankings competitivos. Visual premium escuro com toques dourados/azul elétrico.

---

## Design System
- **Tema escuro** como padrão: fundo preto/grafite, texto claro
- **Cores de destaque**: dourado para conquistas, azul elétrico para CTAs, roxo discreto para badges
- **Tipografia elegante** com boa hierarquia
- **Cards com bordas sutis** e efeitos de hover sofisticados

---

## Páginas

### 1. Home (Landing Page)
- Hero impactante com título, subtítulo e CTA de cadastro
- Seção de funcionalidades (discursivas, ranking, cronômetro)
- Preview de rankings em destaque
- Seção de benefícios com ícones (balança da justiça, troféu, relógio)
- Footer com links

### 2. Login / Cadastro
- Formulário moderno em card centralizado
- Abas Login/Cadastro
- Campos email e senha
- Link "Esqueci minha senha"
- Preparado para integração futura com Supabase Auth

### 3. Dashboard
- Layout com sidebar (desktop) e bottom nav (mobile)
- Cards resumo: pontuação total, posição no ranking, horas na semana, discursivas respondidas
- Últimas questões respondidas com nota
- Gráfico de desempenho semanal (Recharts)
- Atalhos rápidos para discursivas, ranking e cronômetro

### 4. Discursivas
- Lista de questões com filtros por carreira (Delegado, Magistratura, Promotoria) e disciplina
- Card de questão com título, carreira, disciplina e status
- **Tela de resposta**: enunciado + campo de texto + botão enviar
- **Tela de correção**: espelho resumido, pontos positivos, erros, omissões, sugestão de resposta ideal, nota final com barra de progresso, feedback de melhoria

### 5. Questões da Semana
- Destaque para questão atual com countdown de prazo
- Número de participantes
- Mini ranking da semana
- Histórico de desafios anteriores

### 6. Ranking
- Tabs: Geral, Discursivas, Horas Estudadas, Semanal
- Tabela com posição, avatar, nome, pontuação
- Top 3 em destaque com visual especial (pódio)
- Posição do usuário logado sempre visível

### 7. Cronômetro de Estudos
- Timer grande e visual com botões iniciar/pausar/finalizar
- Seletor de matéria/disciplina
- Lista de sessões do dia
- Painel com total de horas (dia, semana, mês)
- Gráfico semanal de horas (Recharts)
- Streak de dias consecutivos

### 8. Perfil do Usuário
- Dados do aluno (nome, email, carreira alvo)
- Estatísticas gerais (discursivas, nota média, horas)
- Histórico de correções
- Histórico de sessões de estudo
- Galeria de badges/conquistas

---

## Navegação
- **Desktop**: Sidebar fixa com ícones e labels, colapsável
- **Mobile**: Bottom navigation com 5 itens principais (Home, Discursivas, Cronômetro, Ranking, Perfil)

---

## Dados Mock
- 10+ questões discursivas fictícias com gabaritos
- 15+ usuários fictícios com pontuações variadas
- Exemplos de correções completas
- Sessões de estudo e rankings pré-populados
- Badges: "Primeira Discursiva", "10 Questões", "Maratonista", "Top 3 Semanal", etc.

---

## Estrutura Técnica
- Componentes reutilizáveis (QuestionCard, RankingTable, StatCard, BadgeDisplay, StudyTimer)
- Context para autenticação mock (AuthContext)
- Dados centralizados em `/data/` para fácil substituição por Supabase
- React Router com rotas protegidas
- Recharts para gráficos

