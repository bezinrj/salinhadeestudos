Ajustar o preview dos cards de discursivas na home para ocupar menos espaço vertical, mantendo a legibilidade e a disposição 2x2.

## O que será feito
- No componente `src/components/home/FeatureShowcase.tsx`, adicionar controle de tamanho exclusivo para o bloco "discursivas" (sem afetar os demais blocos da vitrine).
- Limitar a altura máxima da imagem de preview, centralizar e ajustar o `object-fit` para que os 4 cards de cargos permaneçam visíveis em uma grade 2x2 compacta.
- Se a imagem atual (1200x912) não renderizar bem nesse novo tamanho, gerar um novo asset de proporção mais quadrada/compacta para melhor encaixe.

## Por quê
A imagem atual dos cards de discursivas está ocupando muito espaço vertical na tela inicial. O usuário quer o mesmo conteúdo (4 cards de cargos) em uma apresentação menor, mantendo a disposição 2x2.

## Arquivos envolvidos
- `src/components/home/FeatureShowcase.tsx` — ajuste de layout no bloco discursivas.
- Possivelmente `src/assets/showcase-discursivas.jpg` — regeneração para proporção mais compacta.
