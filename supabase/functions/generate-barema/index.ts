import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Only admins/moderators may generate baremas
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const allowed = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "moderator");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { statement, guidelines } = await req.json();
    if (!guidelines || !statement) {
      return new Response(JSON.stringify({ error: "statement and guidelines are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um especialista em criar baremas de correção para questões discursivas de concursos públicos brasileiros.

Dado o enunciado de uma questão e as diretrizes/gabarito de correção em texto livre, você deve gerar um barema estruturado no formato JSON.

Regras:
- Distribua exatamente 10 pontos no total entre todos os itens
- Cada item deve ter uma letra (a, b, c, d...) e um título descritivo
- Cada item deve ter subitens com: id (letra+número, ex: a1, a2), description, maxScore e keywords
- As keywords devem ser palavras-chave ou expressões que o aluno precisa mencionar na resposta
- Extraia as keywords diretamente das diretrizes fornecidas
- Cada subitem deve ter entre 3 e 8 keywords relevantes
- A soma dos maxScore dos subitens deve ser igual ao maxScore do item pai
- Crie entre 3 e 6 itens principais`;

    const userPrompt = `ENUNCIADO DA QUESTÃO:
${statement}

DIRETRIZES / GABARITO DE CORREÇÃO:
${guidelines}

Gere o barema estruturado.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_barema",
              description: "Generate a structured barema (grading rubric) for a discursive question",
              parameters: {
                type: "object",
                properties: {
                  barema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        letter: { type: "string", description: "Item letter (a, b, c...)" },
                        title: { type: "string", description: "Item title" },
                        maxScore: { type: "number", description: "Maximum score for this item" },
                        subitems: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", description: "Subitem id (e.g. a1, a2)" },
                              description: { type: "string", description: "Subitem description" },
                              maxScore: { type: "number", description: "Maximum score for this subitem" },
                              keywords: {
                                type: "array",
                                items: { type: "string" },
                                description: "Keywords the student should mention"
                              },
                            },
                            required: ["id", "description", "maxScore", "keywords"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["letter", "title", "maxScore", "subitems"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["barema"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_barema" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error: " + response.status);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const barema = parsed.barema;

    return new Response(JSON.stringify({ barema }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-barema error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
