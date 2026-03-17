import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answer, barema, mirrorText, idealAnswer } = await req.json();

    if (!answer || !barema) {
      return new Response(JSON.stringify({ error: "answer and barema are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build the barema description for the prompt
    const baremaDescription = barema.map((item: any) =>
      `Item ${item.letter} - ${item.title} (máx ${item.maxScore} pts):\n` +
      item.subitems.map((s: any) => `  • ${s.description} (máx ${s.maxScore} pts)`).join("\n")
    ).join("\n\n");

    const systemPrompt = `Você é um corretor especialista de questões discursivas de concursos públicos brasileiros.

Sua tarefa é avaliar a resposta do aluno contra cada subitem do barema de forma SEMÂNTICA.

REGRAS IMPORTANTES:
- O aluno NÃO precisa usar as palavras exatas do barema ou do espelho.
- Considere sinônimos, paráfrases, expressões equivalentes e conceitos demonstrados de forma diferente.
- Se o aluno demonstra claramente o MESMO CONCEITO exigido pelo subitem, mesmo com palavras totalmente diferentes, atribua "full".
- Se o aluno menciona o conceito de forma incompleta, superficial ou tangencial, atribua "partial".
- Se o conceito NÃO foi abordado de nenhuma forma, atribua "missed".
- Seja justo e generoso na interpretação — o objetivo é avaliar CONHECIMENTO, não correspondência textual.

BAREMA:
${baremaDescription}

${mirrorText ? `ESPELHO DE CORREÇÃO:\n${mirrorText}\n` : ""}
${idealAnswer ? `RESPOSTA IDEAL (REFERÊNCIA):\n${idealAnswer}\n` : ""}`;

    const userPrompt = `RESPOSTA DO ALUNO:
${answer}

Avalie cada subitem do barema e retorne o resultado usando a ferramenta fornecida.`;

    // Build the tool schema matching CorrectionResult shape
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
                description: "Evaluation of each barema item",
                items: {
                  type: "object",
                  properties: {
                    letter: { type: "string", description: "Item letter (e.g., 'a', 'b')" },
                    title: { type: "string", description: "Item title" },
                    maxScore: { type: "number", description: "Maximum score for this item" },
                    earnedScore: { type: "number", description: "Score earned by the student" },
                    subitems: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          description: { type: "string" },
                          maxScore: { type: "number" },
                          earnedScore: { type: "number" },
                          status: { type: "string", enum: ["full", "partial", "missed"] },
                        },
                        required: ["description", "maxScore", "earnedScore", "status"],
                      },
                    },
                  },
                  required: ["letter", "title", "maxScore", "earnedScore", "subitems"],
                },
              },
              mirror: { type: "string", description: "Resumo do espelho de correção" },
              positives: {
                type: "array",
                items: { type: "string" },
                description: "Pontos positivos da resposta do aluno",
              },
              errors: {
                type: "array",
                items: { type: "string" },
                description: "Erros ou abordagens incompletas",
              },
              omissions: {
                type: "array",
                items: { type: "string" },
                description: "Pontos do barema que foram omitidos",
              },
              idealAnswer: { type: "string", description: "Resposta ideal completa" },
              feedback: { type: "string", description: "Feedback de melhoria personalizado para o aluno" },
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
