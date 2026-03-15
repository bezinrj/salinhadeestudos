

# Plano: Questões Gratuitas vs Pagas (Plano Assinante)

## Conceito
Adicionar um campo `isPremium` às questões. Questões gratuitas podem ser respondidas por qualquer usuário logado. Questões premium (incluindo todas as questões da semana) exigem assinatura ativa.

## Etapas

### 1. Atualizar interface `Question` em `mockData.ts`
- Adicionar campo `isPremium?: boolean` à interface
- Marcar questões existentes como gratuitas ou pagas
- `weeklyQuestion` sempre terá `isPremium: true`

### 2. Adicionar estado de assinatura ao `AuthContext`
- Chamar `check-subscription` após login e periodicamente
- Expor `subscribed: boolean` no contexto para uso em toda a app

### 3. Atualizar `QuestionCard.tsx`
- Exibir badge "Gratuita" ou "Premium" (com ícone de cadeado)
- Se premium e usuário não assinante: ao clicar, redirecionar para `/meu-plano` em vez de abrir a questão

### 4. Atualizar `QuestionDetail.tsx`
- Se questão premium e usuário não assinante: mostrar o enunciado mas bloquear o campo de resposta com CTA para assinar

### 5. Atualizar filtros em `Discursivas.tsx`
- Adicionar filtro "Tipo": Todas / Gratuitas / Premium

## Detalhes técnicos
- Nenhuma mudança de banco de dados necessária (questões ainda são mock)
- `check-subscription` já existe como Edge Function
- O campo `subscribed` será armazenado no AuthContext via chamada à Edge Function
- Questões da semana: `isWeekly` implica `isPremium = true` automaticamente

