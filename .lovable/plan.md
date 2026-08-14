# Incluir a LEP (Lei 7.210/84) no Vade Mecum

## O que será feito

1. Baixar o texto oficial da Lei de Execução Penal no Planalto (link enviado) e extrair o conteúdo limpo, removendo as notas de alteração ("Redação dada pela Lei...", "Incluído por...", "Vide...", "Regulamento") e mantendo "(Revogado)" e "(VETADO)" quando forem o próprio conteúdo do dispositivo.
2. Estruturar no mesmo padrão das leis já importadas (CF/88, CP, CPP, CC, LINDB):
   - Títulos, Capítulos, Seções e Subseções como cabeçalhos centralizados (não viram cards).
   - Artigos como cards, com caput.
   - Parágrafos (§), parágrafo único, incisos (I, II, III) e alíneas (a, b, c) vinculados ao respectivo artigo.
3. Gravar no banco: registro da lei (sigla LEP, categoria "Lei", ordem seguinte à LINDB, publicada) e todos os artigos e subitens, preservando a ordem original.
4. Conferir amostras contra o texto oficial (ex.: art. 41 — direitos do preso; art. 50 — faltas graves; art. 112 — progressão) para garantir que os incisos apareçam dentro do card do artigo.

## Correção pendente que afeta a exibição

Os parágrafos e incisos do CC, CPP e CF/88 já estão gravados no banco, mas o app lê no máximo 1.000 registros por consulta e por isso parte deles não chega à tela (o CC ainda perde os artigos após o milésimo). Isso será corrigido junto, paginando as consultas do Vade Mecum, para que a LEP e as demais leis apareçam completas.

## Detalhes técnicos

- Importação por script (fora do app), gravando em `vm_leis`, `vm_artigos` e `vm_paragrafos`, com `numero` normalizado (ex.: `112`, `2-A`) e `ordem` sequencial — mesmo formato usado nas importações anteriores.
- Reimportação idempotente: se a sigla LEP já existir, os artigos e subitens antigos daquela lei são removidos antes da nova carga.
- `src/hooks/useVademecum.ts`: fetch paginado (`.range()` em laço) para `vm_artigos`, `vm_paragrafos`, `vm_incidencias`, `vm_remissoes` e `vm_progresso`, com os filtros `.in("artigo_id", ...)` fatiados em lotes.
- Nenhuma alteração de estrutura do banco é necessária.
