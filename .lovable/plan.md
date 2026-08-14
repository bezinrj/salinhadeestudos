# Corrigir parágrafos e incisos faltando nos cards (CPP, CC e CF/88)

## Diagnóstico

Os parágrafos, incisos e alíneas **estão corretamente gravados no banco** — a falha é na leitura pelo app.

O backend devolve no máximo 1.000 registros por consulta, e o Vade Mecum busca tudo de uma vez só:

```text
CC     -> 2.486 artigos / 1.751 parágrafos  (corta em 1.000)
CPP    ->   964 artigos / 1.184 parágrafos  (corta em 1.000)
CF/88  ->   361 artigos / 2.080 parágrafos  (corta em 1.000)
CP     ->   492 artigos /   880 parágrafos  (ok hoje)
LINDB  ->    30 artigos /    59 parágrafos  (ok hoje)
```

Consequências observadas:
- No CC, do artigo ~1.000 em diante os cards nem aparecem.
- No CPP e na CF/88, os artigos aparecem, mas os parágrafos/incisos somem a partir do momento em que o limite de 1.000 é atingido.

Confirmado por consulta ao banco: por exemplo, o Art. 1.583 do CC tem 8 subitens gravados e o Art. 5º do CPP tem 10 — eles simplesmente não chegam à tela.

## O que será feito

1. Carregar os artigos e os parágrafos em blocos (paginação de 1.000 em 1.000) até trazer tudo, em vez de uma única requisição.
2. Aplicar o mesmo tratamento às consultas auxiliares que também podem estourar o limite: incidências, remissões, progresso de leitura, grifos e notas do usuário.
3. Verificar na tela, após a correção: CC (últimos artigos, ex.: Art. 2.035), CPP (Art. 282, 386) e CF/88 (artigos finais) exibindo caput + §§ + incisos + alíneas.

## Detalhes técnicos

- `src/hooks/useVademecum.ts`: criar um utilitário de fetch paginado (`.range(offset, offset+999)` em laço até retornar menos que o tamanho da página) e usá-lo em `vm_artigos`, `vm_paragrafos`, `vm_incidencias`, `vm_remissoes` e `vm_progresso`.
- Os filtros `.in("artigo_id", ids)` com milhares de IDs também serão fatiados em lotes para não estourar o tamanho da URL; alternativa mais simples para parágrafos: filtrar por lei via join/`artigo_id in (...)` em lotes de ~500 IDs.
- `src/hooks/useVademecumExtras.ts`: mesma paginação para marcações, notas privadas e notas do professor quando consultadas por lei.
- Nenhuma alteração de banco de dados é necessária; nenhum reimport de leis.
