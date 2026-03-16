

# Plano: Gestao Manual de Planos pelo Admin

## Sobre os prazos automaticos

Sim, seus planos Mensal, Trimestral e Anual possuem contagem automatica. O Stripe gerencia cobranca, renovacao e expiracao. A funcao `check-subscription` consulta o Stripe em tempo real.

## Mudancas

### 1. Nova tabela `manual_subscriptions`

Armazena planos atribuidos manualmente pelo admin (premium ou trial), independente do Stripe:

```sql
CREATE TABLE public.manual_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type text NOT NULL DEFAULT 'premium',
  granted_by uuid,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
-- RLS: admins full access, users read own
```

### 2. Atualizar `check-subscription` Edge Function

Apos verificar no Stripe, tambem consultar `manual_subscriptions` para planos manuais ativos e nao expirados. Retornar `subscribed: true` se qualquer um existir. Incluir campo `manual: true` na resposta quando for plano manual.

### 3. UI no `UserSubscriptionInfo` (Admin.tsx)

Adicionar ao componente existente:
- **Atribuir Premium**: botoes para 30, 90 ou 365 dias (insert na `manual_subscriptions`)
- **Teste 3 dias**: botao rapido que cria trial de 3 dias
- **Remover plano manual**: desativa o registro manual (set `is_active = false`)
- Mostrar badge "Manual" ou "Trial" quando o plano for atribuido pelo admin
- Nota visual: "Planos via Stripe sao gerenciados automaticamente"

### 4. Arquivos

- **Criar migracao**: tabela `manual_subscriptions` com RLS
- **Editar**: `supabase/functions/check-subscription/index.ts` — consultar `manual_subscriptions`
- **Editar**: `src/pages/Admin.tsx` — botoes de atribuir/teste/remover no `UserSubscriptionInfo`

