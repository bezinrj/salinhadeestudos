import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_NAME = "Salinha de Estudos";
const SITE_URL = "https://salinhadeestudos.com.br";
const SENDER_DOMAIN = "notify.salinhadeestudos.com.br";
const FROM_DOMAIN = "salinhadeestudos.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const callerId = claims.claims.sub as string;
    const { data: isAdmin } = await anonClient.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { email, redirectTo } = await req.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return new Response(JSON.stringify({ error: "E-mail inválido" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verifica se o e-mail já existe — não criamos conta, apenas avisamos.
    const { data: existing } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    // listUsers não filtra por email diretamente; fazemos uma busca paginada simples só para o e-mail informado.
    // Para precisão, usamos getUserByEmail via filter:
    const { data: byEmail } = await (adminClient.auth.admin as any).listUsers({
      page: 1,
      perPage: 1,
      // alguns SDKs aceitam filter, outros não — fallback abaixo
    });
    void existing; void byEmail;

    // Busca direta por e-mail (mais confiável)
    const { data: usersList } = await adminClient.auth.admin.listUsers();
    const alreadyExists = usersList?.users?.some(
      (u) => (u.email || "").toLowerCase() === cleanEmail
    );
    if (alreadyExists) {
      return new Response(
        JSON.stringify({
          error: "Este e-mail já está cadastrado na plataforma.",
          code: "email_exists",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Monta o link de cadastro no PRÓPRIO site, com e-mail pré-preenchido.
    const baseUrl = (typeof redirectTo === "string" && redirectTo.startsWith("http"))
      ? redirectTo.replace(/\/$/, "")
      : `${SITE_URL}/login`;
    const confirmationUrl = `${baseUrl}?invite=${encodeURIComponent(cleanEmail)}`;

    // Renderiza o template de convite (HTML + texto)
    const html = await renderAsync(
      React.createElement(InviteEmail, {
        siteName: SITE_NAME,
        siteUrl: SITE_URL,
        confirmationUrl,
      })
    );
    const text =
      `Você foi convidado(a) para a ${SITE_NAME}.\n\n` +
      `Acesse o link abaixo para criar sua conta:\n${confirmationUrl}\n\n` +
      `Se você não esperava este convite, pode ignorar este e-mail com segurança.`;

    // Enfileira no pgmq (mesma infra do auth-email-hook)
    const messageId = crypto.randomUUID();

    await adminClient.from("email_send_log").insert({
      message_id: messageId,
      template_name: "admin_invite",
      recipient_email: cleanEmail,
      status: "pending",
    });

    const { error: enqueueError } = await adminClient.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: cleanEmail,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `Você foi convidado(a) para a ${SITE_NAME}`,
        html,
        text,
        purpose: "transactional",
        label: "admin_invite",
        idempotency_key: `admin-invite-${messageId}`,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      await adminClient.from("email_send_log").insert({
        message_id: messageId,
        template_name: "admin_invite",
        recipient_email: cleanEmail,
        status: "failed",
        error_message: enqueueError.message || "Failed to enqueue invite email",
      });
      return new Response(
        JSON.stringify({ error: "Falha ao enfileirar e-mail de convite." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, queued: true, email: cleanEmail }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
