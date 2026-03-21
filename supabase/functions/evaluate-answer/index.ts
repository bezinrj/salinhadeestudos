import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answer, barema, mirrorText, idealAnswer, statement } = await req.json();

    if (!answer || !barema) {
      return new Response(JSON.stringify({ error: "answer and barema are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build barema description preserving original structure exactly
    const baremaDescription = barema.map((item: any) =>
      `Item ${item.letter} - ${item.title} (máx ${item.maxScore} pts):\n` +
      item.subitems.map((s: any) => `  • ${s.description} (máx ${s.maxScore} pts)`).join("\n")
    ).join("\n\n");

    const systemPrompt = `Você é um corretor especialista de questões discursivas de concursos públicos brasileiros.

## ENTRADAS FIXAS (cadastradas pelo sistema — NÃO modifique, NÃO reorganize, NÃO converta):

### ENUNCIADO DA QUESTÃO:
${statement || "(não informado)"}

### BAREMA OFICIAL (espelho de correção):
${baremaDescription}

${mirrorText ? `### GABARITO OFICIAL (referência de resposta):\n${mirrorText}\n` : ""}
${idealAnswer ? `### RESPOSTA-MODELO CADASTRADA (referência adicional):\n${idealAnswer}\n` : ""}

## ENTRADA VARIÁVEL (enviada pelo aluno no momento da correção):
A resposta do aluno será fornecida na próxima mensagem.

## FUNÇÃO DO CORRETOR:

1. Ler o enunciado cadastrado
2. Ler o barema oficial cadastrado (NÃO recriar, NÃO converter, NÃO alterar divisão de pontos)
3. Ler o gabarito oficial cadastrado
4. Ler a resposta do aluno
5. Comparar a resposta com CADA critério/subitem do barema
6. Atribuir nota por subitem
7. Justificar acertos, erros e omissões
8. Calcular a nota final

## REGRAS DE AVALIAÇÃO SEMÂNTICA:

- O aluno NÃO precisa usar as palavras exatas do barema ou do gabarito
- Considere sinônimos, paráfrases, expressões equivalentes e conceitos demonstrados de forma diferente
- Se o aluno demonstra claramente o MESMO CONCEITO exigido pelo subitem, mesmo com palavras totalmente diferentes, atribua "full"
- Se o aluno menciona o conceito de forma incompleta, superficial ou tangencial, atribua "partial"
- Se o conceito NÃO foi abordado de nenhuma forma, atribua "missed"
- Seja justo e generoso na interpretação — o objetivo é avaliar CONHECIMENTO, não correspondência textual

## REGRAS RÍGIDAS:

- NÃO recriar o barema
- NÃO converter o barema em JSON por iniciativa própria
- NÃO inventar critérios que não existam no barema
- NÃO alterar a divisão de pontos original
- Tratar o barema como espelho OFICIAL
- Tratar o gabarito como referência OFICIAL

## RESPOSTA IDEAL PERSONALIZADA (obrigatória):

Ao final da correção, você DEVE gerar uma RESPOSTA IDEAL PERSONALIZADA para este aluno específico.

Essa resposta ideal deve:
- Ser baseada no barema e no gabarito oficiais
- Considerar os erros, omissões e inconsistências ESPECÍFICAS da resposta DAQUELE aluno
- Mostrar como a resposta poderia ser REESCRITA para alcançar nota máxima
- Ser INDIVIDUALIZADA — não pode ser mera reprodução automática do gabarito
- Corrigir os pontos deficientes da resposta apresentada
- Manter fidelidade ao espelho oficial da correção
- Usar a resposta do aluno como BASE para a personalização (manter trechos corretos, reescrever trechos deficientes)`;

    const userPrompt = `RESPOSTA DO ALUNO:
${answer}

Avalie cada subitem do barema e retorne o resultado usando a ferramenta fornecida. Lembre-se: a resposta ideal (idealAnswer) deve ser PERSONALIZADA para este aluno, baseada nas falhas concretas identificadas na resposta dele.`;

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
                description: "Evaluation of each barema item — use the EXACT same items from the original barema, do NOT create new ones",
                items: {
                  type: "object",
                  properties: {
                    letter: { type: "string", description: "Item letter (e.g., 'a', 'b') — must match the original barema" },
                    title: { type: "string", description: "Item title — must match the original barema" },
                    maxScore: { type: "number", description: "Maximum score — must match the original barema" },
                    earnedScore: { type: "number", description: "Score earned by the student for this item" },
                    subitems: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          description: { type: "string", description: "Subitem description — must match the original barema" },
                          maxScore: { type: "number", description: "Max score — must match the original barema" },
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
