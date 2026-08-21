# Degustação de 3 dias por indicação de amigos

## O que será construído

### 1. Degustação premium de 3 dias
- Libera todos os recursos premium (Discursivas, Vade Digital, Salinha Juris, Cadernos) por 72 horas.
- **Não** libera "Minhas Turmas" (o acesso a turmas continua vindo apenas de compra/liberação manual).
- Resgate único por conta: só pode ser ativado uma vez, por qualquer usuário sem plano ativo (novos e antigos).

### 2. Como o usuário libera a degustação
- Precisa indicar **pelo menos 2 amigos**, informando **nome, e-mail e WhatsApp** de cada um.
- Ao enviar as indicações válidas, a degustação é ativada na hora (3 dias).
- Cada amigo indicado recebe:
  - **E-mail de convite** automático, com link de cadastro.
  - **Convite por WhatsApp**: o sistema gera a mensagem pronta e abre o WhatsApp do próprio usuário para cada amigo (botão "Enviar no WhatsApp"), sem custo de API.
- Validações: e-mails válidos e distintos entre si, não pode indicar o próprio e-mail, WhatsApp com DDD.

### 3. Onde aparece
- **Novos usuários**: logo após o primeiro login, um modal de boas-vindas oferece a degustação e abre o formulário de indicações.
- **Usuários gratuitos antigos**: mesmo aviso após o login, enquanto não tiverem resgatado e não tiverem plano ativo. Pode ser adiado ("Agora não"), reaparecendo depois, e fica sempre acessível por um card em "Meu Plano".
- Durante a degustação, um selo mostra os dias/horas restantes.

### 4. E-mail e WhatsApp obrigatórios em todas as contas
- No cadastro o WhatsApp já é obrigatório; o e-mail vem do login.
- Para contas antigas sem WhatsApp salvo: modal obrigatório após o login pedindo o WhatsApp antes de continuar navegando.
- No perfil, os dois campos ficam visíveis e editáveis pelo dono.
- No painel admin, na página de Usuários, e-mail e WhatsApp aparecem na listagem e nas exportações (a coluna já existe; será garantido o preenchimento a partir do cadastro).

### 5. Acompanhamento no admin
- Nova aba "Indicações" no painel admin: quem indicou, quem foi indicado, data, se o convite virou cadastro e quem está em degustação.

## Detalhes técnicos

**Banco de dados (migração)**
- `referrals`: `referrer_id`, `friend_name`, `friend_email`, `friend_whatsapp`, `invite_token`, `email_sent_at`, `whatsapp_opened_at`, `signed_up_user_id`, `created_at`. RLS: dono vê/insere as suas; admin vê todas; GRANTs para `authenticated`/`service_role`.
- `trial_claims` (ou coluna `trial_claimed_at` em `profiles`): registra o resgate único.
- RPC `claim_referral_trial(indicacoes jsonb)` (SECURITY DEFINER): valida ≥2 indicações válidas, bloqueia segundo resgate, grava em `referrals` e insere/estende `content_access` para as áreas `discursivas`, `vade`, `juris`, `cadernos` com `expires_at = now() + 3 days` e `source = 'trial'`. Retorna os dados para disparo dos e-mails.
- `get_my_entitlements()` já lê `content_access`, então a degustação passa a valer automaticamente — e turmas continuam de fora porque não são uma área de entitlement.
- Backfill: copiar `profiles.phone` para `user_contact_info.whatsapp` onde estiver vazio, para o admin enxergar o WhatsApp de todos.

**E-mail**
- Usar a infraestrutura de e-mail já existente do projeto: novo template `friend-invite` e função de envio de e-mails do app, disparada uma vez por indicado com chave de idempotência.

**Frontend**
- `src/components/referral/ReferralTrialDialog.tsx`: formulário dinâmico (mínimo 2 amigos), validação, envio, e botões wa.me por amigo.
- `src/components/referral/TrialGate.tsx` montado no `AppLayout`: decide entre modal de WhatsApp obrigatório, oferta de degustação ou nada.
- `AuthContext`: expor `trialActive`/`trialEndsAt` e recarregar entitlements após o resgate.
- `MyPlan.tsx`: card da degustação (ativar ou tempo restante).
- `Profile.tsx`: mostrar e-mail da conta (somente dono) junto ao WhatsApp.
- `Admin.tsx`: aba "Indicações".
