# Incluir novas leis no Vade Mecum

Sim — basta me enviar os links. O projeto já tem um pipeline pronto de importação de leis, o mesmo usado na CF/88 e no ADCT.

## Como funciona hoje

```text
Link (Planalto)  ->  texto bruto (scripts/leis/<sigla>.txt)
                 ->  parser (scripts/parse-lei.ts)  ->  scripts/leis/<sigla>.ts
                 ->  importador (scripts/importar-lei.ts)
                 ->  banco: vm_leis / vm_artigos / vm_paragrafos
```

O parser reconhece Preâmbulo, Título, Capítulo, Seção, Subseção, Art., §, Parágrafo único, incisos (I, II, III) e alíneas (a, b, c), preservando a hierarquia e a ordem.

## O que você precisa mandar

Só o link (de preferência do Planalto, versão "texto compilado"). Para cada lei, se quiser, informe também:

- Sigla curta usada no app (ex.: CF88, CP, CPP, CC, CLT)
- Nome completo
- Categoria (ex.: Constitucional, Penal, Civil, Trabalhista) — usada no agrupamento da barra lateral
- Se deve entrar publicada ou como rascunho

Se não informar, eu preencho a partir do próprio texto oficial.

## O que eu faço

1. Busco o conteúdo do link e salvo o texto bruto.
2. Rodo o parser e reviso o resultado (numeração, artigos com letra como 29-A, revogados, incisos aninhados).
3. Confiro amostras de artigos contra o texto oficial.
4. Importo para o banco com a sigla/categoria/ordem corretas.
5. Verifico no Vade Mecum: navegação por artigos, grifos, notas e remissões funcionando na lei nova.

## Observações

- Leis muito longas (ex.: CPC, CC) são importadas em lote; a ordenação de artigos é mantida.
- Textos com muitas notas de rodapé/alterações ("Redação dada pela Lei...") são limpos para não poluir o artigo.
- Se algum link não estiver acessível, peço o texto colado ou o PDF.

Pode mandar os links em lista, um por linha.
