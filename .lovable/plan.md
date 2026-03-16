

# Plano: Botao de download do PDF de rascunho na pagina Discursivas

## Mudancas

### 1. Copiar o PDF para `public/`
- Copiar `user-uploads://Folha_de_Resposta_30_linhas.pdf` para `public/Folha_de_Resposta_30_linhas.pdf`

### 2. Editar `src/pages/Discursivas.tsx`
- Importar `Download` do lucide-react e `Button`
- Adicionar entre o titulo e os filtros (apos linha 33) um bloco com:
  - Botao com icone de download e texto "Rascunho - 30 linhas"
  - Link `<a>` com `href="/Folha_de_Resposta_30_linhas.pdf"` e `download`
  - Legenda abaixo: "Treine a escrita, Aproveite a oportunidade e facam honestamente apenas com a lei seca."

