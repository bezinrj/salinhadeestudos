# Corrigir a formatação da aba Conceitual

## O que será feito

- Exibir cada conceito em um bloco organizado, com o **nome do instituto em destaque** e a explicação logo abaixo, removendo da visualização os sinais `**` e o separador `:`.
- Aplicar a correção aos julgados já cadastrados, inclusive ao julgado “Inconstitucionalidade de alíquota reduzida de ICMS para cerveja com suco de caju”, sem alterar o texto armazenado.
- Manter compatibilidade com conteúdo conceitual em texto corrido e com itens nos formatos `**Título**: descrição` e `Título — descrição`.
- Ajustar a geração de novos julgados para produzir os conceitos em texto simples, um por linha, evitando novos sinais de Markdown visíveis.

## Detalhes técnicos

- Reutilizar e ampliar o formatador estruturado já aplicado em Princípios, Doutrina e Jurisprudência.
- Na aba **Conceitual**, detectar linhas estruturadas e renderizar título e descrição separadamente; quando o conteúdo não tiver essa estrutura, preservar a apresentação atual em parágrafos.
- Adicionar testes para o conteúdo real deste julgado e para o formato simples, garantindo compatibilidade com registros antigos.
- Validar os testes, a compilação e publicar a atualização da função de geração para que o novo padrão seja usado nos próximos julgados.
