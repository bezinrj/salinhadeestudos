# Repaginação premium/gamificada da página de Planos

Mesmos planos, preços, textos e fluxo de checkout. Muda apenas a apresentação visual das duas seções (Plano Discursivas e Planos de Conteúdo).

## Direção visual

Grafite/preto do app + ouro para VIP e azul elétrico para ação (tokens já existentes). Sem roxo genérico, sem gradiente arco-íris. Estética "destravar nível": cada plano é um tier, com selo de patente e brilho ao subir.

## O que muda em cada card

- Cabeçalho de tier: ícone dentro de um selo hexagonal/circular com anel luminoso, mais o rótulo do nível ("Nível 1 · Base", "Nível 2 · Avançado", "Nível Máximo").
- Preço com maior peso tipográfico, moeda e "/mês" discretos, e faixa de economia ("Economize 33%") em pílula dourada onde já existe desconto.
- Lista de benefícios com marcadores luminosos (ponto com glow) no lugar dos checks simples; itens herdados ("Tudo do plano X") ganham destaque em itálico com marcador diferente.
- Borda animada: cards comuns com glow suave no hover; card recomendado (Trimestral) e o Salinha PRO com borda pulsante contínua e leve elevação.
- Selos flutuantes no topo — "Mais popular", "Plano atual", "Aceita cupom" — com ícone e sombra, posicionados sem sobrepor o título.
- Botões: primário com gradiente ouro nos planos premium, azul elétrico nos demais, brilho varrendo a superfície no hover e microescala no clique.

## O que muda nas seções

- Título de cada categoria com faixa lateral em degradê e subtítulo curto, mantendo os textos atuais.
- Fundo com halo radial suave atrás dos cards em destaque, para separar as duas categorias visualmente.
- Grid mantém 4 colunas no desktop, 2 em tablet e 1 no mobile; o card em destaque cresce levemente apenas onde há espaço.

## Gatilhos de conversão (sem inventar dados)

- Barra de comparação "o que você desbloqueia" derivada das features já cadastradas.
- Destaque do valor por dia calculado a partir do preço mensal existente (ex.: "menos de R$ 0,50 por dia").
- Selo "cancele quando quiser" e "acesso imediato" como microcopy de segurança abaixo dos botões.

## Detalhes técnicos

- Novos tokens/utilitários em `src/index.css`: `--glow-gold-strong`, animação `pulse-ring`, `border-shimmer` e `btn-sheen`; nada de cores hardcoded nos componentes.
- `src/components/PricingCards.tsx` e `src/components/ContentPlanCards.tsx` recebem a nova estrutura de card (selo de tier, preço, lista, badges, CTA). Props e handlers de checkout ficam intactos.
- Animações com Framer Motion (já usado) para entrada em cascata e hover; pulso do card recomendado via CSS para não pesar.
- Respeitar `prefers-reduced-motion` desativando pulsos e brilhos.
- Nenhuma mudança em `src/lib/stripe.ts`, edge functions, banco ou lógica de entitlements.
