import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-TURMA-WEBHOOK] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_TURMA_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    if (!webhookSecret) {
      log("ERROR STRIPE_TURMA_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      log("Signature verified", { type: event.type });
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      log("Signature verification FAILED", { message: m });
      return new Response(JSON.stringify({ error: `Webhook signature failed: ${m}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event.type !== "checkout.session.completed") {
      log("Event ignored", { type: event.type });
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    log("Processing checkout.session.completed", { sessionId: session.id });

    if (session.payment_status !== "paid") {
      log("Payment not paid, skipping", { payment_status: session.payment_status });
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Resolve user_id and plano_id from metadata or pending assinatura
    let userId = session.metadata?.user_id as string | undefined;
    let planoId = session.metadata?.plano_id as string | undefined;

    const { data: existingAssinatura } = await supabase
      .from("turmas_assinaturas")
      .select("id, user_id, plano_id")
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

    if (existingAssinatura) {
      userId = userId || existingAssinatura.user_id;
      planoId = planoId || existingAssinatura.plano_id;
    }

    if (!userId || !planoId) {
      throw new Error("Could not resolve user_id or plano_id");
    }
    log("Resolved", { userId, planoId, assinaturaExists: !!existingAssinatura });

    // Load plano
    const { data: plano, error: planoErr } = await supabase
      .from("turmas_planos")
      .select("id, album_ids, meses_banco_geral")
      .eq("id", planoId)
      .maybeSingle();
    if (planoErr || !plano) throw new Error(`Plano not found: ${planoErr?.message ?? "missing"}`);

    // Compute banco_geral_expires_at = max(now, current expires) + meses_banco_geral
    const { data: profile } = await supabase
      .from("profiles")
      .select("banco_geral_expires_at")
      .eq("id", userId)
      .maybeSingle();

    const now = new Date();
    const currentExp = profile?.banco_geral_expires_at ? new Date(profile.banco_geral_expires_at) : null;
    const base = currentExp && currentExp > now ? currentExp : now;
    const newExp = new Date(base);
    newExp.setMonth(newExp.getMonth() + (plano.meses_banco_geral || 0));
    log("Computed banco_geral expiration", { from: base.toISOString(), to: newExp.toISOString() });

    // 1) Upsert/update assinatura -> active
    let assinaturaId = existingAssinatura?.id as string | undefined;
    if (assinaturaId) {
      const { error: updErr } = await supabase
        .from("turmas_assinaturas")
        .update({
          status: "active",
          stripe_payment_intent_id: (session.payment_intent as string) || null,
          banco_geral_expires_at: newExp.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", assinaturaId);
      if (updErr) throw new Error(`Update assinatura failed: ${updErr.message}`);
      log("Assinatura updated to active");
    } else {
      const { data: ins, error: insErr } = await supabase
        .from("turmas_assinaturas")
        .insert({
          user_id: userId,
          plano_id: planoId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: (session.payment_intent as string) || null,
          status: "active",
          banco_geral_expires_at: newExp.toISOString(),
        })
        .select("id")
        .single();
      if (insErr) throw new Error(`Insert assinatura failed: ${insErr.message}`);
      assinaturaId = ins.id;
      log("Assinatura created as active", { assinaturaId });
    }

    // 2) Grant access to each album
    const albumIds = (plano.album_ids ?? []) as string[];
    if (albumIds.length > 0) {
      const rows = albumIds.map((album_id) => ({
        user_id: userId!,
        album_id,
        assinatura_id: assinaturaId!,
        is_manual: false,
      }));
      const { error: accErr } = await supabase
        .from("turmas_acessos")
        .upsert(rows, { onConflict: "user_id,album_id", ignoreDuplicates: false });
      if (accErr) throw new Error(`Insert acessos failed: ${accErr.message}`);
      log("Acessos granted", { count: rows.length });
    }

    // 3) Update profile banco_geral_expires_at
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ banco_geral_expires_at: newExp.toISOString() })
      .eq("id", userId);
    if (profErr) throw new Error(`Update profile failed: ${profErr.message}`);
    log("Profile banco_geral_expires_at updated");

    return new Response(JSON.stringify({ received: true, ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
