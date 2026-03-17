

# Plano: Correção semântica com IA

## Problema
A correção atual usa `string.includes(keyword)` — busca exata de palavras-chave. Se o aluno expressa o conceito com sinônimos ou paráfrases, recebe zero mesmo estando correto.

## Solução
Criar uma edge function `evaluate-answer` que usa IA para avaliar semanticamente cada subitem do barema. O frontend chama essa função em vez da `evaluateAnswer()` local.

## Mudanças

### 1. Nova edge function `supabase/functions/evaluate-answer/index.ts`
- Recebe: `answer`, `barema`, `mirrorText`, `idealAnswer`
- Prompt instrui a IA a avaliar cada subitem semanticamente, atribuindo "full", "partial" ou "missed"
- Usa tool calling para retornar resultado estruturado (mesma shape de `CorrectionResult`)
- Modelo: `google/gemini-3-flash-preview`
- Trata erros 429/402

### 2. `supabase/config.toml` — registrar função
- Adicionar `[functions.evaluate-answer]` com `verify_jwt = false`

### 3. `src/pages/QuestionDetail.tsx` — chamar edge function
- Substituir `evaluateAnswer()` local por `supabase.functions.invoke('evaluate-answer', ...)`
- Adicionar estado de loading ("Corrigindo com IA...") com spinner durante avaliação
- Fallback para `evaluateAnswer()` local se a edge function falhar

### 4. `src/pages/Admin.tsx` — teste de correção
- Atualizar o botão "Testar Correção" para usar a edge function também
- Fallback local em caso de erro

### 5. `src/data/mockData.ts`
- Manter `evaluateAnswer` como fallback, sem alterações

## Prompt da IA (resumo)
```
Você é um corretor de questões discursivas de concursos públicos.
Avalie a resposta do aluno contra cada subitem do barema.
Considere sinônimos, paráfrases e expressões equivalentes.
O aluno NÃO precisa usar as palavras exatas — basta demonstrar
o mesmo conceito/sentido.

Para cada subitem, atribua:
- "full" (nota máxima) se o conceito foi adequadamente abordado
- "partial" (50%) se foi mencionado de forma incompleta  
- "missed" (0) se não foi abordado

Gere também: mirror (espelho resumido), positives, errors,
omissions, idealAnswer e feedback.
```

## Arquivos afetados
- `supabase/functions/evaluate-answer/index.ts` (novo)
- `supabase/config.toml` (adicionar entrada)
- `src/pages/QuestionDetail.tsx`
- `src/pages/Admin.tsx`

