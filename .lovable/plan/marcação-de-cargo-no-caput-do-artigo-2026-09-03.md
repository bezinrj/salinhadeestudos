# Marcação de cargo no caput do artigo

## Situação atual

Hoje existem dois lugares para marcar cargos:

- No cabeçalho do artigo (botão "Marcar cargos") — a marcação é salva sem vínculo com inciso/parágrafo e aparece no menu como "Artigo inteiro".
- Ao lado de cada inciso, parágrafo ou alínea — com a tag exibida no próprio item.

Falta o que o caput (o texto principal do artigo, antes dos incisos) tenha sua própria marcação visível ali, junto ao texto.

## O que será feito

1. Exibir, logo ao final do texto do caput, as tags de cargo já marcadas para o artigo e — para admin/moderador — o mesmo botão discreto de marcação usado nos incisos.
2. Essa marcação usa a mesma marcação de nível de artigo já existente (nada novo no banco): marcar no caput passa a ser a forma visual de marcar o artigo, e a tag aparece imediatamente ao lado do caput.
3. No menu de navegação das tags do topo, o rótulo "Artigo inteiro" passa a ser "Caput" e a rolagem leva até o caput destacado.
4. O botão do cabeçalho continua funcionando (mesma marcação), mantendo o somatório no topo inalterado.

## Detalhes técnicos

- `src/components/vademecum/ArticleText.tsx`: novas props `incidenciasArtigo` e `canTag` já existente; renderizar, após o `HighlightableText` do caput, o mesmo bloco de tags + `CargoTagPicker` (compact) usado nos parágrafos, chamando `onToggleTag(null, cargo, next)`. Envolver o caput em um elemento com `id={`vm-caput-${artigo.id}`}` e `scroll-mt-24`.
- `src/components/vademecum/ArticleCard.tsx`: passar `incidenciasArtigo` para `ArticleText`; trocar o label da ocorrência de "Artigo inteiro" para "Caput" e fazer `scrollToMarcacao(null)` mirar `vm-caput-${artigo.id}` (com fallback para `vm-art-${artigo.id}`).
- Sem migração de banco e sem alteração no hook `useVmIncidencias`.

## Verificação

- Type-check e build.
- Preview: marcar um cargo pelo caput e confirmar que a tag aparece ao lado do caput, o contador do topo sobe e o menu do topo navega até o caput.
