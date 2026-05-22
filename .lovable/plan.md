## Contexto

Confirmado no banco:
- **Usuário:** Matheus (`6ff23b49-fe7a-4d21-bfe2-9ed445bac0d2`)
- **Profile com plano ativo (test mode):** `subscription_tier=quarterly`, `price_id=price_1TBMTpLy0axdgWvJjbmiZ92u`, `subscription_end=2026-08-08`
- **manual_subscriptions:** vazio
- **turmas_assinaturas / turmas_acessos:** vazios
- **Stripe live:** já verificado — nenhum customer/sub/payment com esse e-mail (compra foi 100% test mode)

Ou seja, basta zerar os campos de assinatura no `profiles`.

## Ação

Rodar um UPDATE em `public.profiles` para o `id = 6ff23b49-fe7a-4d21-bfe2-9ed445bac0d2`:

- `subscription_tier = NULL`
- `subscription_end = NULL`
- `price_id = NULL`
- `banco_geral_expires_at = NULL` (já está nulo, mantém)

Depois disso o `check-subscription` ao ser chamado pelo usuário retornará `subscribed: false` (não há manual sub, não há customer Stripe live, e o fallback de profile estará limpo) e o card "Meu Plano" voltará a exibir a tela de planos.

## Observação

Não é necessário tocar em código, nem em Stripe (test mode não gera cobrança). Apenas o UPDATE acima resolve.
