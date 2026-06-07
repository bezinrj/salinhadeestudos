## Diagnóstico

A compra `pi_3TefqoQ4whpSK2DU1JM9sdcJ` (cus_UdhBDKwVk0aVMQ, R$ 79,90) foi paga com sucesso na Stripe, mas o aluno não recebeu o acesso.

Investigando:
- A função `stripe-turma-webhook` **não tem nenhum log** desde sempre — ela nunca foi chamada pela Stripe (endpoint provavelmente não cadastrado / `STRIPE_TURMA_WEBHOOK_SECRET` desalinhado).
- **Todas** as linhas de `turmas_assinaturas` estão com `status = pending` e `stripe_payment_intent_id = NULL`. Ou seja, nenhuma compra de Turma jamais foi liberada automaticamente — só funcionou quando foi liberada manualmente.
- A página `/checkout-success` hoje só exibe "Assinatura confirmada", sem verificar nada no backend.

Conclusão: o sistema depende exclusivamente do webhook, que está silenciosamente quebrado. Precisamos remover essa dependência única.

## Solução

Adicionar um **caminho de verificação no retorno do checkout** (padrão polling no success page) que confere o pagamento direto na Stripe e libera o acesso. O webhook continua existindo como reforço, mas o success-page passa a ser a fonte primária e confiável.

### 1. Nova Edge Function `verify-turma-checkout`
- Recebe `{ session_id }` do usuário autenticado.
- Busca a `checkout.sessions.retrieve(session_id)` na Stripe.
- Valida que `payment_status === "paid"` e que o `metadata.user_id` bate com o usuário autenticado (segurança).
- Executa exatamente a mesma lógica de liberação do webhook (em uma função compartilhada copiada para o arquivo): atualiza `turmas_assinaturas` → `active`, cria `turmas_acessos` para cada `album_id` do plano e estende `profiles.banco_geral_expires_at`.
- É **idempotente** (usa `upsert` em `turmas_acessos` por `user_id,album_id` e checa status atual antes de estender o banco geral). Pode ser chamada várias vezes sem efeito colateral.
- Retorna `{ granted: true, album_ids: [...] }` quando ok, `{ granted: false, reason: "pending" }` quando o pagamento ainda não foi confirmado.

### 2. Atualizar `src/pages/CheckoutSuccess.tsx`
- Ler `session_id` da query string.
- Estado inicial "Confirmando seu pagamento..." com spinner.
- Polling: chama `verify-turma-checkout` a cada 2 s, até 10 tentativas.
- Sucesso → mostra "Assinatura confirmada!" e botão "Ir para Minhas Turmas".
- Falha após tentativas → mensagem "Pagamento ainda processando. Atualize a página em alguns minutos ou fale com o suporte." (sem alarme falso — a próxima visita re-tenta).

### 3. Regularizar a compra perdida
- Aplicar manualmente, via insert tool, o acesso para `user_id = c6d74687-ba56-4f42-80f8-316f147a6d1a` ao plano `d9db1d62-1842-4a54-87db-54c9ef44d00b`: marcar a `turmas_assinaturas` mais recente como `active` com o `pi_3TefqoQ4whpSK2DU1JM9sdcJ`, inserir `turmas_acessos` para cada álbum do plano, e estender o `banco_geral_expires_at` do perfil conforme `meses_banco_geral`.

### 4. Webhook
- Não mexer no `stripe-turma-webhook` (continua como reforço). Ao final, recomendarei verificar no painel da Stripe se o endpoint `…/functions/v1/stripe-turma-webhook` está cadastrado e se o `STRIPE_TURMA_WEBHOOK_SECRET` bate — mas o sistema deixa de depender disso.

## Arquivos

- **Criar:** `supabase/functions/verify-turma-checkout/index.ts`
- **Editar:** `src/pages/CheckoutSuccess.tsx`
- **Insert tool:** liberar manualmente a compra do aluno c6d74687.
