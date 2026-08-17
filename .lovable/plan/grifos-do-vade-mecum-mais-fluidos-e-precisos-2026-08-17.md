# Grifos do Vade Mecum mais fluidos e precisos

Repaginar a experiência de "grifar trecho" para que a caixa apareça sempre que houver seleção, a seleção respeite palavras inteiras e o popover se comporte bem em desktop e celular.

## Problemas atuais

- A caixa às vezes não aparece: o popover só é acionado no `mouseup` do trecho; em toque (mobile), seleção via teclado, ou quando o `mouseup` acontece fora do parágrafo, nada dispara.
- Falta letra na seleção: os offsets usam exatamente o que o navegador selecionou, sem ajuste para a borda da palavra.
- Ao encostar num grifo existente a criação é bloqueada em silêncio, sem explicação.
- O popover pode nascer fora da tela (topo/laterais) e fica sempre igual no celular.

## O que muda

1. Detecção de seleção robusta
   - Passar a ouvir `selectionchange` (com debounce curto) além de `mouseup`, cobrindo mouse, toque e teclado.
   - Também escutar `touchend`/`pointerup` para abrir o popover no celular após o "arrastar alças".
   - Se a seleção estiver dentro do bloco, o popover sempre abre; se sair do bloco ou colapsar, fecha.

2. Snap de palavra inteira
   - Ajustar automaticamente início e fim da seleção para as bordas da palavra (expandir para trás/frente enquanto houver letra, número, acento ou hífen).
   - Aparar espaços e pontuação sobrando nas pontas, para o trecho salvo ficar limpo.
   - Base para o snap: o texto puro do bloco, então os offsets salvos no banco continuam consistentes.

3. Sobreposição com feedback
   - Ao selecionar sobre um grifo existente, em vez de cancelar em silêncio, abrir o popover no modo de edição do grifo tocado (trocar cor, editar anotação, remover).

4. Popover responsivo
   - Desktop: posição clamp dentro da viewport, com flip para baixo quando não couber acima, e margens de segurança laterais.
   - Mobile (<768px, via `useIsMobile`): apresentar como folha inferior (bottom sheet) com área de toque maior nas cores e no editor de anotação.
   - Fechar com `Esc`, ao rolar a página e ao clicar fora; manter aberto durante ajuste da seleção.

5. Polimento visual e de uso
   - Cores em botões maiores com marcação clara da cor ativa e rótulo.
   - Feedback imediato: a cor é aplicada ao clicar; "Salvar grifo" só aparece quando há anotação.
   - Grifos com anotação ganham indicador discreto e tooltip com prévia do texto.

## Detalhes técnicos

- `src/components/vademecum/HighlightableText.tsx`: substituir `handleMouseUp` por um hook interno de seleção (`selectionchange` + `pointerup` com `requestAnimationFrame` e debounce), extrair `snapToWordBoundaries(text, start, end)` para `src/lib/` e usá-la antes de calcular `trecho`; mudar o caminho de overlap para abrir edição da marcação interceptada.
- `src/components/vademecum/GrifoPopover.tsx`: adicionar cálculo de posição com clamp/flip usando `getBoundingClientRect` do próprio popover, e renderizar variante bottom-sheet quando `useIsMobile()` for verdadeiro; adicionar listeners de `keydown` (Esc) e `scroll`.
- Sem mudanças de banco de dados; o formato de `vm_marcacoes` (offsets, cor, anotação) permanece igual.
- `src/components/vademecum/ArticleText.tsx` continua com a mesma API de callbacks.

## Verificação

- Testes em preview com Playwright: seleção parcial de palavra (deve expandir), seleção por toque simulado, popover perto do topo da tela e perto das bordas, clique em grifo existente e remoção.
