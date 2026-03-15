

# Plano: Regras de Ranking, Badges e Questão Semanal Única

## Resumo
1. Questões regulares (aba Discursivas) **não dão pontos de ranking** — apenas contam para badges
2. Questões da Semana **dão pontos de ranking** (nota = pontos) e só podem ser respondidas **uma vez**
3. Após encerradas, questões da semana viram questões regulares no banco de discursivas
4. Novas badges de volume (50, 100, 200, 500, 1000, 5000 questões) e badge de plano anual

## Etapas

### 1. Adicionar novas badges em `mockData.ts`
- Badges de volume: 50, 100, 200, 500, 1000 e 5000 questões respondidas (categoria "discursivas")
- Badge "Assinante Anual": para quem possui plano anual (categoria "assinatura")
- Adicionar label "assinatura" ao `categoryLabels` em `BadgeDisplay.tsx`

### 2. Separar lógica de pontuação em `QuestionDetail.tsx`
- Questões regulares: **não** chamam `addWeeklyScore` — apenas incrementam contador de questões respondidas (para badges)
- Questões semanais: chamam `addWeeklyScore` (pontos = nota da correção)
- Questões semanais: verificar se o usuário já respondeu; se sim, bloquear nova resposta com mensagem "Você já respondeu esta questão"

### 3. Controle de resposta única para questão semanal
- Adicionar array/set `answeredWeeklyQuestions` em `mockData.ts` para rastrear quais questões semanais cada usuário já respondeu
- Funções: `hasAnsweredWeekly(userId, questionId)` e `markWeeklyAnswered(userId, questionId)`
- Em `QuestionDetail.tsx`: se `question.isWeekly && hasAnsweredWeekly(user.id, question.id)`, mostrar card informando que já respondeu e exibir a nota obtida

### 4. Questões semanais encerradas viram discursivas
- Em `mockData.ts`: lógica para verificar se `deadline` já passou
- Se passou: a questão aparece na lista de `Discursivas` como questão regular (sem `isWeekly`, mantendo `isPremium` original ou tornando gratuita conforme configuração)
- Em `Discursivas.tsx`: incluir questões semanais expiradas na listagem

### 5. Limpar contagem de ranking
- `addWeeklyScore`: continua igual (só chamada para questões semanais)
- Questões regulares: criar `addRegularAnswer(userId, questionId, score)` que incrementa `totalEssays` mas **não** altera `totalScore` nem ranking

## Detalhes técnicos
- Tudo ainda em mock (sem mudanças no banco de dados)
- O estado `answeredWeeklyQuestions` é em memória (reseta ao recarregar — aceitável para mock)
- Badge de plano anual será verificada via `subscribed` + tipo de plano do `check-subscription`

