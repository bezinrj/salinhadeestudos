

## Plano: Seção de Planos de Assinatura + Página "Meu Plano"

### Preços calculados
- **Mensal**: R$ 49,90/mês
- **Trimestral**: R$ 49,90 × 0.88 = **R$ 43,91/mês** (cobrado R$ 131,73/trimestre)
- **Anual**: R$ 49,90 × 0.67 = **R$ 33,43/mês** (cobrado R$ 401,21/ano)

### 1. Dados mock de assinatura (`mockData.ts`)
- Adicionar interface `Subscription` com campos: `planId`, `planName`, `startDate`, `endDate`, `status`, `priceMonthly`, `billingCycle`
- Adicionar campo `subscription` ao `User`
- Criar dados mock: usuário padrão com plano mensal ativo, com datas reais para cálculo de vigência

### 2. Seção de Planos na Home (`Home.tsx`)
- Adicionar nova seção entre o CTA e o footer com 3 cards de planos lado a lado
- Cada card mostra: nome do plano, preço mensal, preço total do ciclo, badge de desconto (trimestral/anual), lista de benefícios incluídos
- Destaque visual no plano trimestral como "Mais popular"
- Botão "Assinar" redireciona para `/login`

### 3. Página "Meu Plano" (`src/pages/MyPlan.tsx`)
- Exibir plano atual do usuário com: nome, preço, data de início, data de vencimento, dias restantes
- Barra de progresso visual da vigência
- Seção para trocar de plano com os 3 cards (destacando o atual)
- Botão de "Mudar plano" que atualiza o mock
- Rota protegida `/meu-plano`

### 4. Navegação
- Adicionar link "Meu Plano" no `AppSidebar.tsx` e `BottomNav.tsx`
- Adicionar rota `/meu-plano` no `App.tsx`

### Escopo total
- 1 página nova (`MyPlan.tsx`)
- 1 componente reutilizável de cards de planos (`PricingCards.tsx`) usado na Home e em MyPlan
- Edições em `mockData.ts`, `App.tsx`, `Home.tsx`, `AppSidebar.tsx`, `BottomNav.tsx`

