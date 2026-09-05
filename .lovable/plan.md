# Corrigir a formatação dos textos da Salinha Juris

## O que será feito

- Padronizar a exibição dos itens de **Princípios jurídicos**, **Doutrinadores** e **Jurisprudência** conforme a imagem 2: título destacado e descrição abaixo, sem mostrar `**`, numeração ou outros sinais de Markdown.
- Interpretar corretamente os formatos já existentes, incluindo:
  - `**Título**: descrição`
  - `**Título** — descrição`
  - `Título — descrição`
  - itens iniciados por `1.`, `*`, `-` ou marcadores semelhantes.
- Preservar acentos, siglas, referências legais e dois-pontos que pertençam ao próprio título.
- Manter compatibilidade com julgados antigos, sem alterar o conteúdo salvo no banco de dados.
- Ajustar as instruções da geração de novos julgados para exigir texto simples no padrão `Título — descrição`, sem Markdown, evitando que o problema volte a ocorrer.

## Detalhes técnicos

- Criar uma função reutilizável para dividir cada linha em título e descrição, priorizando o trecho delimitado por `**...**` quando presente e usando o travessão como formato padrão.
- Aplicar essa normalização nos três blocos estruturados da aba **Oratória** em `JurisDetail.tsx`.
- Atualizar as descrições dos campos e o prompt de `juris-generate` para proibir a inclusão de `**` e outros marcadores Markdown nesses campos.
- Validar com exemplos no formato atual e no formato incorreto mostrado na imagem, além de conferir a compilação do projeto.
