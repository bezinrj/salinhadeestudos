# Preview de Discursivas: 4 cards em 2x2, sem moldura de navegador

## O que muda

No bloco "Discursivas" da vitrine da home (`src/components/home/FeatureShowcase.tsx`):

- Remover a moldura estilo janela de navegador (borda, fundo com blur, bolinhas de semáforo e o texto "salinhadeestudos.com.br") apenas nesse bloco.
- Substituir a imagem `showcase-discursivas.jpg` por uma grade real em JSX com exatamente 4 cards, 2 por linha no desktop e 1 por linha no mobile.
- Cada card segue o visual do exemplo enviado: fundo escuro, borda sutil, cantos arredondados, chips no topo (cargo, matéria, código Q-XXX), título em destaque, linha de metadados (banca/ano), resumo em 2-3 linhas, divisória e rodapé com "Abrir →" e dois ícones circulares.
- Conteúdo dos 4 cards: Delegado, Magistratura, Ministério Público e Defensoria — texto estático de vitrine, sem consulta ao banco.
- Cores e chips vindos dos tokens do design system (graphite/dourado/roxo), sem cores fixas.

## Observações

- Os demais blocos (Vade Digital, Salinha Juris, Ranking) continuam com a moldura de janela e suas imagens atuais.
- O asset `src/assets/showcase-discursivas.jpg` deixa de ser usado e o import é removido.
- Sem mudanças de backend, rotas ou lógica.

## Arquivos

- `src/components/home/FeatureShowcase.tsx`
