import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-TURMA-CHECKOUT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    // Authenticate user
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);
    if (userErr) throw new Error(`Auth error: ${userErr.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    const body = await req.json().catch(() => ({}));
    const sessionId: string | undefined = body?.session_id;
    if (!sessionId) throw new Error("session_id is required");
    log("Verifying", { sessionId, userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      log("Not paid yet", { payment_status: session.payment_status });
      return new Response(
        JSON.stringify({ granted: false, reason: "pending", payment_status: session.payment_status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security: ensure metadata user matches caller (or fall back to assinatura record)
    const metaUserId = session.metadata?.user_id as string | undefined;
    const metaPlanoId = session.metadata?.plano_id as string | undefined;
    if (metaUserId && metaUserId !== user.id) {
      throw new Error("Session does not belong to the authenticated user");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Locate assinatura by session id (preferred), fallback to metadata
    const { data: existing } = await supabase
      .from("turmas_assinaturas")
      .select("id, user_id, plano_id, status")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    const userId = existing?.user_id ?? metaUserId ?? user.id;
    const planoId = existing?.plano_id ?? metaPlanoId;
    if (!planoId) throw new Error("Could not resolve plano_id");
    if (userId !== user.id) {
      throw new Error("Session does not belong to the authenticated user");
    }

    // Load plano
    const { data: plano, error: planoErr } = await supabase
      .from("turmas_planos")
      .select("id, album_ids, meses_banco_geral")
      .eq("id", planoId)
      .maybeSingle();
    if (planoErr || !plano) throw new Error(`Plano not found: ${planoErr?.message ?? "missing"}`);

    const albumIds = (plano.album_ids ?? []) as string[];
    const alreadyActive = existing?.status === "active";

    // Compute new banco_geral expiration (skip extension if already active to keep idempotent)
    const { data: profile } = await supabase
      .from("profiles")
      .select("banco_geral_expires_at")
      .eq("id", userId)
      .maybeSingle();

    let newExpIso: string | null = profile?.banco_geral_expires_at ?? null;
    if (!alreadyActive) {
      const now = new Date();
      const currentExp = profile?.banco_geral_expires_at ? new Date(profile.banco_geral_expires_at) : null;
      const base = currentExp && currentExp > now ? currentExp : now;
      const newExp = new Date(base);
      newExp.setMonth(newExp.getMonth() + (plano.meses_banco_geral || 0));
      newExpIso = newExp.toISOString();
    }

    // Upsert / update assinatura -> active
    let assinaturaId = existing?.id as string | undefined;
    if (assinaturaId) {
      await supabase
        .from("turmas_assinaturas")
        .update({
          status: "active",
          stripe_payment_intent_id: (session.payment_intent as string) || null,
          banco_geral_expires_at: newExpIso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assinaturaId);
    } else {
      const { data: ins, error: insErr } = await supabase
        .from("turmas_assinaturas")
        .insert({
          user_id: userId,
          plano_id: planoId,
          stripe_checkout_session_id: sessionId,
          stripe_payment_intent_id: (session.payment_intent as string) || null,
          status: "active",
          banco_geral_expires_at: newExpIso,
        })
        .select("id")
        .single();
      if (insErr) throw new Error(`Insert assinatura failed: ${insErr.message}`);
      assinaturaId = ins.id;
    }

    // Grant album access (idempotent upsert)
    if (albumIds.length > 0) {
      const rows = albumIds.map((album_id) => ({
        user_id: userId,
        album_id,
        assinatura_id: assinaturaId!,
        is_manual: false,
      }));
      const { error: accErr } = await supabase
        .from("turmas_acessos")
        .upsert(rows, { onConflict: "user_id,album_id", ignoreDuplicates: false });
      if (accErr) throw new Error(`Insert acessos failed: ${accErr.message}`);
    }

    // Update profile banco_geral_expires_at (only if extended)
    if (!alreadyActive && newExpIso) {
      await supabase
        .from("profiles")
        .update({ banco_geral_expires_at: newExpIso })
        .eq("id", userId);
    }

    log("Access granted", { userId, planoId, albumIds, alreadyActive });
    return new Response(
      JSON.stringify({ granted: true, album_ids: albumIds, already_active: alreadyActive }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
