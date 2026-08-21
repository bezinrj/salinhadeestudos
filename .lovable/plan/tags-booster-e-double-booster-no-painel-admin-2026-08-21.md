# Tags Booster e Double Booster no painel admin

## O que já funciona hoje (verificado)

- Cupom de 100% no plano **Combo Vade + Juris**: já libera o acesso na hora (Vade, Cadernos e Juris por 1 mês) sem passar por pagamento, e registra o resgate. Nada a corrigir aqui — só vou validar o fluxo ponta a ponta e garantir que o acesso apareça imediatamente após o resgate, sem precisar recarregar.
- Cupom de desconto parcial (ex.: 40%): já segue para o checkout com o desconto aplicado ao valor do plano. Também mantido.
- Hoje existe 1 cupom cadastrado (40%) e nenhum resgate registrado.

## Lacuna que precisa ser resolvida

O uso de cupom parcial **não é registrado em lugar nenhum** — só o de 100% é. Sem esse registro não há como saber quem é Booster. Então o sistema passará a registrar todo uso de cupom, com o percentual aplicado.

## Regras das tags

- **Double Booster** — usou cupom de 100% de desconto.
- **Booster** — usou cupom com desconto parcial (qualquer valor abaixo de 100%).
- Quem usou os dois tipos aparece como Double Booster.

## Onde aparece

1. **Menu Usuários (admin):** nova etiqueta ao lado do usuário — Double Booster (dourada) e Booster (roxa/azul). Ela convive com a etiqueta de acesso atual (Premium / Cortesia / Degustação / Gratuito), pois são informações diferentes.
2. **Visão geral (admin):** dois cartões novos — **Boosters** e **Double Boosters** — clicáveis, abrindo a lista de usuários correspondentes com cupom usado e data.
3. Filtro rápido na aba Usuários para ver só Boosters ou só Double Boosters.

## Detalhes técnicos

- Migração em `coupon_redemptions`: adicionar `percent_off` (int) e `status` ('checkout' | 'granted'), mantendo os registros atuais como `granted`/100. Índice por `user_id`.
- `create-checkout`: após validar um cupom parcial e criar a sessão do Stripe, gravar o resgate (`status='checkout'`, `percent_off`) e incrementar `used_count`, respeitando a regra de um uso por usuário. Como a função roda com o token do usuário, a gravação usa uma RPC `SECURITY DEFINER` (`register_coupon_use`) para não depender de política de escrita aberta na tabela.
- `redeem_full_coupon`: passa a preencher `percent_off=100` e `status='granted'`.
- `Admin.tsx`: `OverviewTab` consulta `coupon_redemptions` (join com `coupons`) para os dois contadores e as listas em drawer; `UsersTab` recebe o mapa `userId -> booster | double` e renderiza a nova etiqueta.
- Sem mudança nos valores ou preços dos planos.
