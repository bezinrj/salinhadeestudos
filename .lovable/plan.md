

# Plano: Correção semântica com IA

## Problema
A correção atual usa `string.includes(keyword)` — busca exata de palavras-chave no texto. Se o aluno expressa o mesmo conceito com palavras diferentes, recebe zero. Isso impede notas justas mesmo quando a resposta está correta.

## Solução
Substituir a correção local por uma **edge function que usa IA (Lovable AI)** para avaliar semanticamente cada subitem do barema contra a resposta do aluno. A IA recebe o barema completo, o espelho, a resposta ideal e a resposta do aluno, e retorna a avaliação estruturada via tool calling.

## Mudanças

### 1. Nova edge function `evaluate-answer`
- Recebe: `answer`, `barema`, `mirrorText`, `idealAnswer`
- Monta prompt instruindo a IA a avaliar semanticamente cada subitem, atribuindo "full", "partial" ou "missed"
- Usa tool calling para retornar o resultado estruturado (mesma shape de `CorrectionResult`)
- Modelo: `google/gemini-3-flash-preview` (rápido e capaz)

### 2. `src/pages/QuestionDetail.tsx` — chamar edge function
- Substituir chamada local `evaluateAnswer()` por `supabase.functions.invoke('evaluate-answer', ...)`
- Adicionar loading state durante avaliação (spinner/texto "Corrigindo com IA...")
- Tratar erros (429, 402, falhas)

### 3. `src/pages/Admin.tsx` — teste de correção
- Atualizar o teste de correção no admin para também usar a edge function em vez da função local
- Manter fallback local caso a IA falhe

### 4. `src/data/mockData.ts`
- Manter `evaluateAnswer` como fallback offline, mas não será mais o método principal

## Prompt da IA (resumo)
```
Você é um corretor de questões discursivas. Avalie a resposta do aluno
contra cada subitem do barema. Considere sinônimos, paráfrases e
expressões equivalentes. O aluno NÃO precisa usar as palavras exatas —
basta demonstrar o mesmo conceito/sentido.

Para cada subitem, atribua:
- "full" (nota máxima) se o conceito foi adequadamente abordado
- "partial" (50%) se foi mencionado de forma incompleta
- "missed" (0) se não foi abordado
```

## Arquivos afetados
- `supabase/functions/evaluate-answer/index.ts` (novo)
- `src/pages/QuestionDetail.tsx`
- `src/pages/Admin.tsx`

