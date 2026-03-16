

# Plano: Migrar questões discursivas para o banco + exclusão por admin

## Visão geral
Atualmente as questões discursivas são hardcoded em `mockData.ts`. Vamos usar a tabela `weekly_questions` existente para armazenar **todas** as questões (semanais e regulares), adicionando uma coluna `is_weekly` e campos extras (`is_premium`, `participants`). As questões regulares terão `is_weekly = false` e sem deadline obrigatória. Admins poderão criar, editar e excluir qualquer questão pelo painel.

## 1. Migração do banco de dados

Alterar a tabela `weekly_questions`:
- Adicionar coluna `is_weekly boolean NOT NULL DEFAULT false`
- Tornar `deadline` nullable (questões regulares não têm prazo)
- Adicionar `is_premium boolean NOT NULL DEFAULT false`
- Adicionar `participants integer NOT NULL DEFAULT 0`
- Inserir a questão hardcoded existente ("Provas Ilícitas...") como seed

## 2. Atualizar `src/pages/Discursivas.tsx`

- Remover import de `questions` / `getExpiredWeeklyQuestions` do mockData
- Buscar todas as questões de `weekly_questions` via Supabase query
- Manter os filtros existentes (dificuldade, carreira, matéria, tipo)
- Para admins: mostrar botão de excluir em cada card

## 3. Atualizar `src/pages/QuestionDetail.tsx`

- Buscar questão por ID do banco em vez de procurar no array hardcoded
- Manter toda a lógica de correção (`evaluateAnswer`) usando o `barema` da questão do banco

## 4. Atualizar `src/pages/Admin.tsx` — WeeklyQuestionsTab

- Renomear para "Questões" e listar todas (semanais + regulares)
- Adicionar toggle `is_weekly` no formulário de criação
- O botão de excluir já existe — continua funcionando via RLS

## 5. Atualizar `src/components/QuestionCard.tsx`

- Adicionar prop opcional `onDelete` para admins
- Mostrar botão de excluir quando `onDelete` fornecido

## Arquivos afetados
- Migração SQL (nova coluna + seed)
- `src/pages/Discursivas.tsx`
- `src/pages/QuestionDetail.tsx`
- `src/pages/Admin.tsx`
- `src/components/QuestionCard.tsx`
- `src/data/mockData.ts` (remover questões hardcoded, manter interfaces e `evaluateAnswer`)

