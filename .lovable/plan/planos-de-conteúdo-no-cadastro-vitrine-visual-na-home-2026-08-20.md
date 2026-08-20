# Planos de conteúdo no cadastro + vitrine visual na home

## 1. Planos de conteúdo na tela de cadastro

Hoje o passo "1. Escolha seu plano" mostra só Grátis + os planos Discursivas. Passa a ter duas seções na mesma coluna:

- **Plano Discursivas** — Grátis, Mensal, Trimestral, Anual (como está hoje).
- **Planos de Conteúdo** — Vade Digital (R$ 14,90), Salinha Juris (R$ 19,90), Combo Vade + Juris (R$ 24,90, marcado como recomendado) e Salinha PRO (R$ 59,90).

Cada item de conteúdo segue o mesmo estilo de botão selecionável (borda, ring ao selecionar, preço à direita, 2 benefícios). O plano selecionado continua indo para o checkout após criar a conta, usando o mesmo fluxo já existente (`priceId` na query `?plan=`). Nenhuma mudança na lógica de pagamento.

## 2. Nova vitrine na página inicial

Inserida **logo após** o bloco "Tudo que você precisa para evoluir" (antes da faixa de Benefícios). Todo o resto da home permanece igual.

Três blocos alternados (imagem de um lado, texto do outro), com animação de entrada suave:

1. **Vade Digital** — leis completas, grifos coloridos, notas do professor e notas privadas, cadernos e súmulas. Imagem: tela real de um artigo com grifo e nota.
2. **Salinha Juris** — julgados decodificados (tese, fundamentos, íntegra) + assistente de IA que responde dúvidas sobre o julgado. Imagem: tela real do julgado e do painel de IA.
3. **Ranking das Questões da Semana** — questão semanal, correção por IA e disputa no ranking. Imagem: tela real do ranking/pódio.

Cada bloco tem um selo da área, 3–4 bullets curtos e um botão "Criar conta" / "Ver planos". Abaixo dos três, uma faixa curta com contagem real de conteúdo (leis, súmulas, julgados) para reforço visual.

## Imagens reais

As imagens serão capturas de tela reais do próprio app (Vade Mecum, Julgado + IA, Ranking semanal), tiradas no ambiente com sessão autenticada, salvas em `src/assets/` e importadas como imagens estáticas, dentro de uma moldura estilo "janela do app" (cantos arredondados, borda sutil, brilho dourado/azul).

## Detalhes técnicos

- `src/pages/Cadastro.tsx`: importar `CONTENT_PLANS`, renderizar segunda lista de botões e ajustar o rótulo "Plano selecionado" para reconhecer planos de conteúdo (`getAnyPlanName`).
- `src/components/home/FeatureShowcase.tsx` (novo): componente com os três blocos + faixa de números; usado só na home.
- `src/pages/Home.tsx`: inserir `<FeatureShowcase />` logo após a seção de features.
- Assets novos em `src/assets/` (screenshots otimizados). Sem mudanças em backend, Stripe ou gating.
