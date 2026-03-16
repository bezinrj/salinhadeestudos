

# Plano: Gerar barema automaticamente a partir de diretrizes em texto livre

## Problema
O admin precisa escrever JSON complexo manualmente para o barema. O ideal é colar as diretrizes/gabarito em texto livre e gerar o JSON automaticamente via IA.

## Solução

### 1. Nova edge function `generate-barema`
- Recebe `{ statement, guidelines }` (enunciado + diretrizes em texto livre)
- Usa Lovable AI (google/gemini-3-flash-preview) com tool calling para retornar JSON estruturado `BaremaItem[]`
- O prompt instrui o modelo a: distribuir 10 pontos, criar itens com letras (a, b, c...), subitens com keywords relevantes extraídas das diretrizes
- Retorna o JSON pronto para uso

### 2. Alteração no Admin (`src/pages/Admin.tsx` — WeeklyQuestionsTab)
- Adicionar `<Textarea>` "Diretrizes / Gabarito" para texto livre (acima do campo JSON)
- Adicionar botão **"Gerar Barema com IA"** que chama a edge function
- O JSON resultante preenche automaticamente o campo `baremaJson` existente
- O teste de correção continua funcionando normalmente para validação
- O admin pode editar o JSON gerado se necessário

### Fluxo
```text
1. Admin escreve enunciado da questão
2. Cola as diretrizes/gabarito em texto livre
3. Clica "Gerar Barema com IA" → JSON gerado automaticamente
4. (Opcional) Ajusta o JSON
5. Testa a correção com resposta exemplo
6. Publica
```

### Arquivos
- `supabase/functions/generate-barema/index.ts` — nova edge function
- `src/pages/Admin.tsx` — campo de diretrizes + botão de geração
- Sem mudanças no banco

