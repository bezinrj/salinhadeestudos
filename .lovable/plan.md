# Correção "por intenção" exclusiva das Questões da Semana

## Objetivo

Nas Questões da Semana, o gabarito é uma **sugestão de resposta esperada**, não um texto taxativo. A correção deve avaliar a **intenção, o raciocínio e o sentido jurídico** da resposta do aluno, com senso crítico, sem punir por não repetir literalmente o gabarito. As questões regulares continuam exatamente como estão hoje.

## Como organizar (recomendação)

A melhor forma é manter **um único fluxo de correção**, mas com **dois modos de avaliação** definidos no servidor:

```text
evaluate-answer
  ├─ questão regular  → modo ESTRITO   (atual, inalterado)
  └─ is_weekly = true → modo INTENÇÃO  (novo)
```

O modo é decidido no backend a partir do próprio cadastro da questão (a função já identifica se a questão é semanal), sem nenhuma opção no cliente — assim o aluno não consegue forçar o modo mais benevolente.

## Regras do modo INTENÇÃO (semanais)

1. O gabarito é tratado como **referência sugerida**, não como texto obrigatório.
2. O barema continua sendo a **estrutura oficial de pontos** — os itens e a divisão de pontos não mudam.
3. Cada critério é avaliado por **equivalência de sentido**: se o aluno chega ao mesmo resultado jurídico por outro caminho, fundamento alternativo válido ou nomenclatura diversa, pontua integralmente.
4. Pontuação parcial passa a ser a regra intermediária real: intenção correta com desenvolvimento incompleto → parcial alto; intenção correta apenas insinuada → parcial baixo; ausência do raciocínio → zero.
5. Senso crítico obrigatório: a IA deve declarar, por critério, **qual era a intenção exigida**, **qual foi a intenção demonstrada pelo aluno** e por que são (ou não) equivalentes.
6. **Fundamentação legal pesa na nota.** Dentro de cada critério do barema, a graduação é:
   - resposta com raciocínio correto **e** fundamentação em dispositivo legal/súmula/jurisprudência pertinente → pontuação integral do item;
   - resposta com raciocínio correto, mas apenas na ordem lógica, sem indicar a base normativa → pontuação parcial alta (não integral);
   - fundamento citado errado ou impertinente → não soma; conta como imprecisão.
   O critério é a **pertinência** do fundamento, não a citação decorada: descrever corretamente a norma aplicável ("o Código Penal pune... no crime de...") vale como fundamentação; citar número de artigo errado, não.
7. Não penalizar: ordem diferente dos argumentos, estilo/redação, terminologia sinônima, ausência do número exato do artigo quando a norma é corretamente identificada pelo conteúdo.
8. Continua penalizando: tese central errada, erro material de direito, conclusão contrária ao caso, omissão real de um eixo do barema.


## Saída da correção (semanal)

Além do que já existe hoje (barema detalhado, nota, pontos positivos, erros, omissões, resposta ideal personalizada, feedback de nota máxima), cada subitem passa a trazer uma justificativa no formato:

- **Intenção exigida** → **Intenção demonstrada** → **Julgamento crítico** (equivalente / parcialmente equivalente / divergente).

E um bloco geral de leitura crítica da resposta: tese sustentada pelo aluno, coerência do raciocínio e se a intenção global atende ao que o enunciado pediu.

## Detalhes técnicos

- `supabase/functions/evaluate-answer/index.ts`: extrair o prompt atual para `buildStrictPrompt()` e criar `buildIntentPrompt()`; selecionar pelo flag `isWeeklyQuestion` já calculado a partir de `weekly_questions.is_weekly`.
- O schema da ferramenta (tool_use) ganha, no modo semanal, campos opcionais por subitem (`intencaoExigida`, `intencaoDemonstrada`, `julgamento`) e um `criticalReading` no nível raiz; questões regulares mantêm o schema atual.
- Frontend (`QuestionDetail.tsx` / rota `/semanal/:id`) exibe esses campos quando presentes, dentro do card de cada critério, sem alterar o layout das questões regulares.
- `src/lib/generateCorrectionReport.ts`: incluir os mesmos campos no PDF quando existirem.
- Regras já vigentes das semanais permanecem: submissão única, prazo de sexta 00:00 BRT, acesso premium.

## Validação

Depois de implementado, você me envia o enunciado, o barema e o espelho de resposta; eu cadastro/simulo uma correção com uma resposta "certa em sentido, diferente em forma" e comparo a nota nos dois modos para confirmar que o modo intenção não pune a divergência de redação.
