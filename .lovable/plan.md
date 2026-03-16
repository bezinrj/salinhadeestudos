

# Plano: Questões da Semana com ciclo automático e lista de espera

## Resposta sobre notificações

Sim, é possível. A abordagem mais simples e imediata é **notificação no dashboard** — quando o usuário entra no app, verificamos se ele está na lista de espera e se uma nova questão já foi publicada, e mostramos um alerta/badge. Para **email**, seria necessário configurar um domínio de email no projeto (Cloud → Emails). Recomendo começar com notificação no dashboard e depois adicionar email se desejado.

## Mudanças

### 1. Nova tabela `weekly_questions` (banco de dados)

Armazena as questões semanais com ciclo automático:

```text
weekly_questions
├── id (uuid, PK)
├── title (text)
├── career (text)
├── discipline (text)
├── statement (text)
├── difficulty (text)
├── barema (jsonb, nullable)
├── deadline (timestamptz) — sempre domingo 00:00 BRT
├── is_active (boolean, default true)
├── created_at (timestamptz)
└── created_by (uuid, nullable)
```

RLS: admins podem CRUD, authenticated podem SELECT onde `is_active = true`.

### 2. Nova tabela `weekly_waitlist` (banco de dados)

Armazena quem clicou "Esperando o próximo desafio":

```text
weekly_waitlist
├── id (uuid, PK)
├── user_id (uuid)
├── created_at (timestamptz)
└── notified (boolean, default false)
```

RLS: users inserem/leem own, admins leem tudo.

### 3. Editar `src/pages/WeeklyChallenge.tsx`

Lógica principal:
- Buscar questão ativa do banco (`weekly_questions` where `is_active = true` and `deadline > now()`)
- Se existe questão ativa: mostrar o card atual (como já funciona)
- Se não existe (entre domingo 00:00 e publicação da próxima):
  - Mostrar mensagem "Sem questões no momento"
  - Botão "Esperando o próximo desafio" que insere na `weekly_waitlist`
  - Contador em tempo real de quantos estão esperando
- Deadline fixo: todo domingo às 00:00 horário de Brasília (UTC-3)

### 4. Notificação no Dashboard

- No `Dashboard.tsx`, ao carregar, verificar se o usuário está na `weekly_waitlist` com `notified = false` e se existe nova questão ativa
- Se sim: mostrar banner "Nova questão da semana disponível!" com botão para ir à página
- Marcar `notified = true` após exibição

### 5. Painel Admin — Publicar questões semanais

- Adicionar seção no Admin para criar nova questão semanal (inserir na `weekly_questions`)
- Ao publicar, o deadline é calculado automaticamente para o próximo domingo 00:00 BRT
- Resetar `weekly_waitlist` (marcar todos como `notified = false` para que recebam notificação)

### Arquivos afetados

- **Migração SQL**: criar `weekly_questions` e `weekly_waitlist`
- **Editar**: `src/pages/WeeklyChallenge.tsx` — lógica de estado vazio + waitlist
- **Editar**: `src/pages/Dashboard.tsx` — banner de notificação
- **Editar**: `src/pages/Admin.tsx` — formulário de publicação de questão semanal
- **Editar**: `src/pages/QuestionDetail.tsx` — buscar questão semanal do banco
- **Editar**: `src/pages/Discursivas.tsx` — questões expiradas do banco

