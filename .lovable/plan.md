

# Plano: Edição de questões, correção dinâmica, trava semanal e ranking real

## 1. Editar questões no Admin

Na listagem de questões (`WeeklyQuestionsTab`), adicionar botão "Editar" em cada questão. Ao clicar, abre um Dialog/Drawer com os mesmos campos do formulário de criação, pré-preenchidos com os dados da questão. O admin pode alterar qualquer campo e salvar via `UPDATE` na tabela `weekly_questions`.

**Arquivos:** `src/pages/Admin.tsx`

## 2. Espelho e Resposta Ideal dinâmicos por questão

Atualmente `evaluateAnswer()` retorna `mirror` e `idealAnswer` hardcoded. Para que cada questão tenha seu próprio espelho e resposta ideal:

- **Migração SQL:** Adicionar colunas `mirror_text` (text, nullable) e `ideal_answer` (text, nullable) na tabela `weekly_questions`
- **Admin:** Adicionar campos "Espelho Resumido" e "Resposta Ideal" no formulário de criação/edição
- **`evaluateAnswer()`:** Receber `mirror` e `idealAnswer` como parâmetros opcionais, usando-os em vez dos valores hardcoded
- **`QuestionDetail.tsx`:** Passar `mirror` e `idealAnswer` da questão do banco para `evaluateAnswer()`

**Arquivos:** migração SQL, `src/data/mockData.ts`, `src/pages/Admin.tsx`, `src/pages/QuestionDetail.tsx`

## 3. Travar questão semanal para resposta única

- **Migração SQL:** Criar tabela `weekly_answers` com `user_id`, `question_id`, `answer_text`, `score`, `created_at` e constraint `UNIQUE(user_id, question_id)`. RLS: usuários lêem/inserem próprias respostas.
- **`QuestionDetail.tsx`:** Antes de mostrar o formulário de resposta, verificar se já existe registro em `weekly_answers` para o par (user, question). Se sim, mostrar a nota obtida e bloquear nova resposta. Após submeter resposta semanal, inserir registro na tabela.
- Questões regulares (não semanais) continuam sem trava.

**Arquivos:** migração SQL, `src/pages/QuestionDetail.tsx`

## 4. Ranking real baseado em dados do banco

O ranking atual usa dados mock (`getWeeklyRanking()` de `mockData.ts`). Substituir por dados reais:

- **`src/pages/Ranking.tsx`:** Buscar dados de `weekly_answers` (soma de scores por usuário), `profiles` (nome, avatar) e horas de estudo do cronômetro. A pontuação geral = soma das notas semanais + horas de cronômetro convertidas em pontos.
- **`src/pages/WeeklyChallenge.tsx`:** O ranking da semana busca respostas da questão ativa/última semana.
- **Fórmula de pontuação:** `score = soma_notas_semanais + (horas_cronometro * fator)` — o fator pode ser definido (ex: 1 ponto por hora).

**Arquivos:** `src/pages/Ranking.tsx`, `src/pages/WeeklyChallenge.tsx`, `src/components/RankingTable.tsx`

## 5. Questões regulares contam apenas para badges

Já está separado conceitualmente. Ao salvar resposta de questão regular, incrementar contador no perfil (`total_essays`) sem afetar ranking. As questões semanais registram na tabela `weekly_answers` e afetam o ranking.

**Arquivo:** `src/pages/QuestionDetail.tsx`

## Resumo de migrações SQL

1. `ALTER TABLE weekly_questions ADD COLUMN mirror_text text, ADD COLUMN ideal_answer text`
2. `CREATE TABLE weekly_answers (id uuid PK, user_id uuid NOT NULL, question_id uuid REFERENCES weekly_questions(id), answer_text text, score numeric, created_at timestamptz DEFAULT now(), UNIQUE(user_id, question_id))` + RLS policies

## Arquivos afetados
- Migrações SQL (2)
- `src/pages/Admin.tsx` — edição + campos mirror/idealAnswer
- `src/pages/QuestionDetail.tsx` — trava semanal + correção dinâmica + salvar resposta
- `src/pages/Ranking.tsx` — ranking real do banco
- `src/pages/WeeklyChallenge.tsx` — ranking semanal real
- `src/data/mockData.ts` — `evaluateAnswer` parametrizado

