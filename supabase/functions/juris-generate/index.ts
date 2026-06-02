import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um professor jurídico especialista com conhecimento profundo da doutrina e jurisprudência brasileira. Analise o texto jurídico abaixo e preencha os campos seguindo OBRIGATORIAMENTE estas regras: DADOS FACTUAIS — tribunal, número, relator, data, informativo, área: extraia do texto. NOÇÕES, CONCEITUAL, PROBLEMA, SOLUÇÃO, ANTES, DEPOIS: use o texto como base e complemente com seu conhecimento para tornar o conteúdo didático e completo. CASOS CONCRETOS: crie SEMPRE exatamente 3 exemplos hipotéticos com nomes fictícios mostrando ANTES e DEPOIS da decisão. Nunca deixe vazio. Nunca crie menos de 3. CONCLUSÕES: gere SEMPRE no mínimo 6 conclusões objetivas cobrindo todos os pontos do julgado, incluindo todos os efeitos práticos da decisão. PRINCÍPIOS JURÍDICOS: identifique SEMPRE no mínimo 3 princípios constitucionais e processuais envolvidos no tema usando seu próprio conhecimento. Nunca deixe com menos de 3. DOUTRINA: gere SEMPRE entre 3 e 5 doutrinadores reais e reconhecidos que tratam do tema, usando seu próprio conhecimento jurídico — independente do que está no texto colado. Para cada autor inclua: nome completo, obra principal com editora e ano aproximado, posição sobre o tema, e se CONVERGE ou DIVERGE do entendimento fixado. Nunca deixe esse campo com menos de 3 autores. Nunca deixe vazio. JURISPRUDÊNCIA: além dos precedentes mencionados no texto, acrescente SEMPRE outros 2 a 3 julgados relevantes do STF e STJ sobre o mesmo tema que você conhece. RESULTADO DO JULGAMENTO — rótulos: Se for decisão do STF em controle de constitucionalidade: use Constitucional e Inconstitucional. Se for decisão do STJ em matéria infraconstitucional ou recurso repetitivo: use INCIDE e NÃO INCIDE conforme o caso. Nunca use o rótulo Inconstitucional para decisão do STJ. ARGUMENTO DE ABERTURA: escreva sempre com no mínimo 5 linhas, tom formal e eloquente, próprio para sustentação oral em tribunal. TESE SÍNTESE: escreva sempre uma frase objetiva e memorável útil para prova e audiência. REGRA GERAL ABSOLUTA: os campos de doutrina, princípios, jurisprudência e casos concretos devem ser sempre preenchidos com seu conhecimento próprio, mesmo que o texto colado seja curto ou não mencione esses elementos. Um texto oficial e enxuto do STJ ou STF nunca é justificativa para deixar qualquer campo vazio ou com menos itens do que o mínimo exigido acima.`;

const TOOL_SCHEMA = {
  type: "object",
  properties: {
    titulo: { type: "string", description: "Título curto e descritivo do julgado" },
    tribunal: { type: "string", description: "Sigla do tribunal (STF, STJ, TJRJ...)" },
    numero: { type: "string", description: "Número do processo ou referência" },
    relator: { type: "string" },
    data: { type: "string", description: "Data do julgamento (DD/MM/AAAA quando possível)" },
    info: { type: "string", description: "Informativo (ex: Info 1214)" },
    area: { type: "string", description: "Matéria do Direito (ex: Direito Penal, Direito Administrativo)" },
    assunto: { type: "string", description: "Assunto específico dentro da matéria, curto (2-5 palavras). Ex: 'Improbidade administrativa', 'Prescrição penal'." },
    nocoes: {
      type: "object",
      properties: {
        frase: { type: "string", description: "Resumo executivo em 1-2 frases diretas" },
        contexto: { type: "string", description: "Para quem importa e por quê, em linguagem acessível" },
        ok: { type: "string", description: "O que foi considerado constitucional/válido (vazio se não se aplicar)" },
        ko: { type: "string", description: "O que foi considerado inconstitucional/inválido (vazio se não se aplicar)" },
      },
      required: ["frase", "contexto", "ok", "ko"],
      additionalProperties: false,
    },
    conceitual: { type: "string", description: "Explicação didática dos institutos jurídicos centrais" },
    problema: { type: "string", description: "Qual era o conflito ou controvérsia" },
    solucao: { type: "string", description: "Como o tribunal resolveu" },
    antes: { type: "string", description: "Situação anterior — um ponto por linha" },
    depois: { type: "string", description: "Situação após a decisão — um ponto por linha" },
    casos_concretos: {
      type: "array",
      description: "2 a 3 exemplos práticos hipotéticos mas realistas que mostram a aplicação da tese. Cada item tem 'antes' (cenário sob a regra antiga) e 'depois' (mesmo cenário sob a nova tese). Se não houver elementos suficientes para gerar exemplos fiéis, retorne array vazio.",
      items: {
        type: "object",
        properties: {
          antes: { type: "string", description: "Cenário concreto sob a regra anterior, 1-3 frases." },
          depois: { type: "string", description: "Mesmo cenário após a decisão, 1-3 frases." },
        },
        required: ["antes", "depois"],
        additionalProperties: false,
      },
    },
    conclusoes: { type: "string", description: "Conclusões numeradas, uma por linha (ex: 1. ...)" },
    principios: { type: "string", description: "NOME — descrição, um por linha" },
    doutrina: { type: "string", description: "AUTOR — posição, um por linha" },
    jurisprudencia: { type: "string", description: "TRIBUNAL · REF — descrição, um por linha" },
    abertura: { type: "string", description: "Argumento de abertura para sustentação oral, tom formal" },
    tese: { type: "string", description: "Tese síntese para memorizar" },
    integra_texto: { type: "string", description: "Tese ou ementa na íntegra" },
    integra_ref: { type: "string", description: "Referência completa: Tribunal. Órgão. Processo. Relator. Data. Informativo." },
  },
  required: [
    "titulo", "tribunal", "numero", "relator", "data", "info", "area", "assunto",
    "nocoes", "conceitual", "problema", "solucao", "antes", "depois", "casos_concretos",
    "conclusoes", "principios", "doutrina", "jurisprudencia",
    "abertura", "tese", "integra_texto", "integra_ref",
  ],
  additionalProperties: false,
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
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      console.error("juris-generate auth error", claimsErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Check role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const allowed = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "moderator");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await req.json();
    if (typeof text !== "string" || text.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Texto muito curto. Cole ao menos 50 caracteres." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analise o julgado abaixo e extraia todos os campos.\n\nTEXTO:\n${text.substring(0, 18000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "salvar_julgado_estruturado",
            description: "Retorna o julgado decomposto nos campos estruturados.",
            parameters: TOOL_SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "salvar_julgado_estruturado" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione saldo em Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha ao analisar o julgado." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      return new Response(JSON.stringify({ error: "IA não retornou estrutura válida." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(argsStr);

    return new Response(JSON.stringify({ julgado: parsed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("juris-generate error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
