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

    const { imageBase64, mimeType, questionId } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side paywall: free users limited to monthly free_plan_usage quota for premium questions
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

    if (!isSubscribed && questionId) {
      const { data: q } = await supabaseAdmin
        .from("weekly_questions")
        .select("is_premium, is_weekly")
        .eq("id", questionId)
        .maybeSingle();
      const isPremiumQuestion = !!q && (!!q.is_premium || !!q.is_weekly);
      const isWeeklyQuestion = !!q?.is_weekly;
      if (isPremiumQuestion && !isWeeklyQuestion) {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { data: usage } = await supabaseAdmin
          .from("free_plan_usage")
          .select("question_id")
          .eq("user_id", userId)
          .gte("used_at", monthStart);
        const used = (usage || []) as Array<{ question_id: string }>;
        const alreadyUsedThis = used.some((u) => u.question_id === questionId);
        if (!alreadyUsedThis && used.length >= 3) {
          return new Response(
            JSON.stringify({ error: "Limite gratuito mensal atingido. Assine para continuar." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um transcritor especializado em textos manuscritos de provas e concursos públicos brasileiros.

## REGRAS ABSOLUTAS DE TRANSCRIÇÃO:

1. Transcreva EXATAMENTE o que está escrito no manuscrito
2. NÃO corrija português, gramática, ortografia ou concordância
3. NÃO melhore frases ou reescreva trechos
4. NÃO complete palavras por conta própria, salvo quando houver altíssima confiança
5. NÃO adapte para linguagem jurídica mais elaborada
6. PRESERVE erros gramaticais, rasuras compreensíveis, repetições e construções originais
7. MANTENHA quebras de linha quando fizerem sentido no contexto
8. Em trechos duvidosos, sinalize discretamente:
   - [trecho ilegível] — quando não for possível ler
   - [palavra incerta: ...] — quando houver dúvida sobre a palavra

## PRIORIDADE: FIDELIDADE ABSOLUTA ao manuscrito

Transcreva como o aluno escreveu. Nunca "traduza" a intenção. Nunca invente palavra não legível. Nunca adapte o texto.

## FORMATO DE SAÍDA:
Retorne APENAS o texto transcrito, sem comentários, sem cabeçalhos, sem explicações.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Transcreva fielmente o texto manuscrito desta imagem. Siga rigorosamente as regras de transcrição.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao transcrever imagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const transcription = aiResult.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ transcription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-answer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
