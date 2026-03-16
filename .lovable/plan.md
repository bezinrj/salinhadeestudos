

# Plano: Visualizador de dias restantes da assinatura no drawer do admin

## Mudanca

Adicionar uma secao "Plano/Assinatura" no `UserDetailDrawer` que consulta o `check-subscription` passando o `user_id` do usuario selecionado e exibe:
- Status: Assinante / Gratuito
- Nome do plano (Mensal/Trimestral/Anual)
- Dias restantes com barra de progresso visual
- Data de vencimento

### Problema tecnico
A edge function `check-subscription` atual usa o token JWT do chamador para identificar o usuario. Para consultar a assinatura de **outro** usuario, precisamos atualizar a function para aceitar um `user_id` opcional (somente quando o chamador e admin).

### Arquivos

1. **Editar `supabase/functions/check-subscription/index.ts`**:
   - Aceitar body JSON `{ user_id }` opcional
   - Se `user_id` presente, validar que o chamador e admin via `has_role`
   - Buscar email do usuario alvo via `auth.admin.getUserById` e consultar Stripe com esse email

2. **Editar `src/pages/Admin.tsx`** — no `UserDetailDrawer`:
   - Query que invoca `check-subscription` com `{ user_id: user.id }`
   - Exibir card com badge de status, nome do plano, dias restantes e barra de progresso
   - Posicionar entre Stats e Actions

