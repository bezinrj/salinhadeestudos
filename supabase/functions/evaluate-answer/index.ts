import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answer, baremaText, gabarito, statement } = await req.json();

    if (!answer) {
      return new Response(JSON.stringify({ error: "answer is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!baremaText && !gabarito) {
      return new Response(JSON.stringify({ error: "baremaText or gabarito is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um corretor especialista de questões discursivas de concursos públicos brasileiros.

## ENTRADAS FIXAS (cadastradas pelo sistema — NÃO modifique, NÃO reorganize, NÃO converta):

### ENUNCIADO DA QUESTÃO:
${statement || "(não informado)"}

### BAREMA OFICIAL (critérios de correção — espelho oficial):
${baremaText || "(não informado)"}

### GABARITO OFICIAL (resposta de referência):
${gabarito || "(não informado)"}

## ENTRADA VARIÁVEL (enviada pelo aluno no momento da correção):
A resposta do aluno será fornecida na próxima mensagem.

## FUNÇÃO DO CORRETOR:

1. Ler o enunciado cadastrado
2. Ler o barema oficial cadastrado — este é o espelho oficial, NÃO recriar, NÃO converter em JSON, NÃO alterar a divisão de pontos
3. Ler o gabarito oficial cadastrado — esta é a referência oficial
4. Ler a resposta do aluno
5. Identificar os itens/critérios presentes no barema oficial
6. Comparar a resposta do aluno com CADA critério do barema
7. Atribuir nota por item/critério
8. Justificar acertos, erros e omissões
9. Calcular a nota final (soma das notas por item, máximo 10)

## REGRAS DE AVALIAÇÃO SEMÂNTICA:

- O aluno NÃO precisa usar as palavras exatas do barema ou do gabarito
- Considere sinônimos, paráfrases, expressões equivalentes e conceitos demonstrados de forma diferente
- Se o aluno demonstra claramente o MESMO CONCEITO exigido pelo critério, mesmo com palavras totalmente diferentes, atribua "full"
- Se o aluno menciona o conceito de forma incompleta, superficial ou tangencial, atribua "partial"
- Se o conceito NÃO foi abordado de nenhuma forma, atribua "missed"
- Seja justo e generoso na interpretação — o objetivo é avaliar CONHECIMENTO, não correspondência textual

## REGRAS RÍGIDAS:

- NÃO recriar o barema
- NÃO converter o barema em JSON por iniciativa própria (a estrutura JSON de saída é apenas para a ferramenta de resposta)
- NÃO inventar critérios que não existam no barema
- NÃO alterar a divisão de pontos original
- Tratar o barema como espelho OFICIAL
- Tratar o gabarito como referência OFICIAL
- Extrair os itens e pontuações EXATAMENTE como estão no barema de texto

## RESPOSTA IDEAL PERSONALIZADA (obrigatória):

Ao final da correção, você DEVE gerar uma RESPOSTA IDEAL PERSONALIZADA para este aluno específico.

Essa resposta ideal deve:
- Ser baseada no barema e no gabarito oficiais
- Considerar os erros, omissões e inconsistências ESPECÍFICAS da resposta DAQUELE aluno
- Mostrar como a resposta poderia ser REESCRITA para alcançar nota máxima
- Ser INDIVIDUALIZADA — NÃO pode ser mera reprodução automática do gabarito
- Corrigir os pontos deficientes da resposta apresentada
- Manter os trechos corretos da resposta do aluno
- Reescrever apenas os trechos deficientes
- Manter fidelidade ao espelho oficial da correção
- Usar a resposta do aluno como BASE para a personalização`;

    const userPrompt = `RESPOSTA DO ALUNO:
${answer}

Avalie cada critério do barema e retorne o resultado usando a ferramenta fornecida. 
IMPORTANTE: 
- Extraia os itens/critérios do barema de texto e use-os no baremaBreakdown
- A resposta ideal (idealAnswer) deve ser PERSONALIZADA para este aluno, reescrevendo a resposta dele corrigindo erros e omissões`;

    const tools = [
      {
        type: "function",
        function: {
          name: "submit_correction",
          description: "Submit the structured correction result for the student's answer",
          parameters: {
            type: "object",
            properties: {
              baremaBreakdown: {
                type: "array",
                description: "Evaluation of each item/criterion extracted from the text barema. Use the EXACT items from the original barema text.",
                items: {
                  type: "object",
                  properties: {
                    letter: { type: "string", description: "Item identifier (e.g., 'a', 'b', '1', '2') — extracted from the barema text" },
                    title: { type: "string", description: "Item/criterion title — extracted from the barema text" },
                    maxScore: { type: "number", description: "Maximum score for this item — extracted from the barema text" },
                    earnedScore: { type: "number", description: "Score earned by the student for this item" },
                    subitems: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          description: { type: "string", description: "Subitem/sub-criterion description — extracted from the barema text" },
                          maxScore: { type: "number", description: "Max score for this subitem — extracted from the barema text" },
                          earnedScore: { type: "number", description: "Score earned by the student" },
                          status: { type: "string", enum: ["full", "partial", "missed"] },
                          justification: { type: "string", description: "Brief justification for the score attributed" },
                        },
                        required: ["description", "maxScore", "earnedScore", "status", "justification"],
                      },
                    },
                  },
                  required: ["letter", "title", "maxScore", "earnedScore", "subitems"],
                },
              },
              mirror: { type: "string", description: "Resumo do espelho de correção baseado no barema oficial" },
              positives: {
                type: "array",
                items: { type: "string" },
                description: "Pontos positivos da resposta do aluno — o que ele acertou e demonstrou conhecimento",
              },
              errors: {
                type: "array",
                items: { type: "string" },
                description: "Erros, imprecisões ou abordagens incorretas na resposta do aluno",
              },
              omissions: {
                type: "array",
                items: { type: "string" },
                description: "Pontos do barema que foram completamente omitidos pelo aluno",
              },
              idealAnswer: {
                type: "string",
                description: "Resposta ideal PERSONALIZADA para este aluno: reescrita da resposta corrigindo os erros e omissões identificados, mantendo trechos corretos e melhorando os deficientes, baseada no barema e gabarito oficiais. NÃO é uma cópia do gabarito.",
              },
              feedback: {
                type: "string",
                description: "Feedback de melhoria personalizado para o aluno, com dicas práticas de estudo",
              },
            },
            required: ["baremaBreakdown", "mirror", "positives", "errors", "omissions", "idealAnswer", "feedback"],
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_correction" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos na sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      return new Response(JSON.stringify({ error: "Erro ao chamar IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(aiResult));
      return new Response(JSON.stringify({ error: "IA não retornou resultado estruturado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const correction = JSON.parse(toolCall.function.arguments);

    // Calculate total grade from baremaBreakdown
    const grade = Math.round(
      correction.baremaBreakdown.reduce((sum: number, item: any) => sum + item.earnedScore, 0) * 10
    ) / 10;

    const result = {
      id: `corr-${Date.now()}`,
      questionId: "",
      userId: "",
      answer,
      grade,
      maxGrade: 10,
      mirror: correction.mirror,
      positives: correction.positives,
      errors: correction.errors,
      omissions: correction.omissions,
      idealAnswer: correction.idealAnswer,
      feedback: correction.feedback,
      createdAt: new Date().toISOString().split("T")[0],
      baremaBreakdown: correction.baremaBreakdown,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-answer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
