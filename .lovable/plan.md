# E-mails no admin, tags de degustação, recorrência e Fale Conosco

## 1. E-mail de todos os usuários no painel admin

A tela já mostra o e-mail, mas hoje aparece "—" para a maioria: a função que busca os e-mails retorna apenas os 50 primeiros usuários (limite padrão), e o projeto tem 132 contas.

- Ajustar a função de listagem para paginar até trazer todos os usuários.
- Incluir o e-mail também na busca (hoje só filtra por nome/username) e na exportação em PDF.

## 2. Tags e contadores corretos

Estado atual verificado: 5 cortesias manuais ativas, 5 assinaturas ativas, 0 degustações ativas no momento.

Na lista de usuários, a etiqueta de acesso passa a distinguir quatro situações:

- **Premium** — assinatura paga ativa (Stripe).
- **Cortesia** — concessão manual ativa.
- **Degustação** — acesso temporário de 3 dias por indicação (com dias restantes).
- **Gratuito** — nenhum dos acima.

Na visão geral, os cartões passam a ser:

- **Assinaturas Ativas** — apenas assinaturas pagas ativas (hoje o número está fixo em zero).
- **Cortesias Ativas** — somente concessões manuais.
- **Degustações Ativas** — novo cartão, contando apenas os trials por indicação, clicável para ver a lista.

## 3. Recorrência automática dos planos

Verificado na Stripe: todos os planos vendidos hoje (Discursivas Mensal, Trimestral, Anual, Vade Digital, Salinha Juris, Combo e Salinha PRO) já são preços recorrentes com cobrança automática, e o checkout é criado em modo assinatura. Ou seja, a recorrência já está ativa — nada a criar.

Quem comprou no mês passado e não renovou caiu em um destes casos: cancelamento pedido pelo próprio usuário, cartão recusado/expirado, ou compra feita fora da Stripe (Hotmart / cortesia manual, que não renovam). Por isso o plano inclui:

- Levantar na Stripe os assinantes cujo ciclo encerrou sem renovar e o motivo de cada um (cancelado x pagamento falho), e apresentar essa lista para você.
- Nova aba **Assinaturas** no admin, listando assinantes com status, plano, próxima cobrança e alerta de pagamento com falha, para acompanhar renovações daqui em diante.
- E-mails de aviso de falha de pagamento não entram nesta etapa (posso fazer depois, se quiser).

## 4. Menu Fale Conosco

Nova página `/fale-conosco`, acessível pelo menu lateral e pela navegação mobile, com formulário de atendimento. Sem botão automático de cancelamento — o pedido vira uma solicitação tratada por você, que é o padrão da maioria dos sites.

Assuntos do formulário (o que costuma cobrir quase toda a demanda):

- Cancelar assinatura
- Problema com pagamento / cobrança indevida
- Dificuldade de acesso ou login
- Erro ou bug na plataforma
- Dúvida sobre conteúdo ou correção
- Sugestão de melhoria
- Parcerias e cupons
- Outro assunto

Comportamento:

- Campos: assunto, mensagem, e-mail e WhatsApp preenchidos automaticamente do cadastro (editáveis), e o plano atual anexado à solicitação.
- Ao escolher "Cancelar assinatura", aparece um passo de retenção antes do envio: motivo do cancelamento (preço, não usei, encontrei outro serviço, objetivo alcançado, dificuldade de uso, outro), lembrete de que o acesso continua até o fim do período já pago, e uma oferta de pausa/desconto. Só depois o pedido é enviado.
- Após envio: confirmação em tela com prazo de resposta (até 48h úteis), e-mail de confirmação para o usuário e aviso para o suporte.
- FAQ curto na mesma página (como cancelo, quando expira o acesso, como troco de plano, como emito recibo) — reduz bastante o volume de chamados.
- Nova aba **Fale Conosco** no admin: lista de solicitações com filtro por assunto e status (aberta, em andamento, resolvida), dados de contato e plano do usuário, e destaque para pedidos de cancelamento.

## Detalhes técnicos

- `supabase/functions/admin-list-users/index.ts`: paginar `auth.admin.listUsers({ page, perPage: 1000 })` até esgotar.
- `src/pages/Admin.tsx`: `OverviewTab` passa a consultar `content_access` (source `trial`, `expires_at > now()`) e assinaturas pagas via `profiles.subscription_end > now()` + `banco_geral_expires_at`; `UsersTab` recebe o mapa de trials para a nova tag e prioriza Premium > Cortesia > Degustação.
- Nova tabela `support_tickets` (assunto, mensagem, motivo do cancelamento, e-mail, whatsapp, plano, status, resposta interna) com GRANTs e RLS: usuário cria e lê os próprios; admin/moderador leem e atualizam todos.
- Nova página `src/pages/FaleConosco.tsx` + rota em `App.tsx`, item no `AppSidebar` e no `BottomNav`.
- E-mail de confirmação reaproveitando a infra transacional existente (`send-transactional-email` + novo template).
- Nova aba admin `src/components/admin/SupportTicketsTab.tsx`.
