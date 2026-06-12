import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um professor jurídico especialista com conhecimento profundo da doutrina e jurisprudência brasileira. Analise o texto jurídico fornecido e retorne os campos do briefing preenchidos. REGRAS POR CAMPO: DADOS FACTUAIS (título, tribunal, número, relator, data, informativo, matéria/assunto): extraia diretamente do texto. EM UMA FRASE: resumo executivo direto em 1 a 2 frases. CONTEXTO E IMPACTO: explique para quem a decisão importa e por quê, em linguagem acessível. RESULTADO (os dois campos de destaque): adapte o rótulo ao tipo de julgado: - Controle de constitucionalidade (STF): "Constitucional / Válido" e "Inconstitucional / Inválido" - Tributário sobre incidência: "INCIDE" e "NÃO INCIDE" - Competência jurisdicional: "Entendimento adotado" e "Entendimento afastado" - Demais casos: "Tese vencedora" e "Tese afastada" Nunca use "Inconstitucional" fora de controle de constitucionalidade. PARTE CONCEITUAL: explicação didática dos institutos jurídicos centrais, com definições e base legal. Complemente com seu conhecimento. O PROBLEMA: o conflito ou controvérsia jurídica que chegou ao tribunal. A SOLUÇÃO: como o tribunal resolveu, com o raciocínio jurídico passo a passo. ANTES: situação jurídica anterior — um ponto por linha. DEPOIS: situação após a decisão — um ponto por linha. CASOS CONCRETOS: crie sempre 3 exemplos hipotéticos didáticos com nomes fictícios, mostrando ANTES e DEPOIS da decisão. Nunca menos de 3. CONCLUSÕES: gere sempre no mínimo 6 conclusões objetivas numeradas (1. 2. 3...), uma por linha, cobrindo todos os efeitos práticos. Use seu conhecimento se o texto não trouxer. Nunca deixe vazio. PRINCÍPIOS: identifique sempre no mínimo 3 princípios jurídicos do tema, um por linha no formato NOME — descrição de como se aplica ao caso. Use seu conhecimento. Nunca deixe vazio. DOUTRINA: cite sempre de 3 a 5 doutrinadores REAIS e reconhecidos da área, um por linha no formato NOME COMPLETO (Obra, Editora, ano) — posição e se CONVERGE ou DIVERGE do entendimento fixado. Use seu conhecimento. Nunca cite menos de 3. JURISPRUDÊNCIA: cite os precedentes do texto MAIS pelo menos 2 outros julgados relevantes do STF e STJ sobre o tema, um por linha no formato TRIBUNAL · Número · Ano — descrição. Use seu conhecimento. Nunca deixe vazio. ARGUMENTO DE ABERTURA: mínimo 5 linhas, tom formal e eloquente, próprio para sustentação oral. TESE SÍNTESE: frase objetiva e memorável, útil para prova e audiência. ÍNTEGRA — TEXTO: a tese ou destaque do julgado na íntegra. ÍNTEGRA — REFERÊNCIA: referência completa (tribunal, órgão, número, relator, data, informativo). REGRA FINAL: os campos doutrina, princípios, jurisprudência, conclusões e casos concretos devem SEMPRE ser preenchidos com seu conhecimento próprio, mesmo que o texto colado seja curto ou não os mencione. Um texto oficial enxuto nunca justifica campos vazios. Se algum desses campos estiver vazio, refaça antes de finalizar.`;

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

const AI_MODELS = [
  "openai/gpt-5-mini",
  "google/gemini-2.5-flash",
];

function stripJsonFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
}

function extractJsonObject(value: string) {
  const clean = stripJsonFence(value);
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  return start >= 0 && end > start ? clean.slice(start, end + 1) : clean;
}

function normalizeJulgado(value: any) {
  const source = value?.julgado && typeof value.julgado === "object" ? value.julgado : value;
  if (!source || typeof source !== "object" || Array.isArray(source)) return null;

  const s = (key: string) => typeof source[key] === "string" ? source[key] : "";
  const casos = Array.isArray(source.casos_concretos)
    ? source.casos_concretos.slice(0, 3).map((item: any) => ({
      antes: typeof item?.antes === "string" ? item.antes : "",
      depois: typeof item?.depois === "string" ? item.depois : "",
    })).filter((item: any) => item.antes || item.depois)
    : [];

  const parsed = {
    titulo: s("titulo"),
    tribunal: s("tribunal"),
    numero: s("numero"),
    relator: s("relator"),
    data: s("data"),
    info: s("info"),
    area: s("area"),
    assunto: s("assunto"),
    nocoes: {
      frase: typeof source.nocoes?.frase === "string" ? source.nocoes.frase : "",
      contexto: typeof source.nocoes?.contexto === "string" ? source.nocoes.contexto : "",
      ok: typeof source.nocoes?.ok === "string" ? source.nocoes.ok : "",
      ko: typeof source.nocoes?.ko === "string" ? source.nocoes.ko : "",
    },
    conceitual: s("conceitual"),
    problema: s("problema"),
    solucao: s("solucao"),
    antes: s("antes"),
    depois: s("depois"),
    casos_concretos: casos,
    conclusoes: s("conclusoes"),
    principios: s("principios"),
    doutrina: s("doutrina"),
    jurisprudencia: s("jurisprudencia"),
    abertura: s("abertura"),
    tese: s("tese"),
    integra_texto: s("integra_texto"),
    integra_ref: s("integra_ref"),
  };

  return parsed.titulo || parsed.tese || parsed.conceitual ? parsed : null;
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

    const buildAiBody = (model: string) => JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\nResponda SOMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois. Use exatamente estas chaves: ${TOOL_SCHEMA.required.join(", ")}. O campo nocoes deve ser objeto com frase, contexto, ok e ko. O campo casos_concretos deve ser array de objetos com antes e depois.` },
        { role: "user", content: `Analise o julgado abaixo e extraia todos os campos.\n\nTEXTO:\n${text.substring(0, 6000)}` },
      ],
      max_completion_tokens: 8000,
    });

    let aiRes: Response | null = null;
    let lastErrText = "";
    let selectedModel = "";
    let parsedJulgado: ReturnType<typeof normalizeJulgado> = null;
    for (const model of AI_MODELS) {
      const aiController = new AbortController();
      const aiTimeout = setTimeout(() => aiController.abort(), 38_000);
      try {
        aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: aiController.signal,
          headers: {
            "Lovable-API-Key": LOVABLE_API_KEY,
            "Content-Type": "application/json",
          },
          body: buildAiBody(model),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const message = aiData?.choices?.[0]?.message;
          const candidates = [
            message?.tool_calls?.[0]?.function?.arguments,
            typeof message?.content === "string" ? message.content : "",
          ].filter(Boolean) as string[];

          for (const candidate of candidates) {
            try {
              const normalized = normalizeJulgado(JSON.parse(extractJsonObject(candidate)));
              if (normalized) {
                parsedJulgado = normalized;
                selectedModel = model;
                break;
              }
            } catch (_parseError) {
              // tenta o próximo formato/candidato antes de trocar de modelo
            }
          }

          if (parsedJulgado) break;
          lastErrText = "AI response did not contain valid structured JSON";
          console.warn("AI returned invalid structure", model, JSON.stringify(aiData).slice(0, 1200));
          continue;
        }
        lastErrText = await aiRes.text().catch(() => "");
        console.warn(`AI gateway ${aiRes.status} using ${model}`, lastErrText);
        if (![400, 502, 503, 504].includes(aiRes.status)) break;
      } catch (e) {
        if ((e as any)?.name === "AbortError") {
          lastErrText = "timeout";
          console.warn(`AI timeout using ${model}`);
          continue;
        }
        throw e;
      } finally {
        clearTimeout(aiTimeout);
      }
    }

    if (parsedJulgado) {
      console.info("juris-generate AI success", selectedModel);
      return new Response(JSON.stringify({ julgado: parsedJulgado }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!aiRes || !aiRes.ok) {
      const status = aiRes?.status ?? 500;
      const errText = aiRes ? lastErrText || await aiRes.text().catch(() => "") : lastErrText;
      console.error("AI gateway error", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione saldo em Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if ([502, 503, 504].includes(status)) {
        return new Response(JSON.stringify({ error: "O serviço de IA está temporariamente indisponível. Tente novamente em alguns instantes." }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha ao analisar o julgado." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.error("AI structured parsing failed", lastErrText);
    return new Response(JSON.stringify({ error: "A IA não conseguiu estruturar esse julgado. Tente reduzir o texto ou remover trechos repetidos." }), {
      status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("juris-generate error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
