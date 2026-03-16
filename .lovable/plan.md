

# Plano: Trocar "Aguardando Aprovação" por contagem de cortesias manuais

## Mudança

No `src/pages/Admin.tsx`:

1. Na query `admin-stats`, substituir a lógica de `waitingApproval` por uma consulta à tabela `manual_subscriptions` filtrando `is_active = true` e `expires_at >= now()` para contar planos manuais ativos (cortesias).

2. No array `overviewCards`, trocar:
   - Título: "Aguardando Aprovação" → "Cortesias Ativas"
   - Valor: `waitingApproval` → `manualPlans`
   - Ícone: `Clock` → `Gift` (lucide-react)
   - Cor: manter laranja ou usar roxo para diferenciar

Apenas um arquivo editado, sem mudanças no banco.

