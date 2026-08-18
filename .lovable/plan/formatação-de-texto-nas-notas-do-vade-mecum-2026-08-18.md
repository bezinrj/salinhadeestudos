# Formatação de texto nas notas do Vade Mecum

Adicionar uma barra de formatação nas **notas do professor** e nas **notas privadas** dos artigos, com negrito, itálico, sublinhado, tachado, cores de texto, marca-texto e listas (com bolinhas e numeradas).

## O que muda para o usuário

- Ao criar ou editar uma nota (professor ou privada), aparece uma pequena barra de ferramentas acima do campo de texto com:
  - Negrito, itálico, sublinhado, tachado
  - Paleta de cores do texto (branco, dourado, âmbar, verde, azul, rosa, vermelho)
  - Marca-texto (amarelo, verde, azul, rosa)
  - Lista com bolinhas e lista numerada
  - Limpar formatação
- O texto salvo passa a exibir essa formatação na visualização da nota.
- Notas antigas (texto simples) continuam aparecendo normalmente, com as quebras de linha preservadas.
- As demais regras seguem iguais: nota privada só o dono vê, nota do professor é pública, bloqueio para quem não tem assinatura permanece.

## Detalhes técnicos

- Novo componente `src/components/vademecum/NoteEditor.tsx`: editor `contentEditable` no mesmo padrão do `RichTextEditor` já existente (comentários de questões), usando `document.execCommand` para os comandos de formatação (`bold`, `italic`, `underline`, `strikeThrough`, `foreColor`, `hiliteColor`, `insertUnorderedList`, `insertOrderedList`, `removeFormat`). Sem imagens e sem upload — apenas formatação de texto.
- Novo componente `src/components/vademecum/NoteContent.tsx`: renderiza o conteúdo salvo. Sanitiza o HTML com `dompurify` (já instalado) permitindo apenas tags/atributos de formatação (`b, strong, i, em, u, s, span, ul, ol, li, br, p, div` + `style` restrito a `color`/`background-color`). Se o conteúdo não contiver HTML (notas antigas), renderiza como texto com `whitespace-pre-wrap`.
- `PrivateNoteCard.tsx`: substituir o `Textarea` pelo `NoteEditor` e o `<p>` pelo `NoteContent`.
- `ProfessorNoteCard.tsx`: substituir o `<p>` pelo `NoteContent`.
- `ArticleCard.tsx`: no formulário de "Adicionar nota do professor", trocar o `Textarea`/`profText` pelo `NoteEditor` (mantendo a mesma função de envio).
- Estilos das listas dentro das notas via classes utilitárias (`[&_ul]:list-disc`, `[&_ol]:list-decimal`, `[&_ul]:pl-5`) para as bolinhas aparecerem, já que o reset do Tailwind remove os marcadores.
- Sem mudanças no banco de dados: as colunas `conteudo` de `vm_notas_professor` e `vm_notas_privadas` são texto e passam a guardar HTML sanitizado.
