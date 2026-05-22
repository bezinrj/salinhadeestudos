import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { answer, baremaText, gabarito, statement, imageBase64, mimeType, directCorrection, questionId } = await req.json();

    const hasImage = !!imageBase64 && directCorrection;

    if (!answer && !hasImage) {
      return new Response(JSON.stringify({ error: "answer or image is required" }), {
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

    // Server-side subscription / free-tier paywall enforcement
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const now = new Date();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier, subscription_end, banco_geral_expires_at")
      .eq("id", userId)
      .maybeSingle();

    const isSubscribed = !!profile && (
      (!!profile.subscription_tier && (!profile.subscription_end || new Date(profile.subscription_end) > now)) ||
      (!!profile.banco_geral_expires_at && new Date(profile.banco_geral_expires_at) > now)
    );

    let isPremiumQuestion = false;
    let isWeeklyQuestion = false;
    if (questionId) {
      const { data: q } = await supabaseAdmin
        .from("weekly_questions")
        .select("is_premium, is_weekly")
        .eq("id", questionId)
        .maybeSingle();
      if (q) {
        isPremiumQuestion = !!q.is_premium || !!q.is_weekly;
        isWeeklyQuestion = !!q.is_weekly;
      }
    }

    const FREE_MONTHLY_LIMIT = 3;
    let shouldLogFreeUsage = false;
    if (!isSubscribed && isPremiumQuestion && !isWeeklyQuestion && questionId) {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: usage } = await supabaseAdmin
        .from("free_plan_usage")
        .select("question_id")
        .eq("user_id", userId)
        .gte("used_at", monthStart);
      const used = (usage || []) as Array<{ question_id: string }>;
      const alreadyUsedThis = used.some((u) => u.question_id === questionId);
      if (!alreadyUsedThis && used.length >= FREE_MONTHLY_LIMIT) {
        return new Response(
          JSON.stringify({ error: "Limite gratuito mensal atingido. Assine para continuar." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      shouldLogFreeUsage = !alreadyUsedThis;
    } else if (!isSubscribed && isPremiumQuestion && !isWeeklyQuestion && !questionId) {
      // Premium content requested without questionId → cannot validate quota safely
      return new Response(
        JSON.stringify({ error: "questionId obrigatório para conteúdo premium" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const handwritingSection = hasImage ? `

## DIAGNÓSTICO DE CALIGRAFIA (obrigatório quando a resposta vem de imagem manuscrita):

Analise a caligrafia da imagem e classifique em um dos níveis:
- "plenamente_legivel" — A caligrafia é legível e não compromete a correção.
- "legivel_com_esforco" — A escrita é compreensível, embora exija algum esforço pontual do corretor.
- "prejudica_parcialmente" — A caligrafia apresenta trechos de difícil leitura, o que pode prejudicar parcialmente a avaliação.
- "compromete_correcao" — A legibilidade está bastante comprometida e isso pode impedir uma correção segura em alguns trechos.

Forneça também uma observação humanizada e objetiva sobre a caligrafia.
Este diagnóstico NÃO substitui a correção do conteúdo — é uma observação complementar.
Só aponte impedimento quando a escrita realmente inviabilizar compreender trechos relevantes.

Ao corrigir a partir de imagem manuscrita:
- Tente preservar a resposta real do aluno
- NÃO penalize automaticamente pequenas falhas de leitura
- Se houver trechos ilegíveis, mencione na correção mas NÃO invente conteúdo` : "";

    const systemPrompt = `Você é um corretor especialista de questões discursivas de concursos públicos brasileiros.

## ENTRADAS FIXAS (cadastradas pelo sistema — NÃO modifique, NÃO reorganize, NÃO converta):

### ENUNCIADO DA QUESTÃO:
${statement || "(não informado)"}

### BAREMA OFICIAL (critérios de correção — espelho oficial):
${baremaText || "(não informado)"}

### GABARITO OFICIAL (resposta de referência):
${gabarito || "(não informado)"}

## ENTRADA VARIÁVEL (enviada pelo aluno no momento da correção):
${hasImage ? "A resposta do aluno será fornecida como IMAGEM MANUSCRITA na próxima mensagem." : "A resposta do aluno será fornecida na próxima mensagem."}

## FUNÇÃO DO CORRETOR:

1. Ler o enunciado cadastrado
2. Ler o barema oficial cadastrado — este é o espelho oficial, NÃO recriar, NÃO converter em JSON, NÃO alterar a divisão de pontos
3. Ler o gabarito oficial cadastrado — esta é a referência oficial
4. Ler a resposta do aluno${hasImage ? " (transcrever mentalmente a imagem manuscrita)" : ""}
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
- Usar a resposta do aluno como BASE para a personalização

## FEEDBACK PARA ALCANÇAR A NOTA MÁXIMA (obrigatório — campo maxScoreFeedback):

Você DEVE preencher o campo estruturado "maxScoreFeedback" comparando: enunciado, barema, gabarito, resposta concreta do aluno e a pontuação atribuída em cada critério. Mostre EXATAMENTE o que o aluno precisaria corrigir, acrescentar ou substituir para sair da nota obtida e chegar à nota máxima.

Regras inegociáveis:
- NUNCA genérico ("estude mais o tema", "leia a doutrina"). PROIBIDO.
- Sempre relacionar a CADA frase concreta escrita (ou omitida) pelo aluno.
- Sempre dizer o que faltou pontuar em cada item do barema.
- Sempre indicar expressões técnicas, palavras-chave, dispositivos legais e fundamentos jurídicos que aumentariam a nota.
- Se o aluno errou a TESE principal, aponte isso expressamente em thesisAssessment.
- Se houve acerto parcial, reconheça o acerto e explique o que faltou para a pontuação integral.
- Tom: corretor de banca falando diretamente com o aluno (2ª pessoa), didático, direto.
- Não apenas repetir o gabarito — transformá-lo em orientação prática de melhoria.
- O campo "modelSentence" deve trazer um trecho curto no estilo de prova discursiva (1 a 3 frases) que o aluno poderia usar como modelo.${handwritingSection}`;

    // Build user message content
    const userContent: any[] = [];
    
    if (hasImage) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
        },
      });
      userContent.push({
        type: "text",
        text: `Esta é a RESPOSTA MANUSCRITA DO ALUNO em imagem. Leia a imagem, transcreva mentalmente o conteúdo e avalie cada critério do barema. Retorne o resultado usando a ferramenta fornecida.
IMPORTANTE: 
- Extraia os itens/critérios do barema de texto e use-os no baremaBreakdown
- A resposta ideal (idealAnswer) deve ser PERSONALIZADA para este aluno
- Inclua o diagnóstico de caligrafia (handwritingNote e handwritingLevel)`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `RESPOSTA DO ALUNO:
${answer}

Avalie cada critério do barema e retorne o resultado usando a ferramenta fornecida.
IMPORTANTE: 
- Extraia os itens/critérios do barema de texto e use-os no baremaBreakdown
- A resposta ideal (idealAnswer) deve ser PERSONALIZADA para este aluno, reescrevendo a resposta dele corrigindo erros e omissões`,
      });
    }

    const toolProperties: any = {
      baremaBreakdown: {
        type: "array",
        description: "Evaluation of each item/criterion extracted from the text barema.",
        items: {
          type: "object",
          properties: {
            letter: { type: "string", description: "Item identifier (e.g., 'a', 'b', '1', '2')" },
            title: { type: "string", description: "Item/criterion title" },
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
                  justification: { type: "string" },
                },
                required: ["description", "maxScore", "earnedScore", "status", "justification"],
              },
            },
          },
          required: ["letter", "title", "maxScore", "earnedScore", "subitems"],
        },
      },
      mirror: { type: "string", description: "Resumo do espelho de correção" },
      positives: { type: "array", items: { type: "string" }, description: "Pontos positivos" },
      errors: { type: "array", items: { type: "string" }, description: "Erros e imprecisões" },
      omissions: { type: "array", items: { type: "string" }, description: "Omissões" },
      idealAnswer: { type: "string", description: "Resposta ideal PERSONALIZADA" },
      feedback: { type: "string", description: "Feedback de melhoria geral, curto" },
      maxScoreFeedback: {
        type: "object",
        description: "Feedback DETALHADO, ESPECÍFICO e NÃO genérico para o aluno alcançar a nota máxima. DEVE comparar a resposta concreta do aluno com o enunciado, barema e gabarito. NUNCA usar frases genéricas como 'estude mais o tema'. Sempre falar com o aluno em 2ª pessoa, como um corretor de banca.",
        properties: {
          thesisAssessment: {
            type: "string",
            description: "Diga EXPRESSAMENTE se o aluno acertou ou errou a TESE CENTRAL da questão. Se errou, aponte qual era a tese correta. Se acertou parcialmente, reconheça e explique o que faltou.",
          },
          pointsLost: {
            type: "array",
            items: { type: "string" },
            description: "Lista dos erros materiais, omissões, imprecisões e classificações erradas que derrubaram a nota. Cada item deve referenciar o que o aluno escreveu (ou deixou de escrever) e o critério do barema afetado.",
          },
          whatShouldHaveBeenWritten: {
            type: "string",
            description: "Mostre objetivamente, item por item do barema, quais FUNDAMENTOS JURÍDICOS, palavras-chave, expressões técnicas e dispositivos legais deveriam ter sido citados, e a consequência prática no caso concreto. Não repita o gabarito — transforme-o em orientação prática.",
          },
          howToImprove: {
            type: "string",
            description: "Orientação prática e direta de como o aluno deve estruturar e escrever a resposta na próxima prova para alcançar a nota máxima.",
          },
          modelSentence: {
            type: "string",
            description: "Um trecho-modelo curto, em estilo de prova discursiva de concurso, que o aluno poderia usar para responder no padrão da banca.",
          },
        },
        required: ["thesisAssessment", "pointsLost", "whatShouldHaveBeenWritten", "howToImprove", "modelSentence"],
      },
    };

    const requiredFields = ["baremaBreakdown", "mirror", "positives", "errors", "omissions", "idealAnswer", "feedback", "maxScoreFeedback"];

    if (hasImage) {
      toolProperties.handwritingNote = {
        type: "string",
        description: "Observação humanizada sobre a caligrafia/legibilidade do manuscrito",
      };
      toolProperties.handwritingLevel = {
        type: "string",
        enum: ["plenamente_legivel", "legivel_com_esforco", "prejudica_parcialmente", "compromete_correcao"],
        description: "Nível de legibilidade da caligrafia",
      };
      requiredFields.push("handwritingNote", "handwritingLevel");
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "submit_correction",
          description: "Submit the structured correction result",
          parameters: {
            type: "object",
            properties: toolProperties,
            required: requiredFields,
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
        model: hasImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
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
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
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

    const grade = Math.round(
      correction.baremaBreakdown.reduce((sum: number, item: any) => sum + item.earnedScore, 0) * 10
    ) / 10;

    const result: any = {
      id: `corr-${Date.now()}`,
      questionId: "",
      userId: "",
      answer: answer || "",
      grade,
      maxGrade: 10,
      mirror: correction.mirror,
      positives: correction.positives,
      errors: correction.errors,
      omissions: correction.omissions,
      idealAnswer: correction.idealAnswer,
      feedback: correction.feedback,
      maxScoreFeedback: correction.maxScoreFeedback || null,
      createdAt: new Date().toISOString().split("T")[0],
      baremaBreakdown: correction.baremaBreakdown,
    };

    if (hasImage) {
      result.handwritingNote = correction.handwritingNote || null;
      result.handwritingLevel = correction.handwritingLevel || null;
    }

    if (shouldLogFreeUsage && questionId) {
      await supabaseAdmin.from("free_plan_usage").insert({
        user_id: userId,
        question_id: questionId,
      });
    }

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
