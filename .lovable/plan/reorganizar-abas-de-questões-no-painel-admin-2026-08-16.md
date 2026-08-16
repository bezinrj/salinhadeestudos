# Reorganizar abas de questões no painel Admin

Objetivo: separar visualmente questões regulares das questões da semana. Nenhuma funcionalidade é removida — apenas a disposição muda.

## O que muda

**Aba "Semanal" vira "Questões"**
- Passa a tratar somente questões regulares (regular gratuita ou Premium).
- No formulário "Nova Questão", a chave liga/desliga "Questão Semanal / Questão Regular" some. Permanece apenas a chave "Premium".
- A lista "Todas as Questões" passa a listar apenas as questões não-semanais, com os mesmos cartões, busca por ID/título, badges, editar, ativar/desativar e excluir.

**Nova aba "Questões da Semana"**
- Mesma estrutura da aba de Questões, porém dedicada ao semanal.
- Formulário "Nova Questão da Semana" já publica como semanal (Premium automático, prazo até domingo 00:00 BRT), sem a chave de alternância.
- Lista com o rol apenas das questões da semana, no mesmo formato de cartões da lista atual, com busca, editar, ativar/desativar e excluir.
- O card "Pessoas na lista de espera" fica nesta aba (contexto semanal).

**Ordem das abas (desktop e mobile)**
Visão Geral · Usuários · Questões · Questões da Semana · Turmas · Alertas · Solicitações · Avisos · Conteúdo · Assuntos · Matérias · Cronômetro · Feedbacks · Configurações

A aba de moderador (visão reduzida) recebe as mesmas duas abas no lugar de "Semanal".

## Detalhes técnicos

- `src/pages/Admin.tsx`: `WeeklyQuestionsTab` recebe uma prop `mode: "regular" | "weekly"`.
  - `mode` define o valor fixo de `is_weekly` no `publishMutation` (mantendo a lógica atual de deadline no próximo domingo e reset da lista de espera no modo semanal).
  - A lista aplica filtro `q.is_weekly === (mode === "weekly")`.
  - Switch de alternância semanal/regular no formulário é removido; switch Premium só aparece no modo regular.
  - Card de lista de espera renderizado apenas no modo semanal.
- O diálogo de edição mantém todos os campos atuais (inclusive a possibilidade de mover uma questão entre regular e semanal), pois é funcionalidade existente.
- `TabsList` ganha mais uma coluna no grid desktop (14 colunas) e novo `TabsContent value="weeklyq"`.
