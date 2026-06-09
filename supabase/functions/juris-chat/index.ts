import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_LIMIT = 20;

function buildContext(j: any) {
  return `JULGADO: ${j.titulo} | ${j.tribunal} ${j.numero} | ${j.relator} | ${j.data} | ${j.info}
ÁREA: ${j.area}
NOÇÕES: ${j.nocoes?.frase ?? ""} | ${j.nocoes?.contexto ?? ""}
RESULTADO — Constitucional: ${j.nocoes?.ok ?? ""} | Inconstitucional: ${j.nocoes?.ko ?? ""}
CONCEITUAL: ${j.conceitual}
PROBLEMA: ${j.problema} | SOLUÇÃO: ${j.solucao}
ANTES: ${j.antes} | DEPOIS: ${j.depois}
CONCLUSÕES: ${j.conclusoes}
PRINCÍPIOS: ${j.principios}
DOUTRINA: ${j.doutrina}
JURISPRUDÊNCIA: ${j.jurisprudencia}
ABERTURA: ${j.abertura} | TESE: ${j.tese}
ÍNTEGRA: ${j.integra_texto} | REF: ${j.integra_ref}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Admin-only check
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "MAINTENANCE", message: "O assistente IA está em manutenção. Volte em breve!" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { julgadoId, messages } = await req.json();
    if (!julgadoId || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "julgadoId e messages são obrigatórios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch julgado
    const { data: julgado, error: jErr } = await supabaseAdmin
      .from("juris_julgados")
      .select("*")
      .eq("id", julgadoId)
      .maybeSingle();
    if (jErr || !julgado) {
      return new Response(JSON.stringify({ error: "Julgado não encontrado." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Premium check (same logic as has_active_subscription)
    const { data: subOk } = await supabaseAdmin.rpc("has_active_subscription", { _user_id: userId });
    if (!subOk) {
      return new Response(JSON.stringify({ error: "PREMIUM_REQUIRED", message: "O assistente IA é exclusivo para assinantes Premium." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit check
    const today = new Date().toISOString().slice(0, 10);
    const { data: usage } = await supabaseAdmin
      .from("juris_chat_usage")
      .select("count")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();
    const currentCount = usage?.count ?? 0;
    if (currentCount >= DAILY_LIMIT) {
      return new Response(JSON.stringify({
        error: "DAILY_LIMIT",
        message: `Você atingiu o limite diário de ${DAILY_LIMIT} mensagens do assistente.`,
        limit: DAILY_LIMIT,
      }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um assistente jurídico didático. Responda APENAS com base no julgado abaixo. Seja claro, acessível e direto. Se a pergunta fugir do escopo, redirecione gentilmente ao conteúdo do julgado.

${buildContext(julgado)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-12).map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content ?? "").slice(0, 4000),
          })),
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "RATE_LIMIT", message: "Muitas requisições. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI_CREDITS", message: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI gateway error", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI_ERROR", message: "Falha ao gerar resposta." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";

    // Increment usage
    await supabaseAdmin
      .from("juris_chat_usage")
      .upsert(
        { user_id: userId, date: today, count: currentCount + 1 },
        { onConflict: "user_id,date" },
      );

    return new Response(JSON.stringify({
      reply,
      usage: { count: currentCount + 1, limit: DAILY_LIMIT },
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("juris-chat error", e);
    return new Response(JSON.stringify({ error: "INTERNAL", message: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
