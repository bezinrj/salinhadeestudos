# Corrigir erro "no unique or exclusion constraint matching the ON CONFLICT specification"

## Causa confirmada

A gravação das tags usa `upsert` com `onConflict: "artigo_id,cargo"` (ou `paragrafo_id,cargo`). Porém, as regras de unicidade que sobraram no banco são **índices parciais** (valem só quando `paragrafo_id` é nulo, ou só quando não é nulo). O banco não consegue associar um índice parcial ao `ON CONFLICT` sem a condição correspondente — e o cliente não permite informar essa condição. Resultado: o erro aparece toda vez que se tenta marcar um cargo.

## O que será feito

1. **Trocar o `upsert` por um `insert` simples** em `src/hooks/useVmIncidencias.ts`.
2. **Tratar a duplicidade no código**: se o banco responder que o item já está marcado (erro 23505), a marcação é simplesmente ignorada — sem mensagem de erro e mantendo a atualização otimista na tela. Outros erros (ex.: falta de permissão) continuam com mensagem amigável e desfazem a alteração na tela.
3. **Remover a marcação** continua como está (delete por id com atualização otimista).

Sem nenhuma mudança no banco: os índices parciais corretos já existem e continuam protegendo contra tags duplicadas (um cargo não se repete no artigo inteiro nem dentro do mesmo inciso/parágrafo).

## Verificação

- Type-check e build.
- Teste no preview: marcar o mesmo cargo em dois incisos do mesmo artigo e confirmar que não aparece erro e a contagem no topo atualiza.
