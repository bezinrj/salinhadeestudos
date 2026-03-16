

# Plano: Separar navegação semanal + bloquear questões ativas em Discursivas

## Problema
Ao responder a questão da semana, o usuário é redirecionado para `/discursivas/:id`, saindo do contexto "Questões da Semana". Além disso, questões semanais ativas aparecem em Discursivas antes do prazo expirar.

## Mudanças

### 1. Nova rota `/semanal/:id` (App.tsx)
- Adicionar rota que renderiza o mesmo `QuestionDetail`, mas dentro do contexto semanal
- O botão "Voltar" levará de volta a `/semanal`

### 2. WeeklyChallenge.tsx
- Alterar navegação de `navigate('/discursivas/${id}')` para `navigate('/semanal/${id}')`

### 3. Discursivas.tsx — filtrar questões semanais ativas
- No filtro, excluir questões onde `is_weekly = true` E `deadline` ainda não expirou
- Questões semanais só aparecem em Discursivas após o deadline passar

### 4. QuestionCard.tsx — bloquear questões semanais ativas
- Se a questão é semanal e o deadline ainda não passou, mostrar toast informando que está disponível apenas em "Questões da Semana" e não navegar

### Arquivos afetados
- `src/App.tsx` — nova rota
- `src/pages/WeeklyChallenge.tsx` — ajustar navigate
- `src/pages/Discursivas.tsx` — filtrar ativas
- `src/components/QuestionCard.tsx` — bloqueio de acesso

