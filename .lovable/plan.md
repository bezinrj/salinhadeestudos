

# Plano: Checkout Stripe para Assinaturas

## Situação Atual
- Stripe ativado com 3 produtos/preços criados:
  - **Mensal**: `price_1TBMTPLy0axdgWvJblk2ZJjZ` (R$ 49,90/mês)
  - **Trimestral**: `price_1TBMTpLy0axdgWvJjbmiZ92u` (R$ 131,73/mês — ajustaremos para cobrar a cada 3 meses)
  - **Anual**: `price_1TBMUHLy0axdgWvJInHob9Il` (R$ 401,21/ano)
- **Bloqueio**: Supabase/Lovable Cloud não está habilitado — necessário para Edge Functions

## Pré-requisito (ação do usuário)
Habilitar o **Lovable Cloud** no projeto (botão de nuvem/Supabase no painel). Região: Americas.

## Implementação (após Supabase habilitado)

### 1. Edge Function `create-checkout`
- Recebe o `priceId` do frontend
- Cria sessão de checkout do Stripe em modo `subscription`
- Redireciona o usuário para o Stripe Checkout
- URLs de sucesso/cancelamento configuradas

### 2. Edge Function `check-subscription`
- Verifica se o usuário tem assinatura ativa no Stripe
- Retorna status, produto e data de vencimento
- Chamada no login e periodicamente

### 3. Atualizar Frontend
- **PricingCards**: ao clicar, chama a Edge Function `create-checkout` com o `priceId` correto
- **MyPlan**: exibe dados reais da assinatura via `check-subscription`
- **Home**: botões de pricing redirecionam para login → checkout
- Mapeamento de `price_id` e `product_id` por plano no código

### 4. Páginas de retorno
- `/checkout-success`: confirmação após pagamento
- Cancelamento volta para a página de planos

## Detalhes Técnicos
- Autenticação: Supabase Auth (já existe mock, será migrado)
- Stripe API version: `2025-08-27.basil`
- Sem webhooks (verificação por polling via `check-subscription`)
- Preços hardcoded no frontend com IDs do Stripe

