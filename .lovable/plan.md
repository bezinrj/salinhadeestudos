# Reestruturação da área de Planos

## Visão geral

A página de Planos passa a ter duas categorias:

**1. Plano Discursivas** (os planos atuais: Mensal, Trimestral, Anual + Grátis)

**2. Planos de Conteúdo** (novos, assinatura recorrente mensal):

| Plano | Preço/mês | Inclui |
|---|---|---|
| Vade Digital | R$ 14,90 | Vade Mecum completo (todas as leis), notas do professor, notas privadas, remissões, cadernos |
| Salinha Juris | R$ 19,90 | Todos os recursos da Salinha Juris (julgados completos + assistente de IA) |
| Combo Vade + Juris | R$ 24,90 | Vade Digital + Salinha Juris — aceita cupom de desconto |
| Salinha PRO | R$ 59,90 | Combo + Cadernos + tudo do plano Discursivas Mensal |

## Modelo de acesso (entitlements)

Hoje existe apenas um booleano `subscribed`. Ele será substituído por um conjunto de permissões calculado no servidor:

- `discursivas` — planos Discursivas e PRO
- `vade` — Vade Digital, Combo e PRO
- `juris` — Salinha Juris, Combo e PRO
- `cadernos` — Vade Digital, Combo e PRO

Tudo continua funcionando para quem já assina hoje: os price IDs atuais concedem `discursivas`. Admin/moderador mantém acesso total.

## Vade Mecum para usuários gratuitos

Todas as leis ficam visíveis na lista, mas só os **10 primeiros artigos** de cada lei são liberados. A partir do 11º artigo aparece o card de bloqueio com o botão "Desbloqueie sua Assinatura", levando para os planos. Notas do professor, notas privadas, cadernos e remissões continuam bloqueados sem `vade`.

## Cupons próprios

Nova tabela de cupons gerenciada por um painel no Admin:

- Código, percentual de desconto (ex.: 40% e 100%), plano aplicável, limite de usos, validade, ativo/inativo.
- No checkout do Combo, campo "Tenho um cupom": o desconto é validado no servidor.
- Cupom de 100% não passa pelo Stripe — concede acesso direto por 1 mês e registra o uso (ideal para os boosters de 2 impulsos no Discord).
- Cupons parciais (40%) são aplicados como desconto no checkout do Stripe.

## Assistente de IA da Salinha Juris (custo mínimo)

- Troca para o modelo mais barato disponível (Gemini Flash Lite).
- Contexto enviado limitado ao julgado em questão (campos essenciais, íntegra truncada), sem histórico longo — só as últimas mensagens.
- Limite de tokens de resposta reduzido e instrução explícita para recusar perguntas fora do julgado.
- Mantido o limite diário de uso já existente.

## Detalhes técnicos

- `src/lib/stripe.ts`: nova estrutura com os grupos `discursivas` e `conteudo`, price IDs e entitlements por plano.
- Produtos e preços criados no Stripe (recorrentes mensais) para Vade Digital, Salinha Juris, Combo e Salinha PRO.
- `check-subscription`: passa a mapear todos os price IDs (antigos + novos) para tiers e retornar as entitlements; grava tier e vencimento no perfil.
- `AuthContext`: expõe `entitlements` além de `subscribed` (mantido por compatibilidade).
- `create-checkout`: aceita `couponCode` opcional, valida no banco e aplica desconto ou concessão direta.
- Nova tabela `coupons` + `coupon_redemptions` com RLS (leitura/validação via função `SECURITY DEFINER`, gestão só para admin) e GRANTs.
- Novo período de acesso por produto gravado no perfil (colunas de expiração por área) para o caso do cupom 100%.
- `PricingCards.tsx` dividido em duas seções com títulos de categoria; nova seção de planos de conteúdo com 4 cards e campo de cupom no Combo.
- Gating: `Vademecum.tsx` (corte no 10º artigo), `Juris.tsx`/`JurisDetail.tsx` (`juris`), `Cadernos.tsx` (`cadernos`), Discursivas (`discursivas`).
- Admin: nova aba "Cupons".
