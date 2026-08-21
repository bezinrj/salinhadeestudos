# Correção do halo dourado no popup de degustação

## Problema
O efeito de luz amarela (halo pulsante) no popup `TrialGate` está aparecendo sobreposto ao conteúdo do card, deixando a janela com aspecto amarelado e prejudicando a legibilidade. O usuário espera que o brilho fique exclusivamente atrás do card, pulsando, sem cobrir o texto, ícones e botões.

## Diagnóstico
O halo está inserido como filho de `DialogContent` em `src/components/referral/TrialGate.tsx` (linhas 66-72). O `DialogContent` do shadcn/ui não define `position: relative` em sua classe base, então o `absolute -inset-16 -z-10` do halo pode não estar se posicionando em relação ao card e o `-z-10` não está criando o empilhamento esperado. Além disso, o fundo do card usa `bg-card/95` (95% opaco), que ainda deixa passar muita luz do halo, causando o efeito de sobreposição visível na imagem.

## Solução
Reestruturar o componente `TrialGate.tsx` para que o halo seja renderizado em uma camada realmente atrás do conteúdo do popup, mantendo-o pulsante e chamativo, mas sem cobrir o card. Isso envolve:

- Envolver o `DialogContent` em um container posicionado (`relative`) que sirva de referência para o halo.
- Mover o halo para fora do `DialogContent` (como um elemento irmão dentro do mesmo wrapper), garantindo que ele fique abaixo do card no contexto de empilhamento.
- Usar `z-index` controlado: halo em `z-0` ou `z-10`, e o `DialogContent` em uma camada superior.
- Aumentar a opacidade do fundo do card para evitar que a luz amarela penetre no conteúdo (`bg-card` sólido ou `bg-card/98`), mantendo a borda dourada sutil.
- Preservar a animação `gold-pulse` e o respeito a `prefers-reduced-motion` (já configurado em `src/index.css`).

## Mudanças previstas

### Em `src/components/referral/TrialGate.tsx`
1. Substituir a estrutura atual do `Dialog` por uma versão com wrapper posicionado:
   - Manter `<Dialog open={offerOpen} onOpenChange={...}>`, mas alterar o conteúdo interno.
   - Usar um `div` com `relative` (ou `relative z-50`) ao redor do `DialogContent` e do halo.
2. Mover o halo para fora do `DialogContent`:
   - Renderizar o halo como um `div` irmão do `DialogContent`, posicionado com `absolute` em relação ao wrapper.
   - Ajustar tamanho e deslocamento para continuar pulsando atrás do popup (ex: `absolute -inset-12` ou `absolute -inset-16`).
3. Ajustar o `DialogContent`:
   - Adicionar `relative z-10` para garantir que fique acima do halo.
   - Alterar fundo para `bg-card` ou `bg-card/98` para evitar transparência excessiva.
   - Manter `border-gold/40` e demais estilos premium.
4. Garantir que o fechamento do dialog e a interação (botões) continuem funcionando normalmente.

### Em `src/index.css` (se necessário)
- Verificar se a animação `gold-pulse` respeita `prefers-reduced-motion`.
- Caso não esteja, adicionar a media query correspondente para reduzir ou remover a animação quando o usuário preferir movimento reduzido.

## Validação
- Verificar visualmente o preview com o popup de degustação aberto.
- Confirmar que o halo dourado pulsa atrás do card e não interfere na legibilidade do texto, ícones e botões.
- Confirmar que o efeito respeita `prefers-reduced-motion`.
- Verificar que o botão "Indicar amigos e liberar" e "Agora não" continuam clicáveis e acessíveis.
