

# Plano: Filtro de matérias, gabarito e teste de correção

## 1. Filtro de matérias na página Discursivas (`src/pages/Discursivas.tsx`)

Adicionar um quarto filtro "Matéria" usando a lista `disciplines` já existente em `mockData.ts`. Filtrar por `q.discipline`.

## 2. Select de matéria no Admin (`src/pages/Admin.tsx` — `WeeklyQuestionsTab`)

Substituir o `<Input>` de disciplina (linha 764) por um `<Select>` com as opções do array `disciplines` de `mockData.ts`.

## 3. Campo de gabarito (barema) no Admin

Adicionar na `WeeklyQuestionsTab` um editor de barema em JSON. O admin preenche os itens do barema (letra, título, pontuação máxima, subitens com descrição, pontuação e keywords) no mesmo formato `BaremaItem[]` usado pelo `evaluateAnswer`. O campo será um `<Textarea>` com placeholder de exemplo JSON, e o valor será salvo na coluna `barema` (jsonb) da tabela `weekly_questions`.

## 4. Botão "Testar Correção" no Admin

Adicionar um botão que abre um modal/seção de teste. O admin cola uma resposta de exemplo, clica em "Testar", e o sistema roda `evaluateAnswer` localmente usando o barema preenchido. Exibe o resultado (nota, breakdown por item) no mesmo formato da página de correção, permitindo validar se o gabarito está correto antes de publicar.

## Arquivos afetados

- `src/pages/Discursivas.tsx` — novo filtro de matéria
- `src/pages/Admin.tsx` — select de disciplina, campo barema, botão de teste
- Sem mudanças no banco (coluna `barema` já existe na tabela `weekly_questions`)

