# Incluir o Art. 75 na Lei 14.133/2021 (Vade Mecum)

## Situação atual

Na base do Vade Mecum, a Lei 14.133/2021 vai do Art. 74 direto para o Art. 76 — o Art. 75 (hipóteses de dispensa de licitação) não foi importado. As posições de ordenação entre eles estão livres, então dá para inserir o artigo no lugar certo sem remexer no resto da lei.

## O que será feito

1. Buscar o texto oficial compilado do Art. 75 no link do Planalto.
2. Extrair o artigo integralmente: caput, os incisos I a XVI (com suas alíneas), e os parágrafos §1º a §7º, preservando rótulos e ordem.
3. Excluir todo trecho riscado/revogado (itens marcados como "(Revogado)" ou tachados no texto oficial) e limpar as notas de alteração ("Redação dada pela Lei...", "(Vide...)").
4. Inserir o artigo no banco na posição entre o Art. 74 e o Art. 76, mantendo a numeração e a ordenação da lei.
5. Conferir no Vade Mecum: o artigo aparece na navegação, com incisos, alíneas e parágrafos formatados como nos demais, e funcionando com grifos, notas, tags de cargo e remissões.

## Detalhes técnicos

- Uma linha em `vm_artigos` (`lei_id` da 14.133, `numero` "75", `rotulo` "Art. 75", `ordem` entre 100 e 103).
- Subitens em `vm_paragrafos` com `tipo` `inciso` / `alinea` / `paragrafo`, `rotulo` e `ordem` sequencial, seguindo o padrão já usado nos artigos vizinhos (ex.: Art. 74 com 21 subitens).
- Inserção feita via SQL de dados (sem alteração de esquema).
- Verificação final comparando a contagem de incisos/parágrafos com o texto oficial.
