# Correção do halo dourado no popup de degustação

## Problema
O efeito de blur dourado (halo pulsante) no popup `TrialGate` está aparecendo na frente do card, cobrindo o conteúdo, em vez de ficar pulsando atrás da janela do popup.

## Diagnóstico
O halo está inserido dentro do `DialogContent` (linha 66-72 de `src/components/referral/TrialGate.tsx`). O `DialogContent` usa `bg-card/95 backdrop-blur-xl`. Como o `backdrop-blur` aplica blur em tudo que está atrás do elemento, ele acaba borrando o próprio halo e criando o efeito visual de que o blur está na frente do card.

## Solução
Ajustar o `DialogContent` no `TrialGate.tsx` para remover o `backdrop-blur-xl` do card e deixar o halo brilhante posicionado atrás do conteúdo, sem ser afetado por filtro de backdrop.

### Mudanças previstas
- Em `src/components/referral/TrialGate.tsx`:
  - Remover `backdrop-blur-xl` do `DialogContent` (ou substituir por fundo sólido mais opaco).
  - Garantir que o halo (`-z-10`) permaneça posicionado atrás do card, com seu próprio `blur-3xl`/`blur-2xl` intacto.
  - Manter a borda dourada sutil, o título premium, a lista de benefícios e o rodapé.

### Validação
- Verificar visualmente o preview com o popup de degustação aberto.
- Confirmar que o halo dourado pulsa atrás do card e não interfere na legibilidade do texto/ícones.
- Confirmar que o efeito respeita `prefers-reduced-motion` (já configurado em `src/index.css`).
