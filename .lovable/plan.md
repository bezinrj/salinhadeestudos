# Corrigir marcação de cargos e navegação pelas tags

## Problema confirmado

A tabela de incidências ainda tem uma regra antiga que só permite **uma marcação por cargo em cada artigo**. Quando o recurso passou a permitir marcar incisos e parágrafos, foram criadas as regras novas (uma por cargo no artigo inteiro + uma por cargo em cada inciso/parágrafo), mas a regra antiga não foi removida. Por isso, ao marcar o mesmo cargo em um segundo inciso do mesmo artigo, aparece o erro de "duplicate key".

## O que será feito

### 1. Liberar múltiplas marcações do mesmo cargo no artigo
- Remover a regra antiga do banco, mantendo as duas regras corretas: um cargo não se repete no artigo inteiro, e não se repete dentro do mesmo inciso/parágrafo.
- Tornar a marcação tolerante: se o mesmo item já estiver marcado, o sistema apenas ignora em vez de mostrar erro.

### 2. Deixar a marcação mais fluida
- Marcar/desmarcar passa a refletir na hora na tela (atualização otimista), sem esperar o recarregamento da lei inteira.
- O menu de cargos continua aberto ao marcar vários cargos em sequência.
- Mensagens de erro claras quando faltar permissão, em vez de erro técnico.

### 3. Menu de navegação nas tags do topo do artigo
- As tags de contagem no topo (ex.: 🔍 4×) passam a ser clicáveis.
- Ao clicar, abre um menu curto listando onde aquele cargo está marcado: "Artigo inteiro" e cada inciso/parágrafo marcado, com um trecho curto do texto para identificação.
- Clicar em um item rola a página até o inciso/parágrafo correspondente e o destaca por alguns segundos.

## Detalhes técnicos

- Migração: `ALTER TABLE public.vm_incidencias DROP CONSTRAINT vm_incidencias_artigo_id_cargo_key;` (os índices parciais `vm_incidencias_artigo_cargo_uniq` e `vm_incidencias_paragrafo_cargo_uniq` já existem e permanecem).
- `src/hooks/useVmIncidencias.ts`: usar `upsert`/`ignoreDuplicates` no insert, atualização otimista no cache `["vm-lei", leiId]` com rollback em caso de erro, e mensagens de erro amigáveis.
- `src/components/vademecum/IncidenciaBadge.tsx`: virar botão dentro de um `Popover` com a lista de ocorrências (props opcionais para manter uso atual).
- `src/components/vademecum/ArticleCard.tsx`: montar a lista por cargo (artigo + parágrafos com o rótulo/trecho) e passar ao badge; disparar o scroll.
- `src/components/vademecum/ArticleText.tsx`: adicionar `id={`p-${p.id}`}` em cada bloco de parágrafo/inciso para permitir `scrollIntoView` e um realce temporário.
