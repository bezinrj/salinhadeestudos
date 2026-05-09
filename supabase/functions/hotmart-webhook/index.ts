import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[HOTMART-WEBHOOK] ${step}${d}`);
};

function pickProductCodes(payload: any): string[] {
  const candidates = [
    payload?.data?.product?.id?.toString(),
    payload?.data?.product?.code,
    payload?.data?.product?.ucode,
    payload?.product?.id?.toString(),
    payload?.product?.ucode,
    payload?.product_code,
  ].filter((v): v is string => typeof v === "string" && v.length > 0);
  return Array.from(new Set(candidates));
}

function pickEmail(payload: any): string | null {
  return (
    payload?.data?.buyer?.email ||
    payload?.buyer?.email ||
    payload?.data?.subscriber?.email ||
    payload?.email ||
    null
  );
}

function pickTransaction(payload: any): string | null {
  return (
    payload?.data?.purchase?.transaction ||
    payload?.data?.transaction ||
    payload?.purchase?.transaction ||
    payload?.transaction ||
    null
  );
}

function pickStatus(payload: any): string | null {
  return (
    payload?.data?.purchase?.status ||
    payload?.purchase?.status ||
    payload?.status ||
    null
  );
}

function pickEvent(payload: any): string | null {
  return payload?.event || payload?.data?.event || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const expectedSecret = Deno.env.get("HOTMART_WEBHOOK_SECRET");
    if (!expectedSecret) throw new Error("HOTMART_WEBHOOK_SECRET not configured");

    // Auth: accept token from query string, header (x-hotmart-hottok), or body.hottok
    const url = new URL(req.url);
    const queryToken = url.searchParams.get("token") || url.searchParams.get("hottok");
    const headerToken = req.headers.get("x-hotmart-hottok") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;

    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      log("Invalid JSON body");
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const bodyToken = payload?.hottok || null;
    const providedToken = queryToken || headerToken || bodyToken;

    if (providedToken !== expectedSecret) {
      log("Unauthorized webhook attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = pickEvent(payload);
    const status = (pickStatus(payload) || "").toUpperCase();
    const approvedStatuses = ["APPROVED", "COMPLETE", "COMPLETED", "PAID"];
    const approvedEvents = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "SUBSCRIPTION_REACTIVATED"];

    const isApproved = approvedEvents.includes((event || "").toUpperCase()) || approvedStatuses.includes(status);
    if (!isApproved) {
      log("Event ignored", { event, status });
      return new Response(JSON.stringify({ received: true, ignored: true, event, status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = (pickEmail(payload) || "").trim().toLowerCase();
    const productCodes = pickProductCodes(payload);
    const transaction = pickTransaction(payload);

    if (!email || productCodes.length === 0) {
      log("Missing email/product", { email, productCodes });
      return new Response(JSON.stringify({ error: "Missing email or product code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Lookup product mapping (try all candidate codes)
    const { data: produtos, error: prodErr } = await supabase
      .from("hotmart_produtos")
      .select("produto_codigo, album_ids, meses_assinatura, is_active")
      .in("produto_codigo", productCodes);

    if (prodErr) throw new Error(`Lookup product failed: ${prodErr.message}`);
    const produto = produtos?.find((p) => p.is_active) || null;
    const productCode = produto?.produto_codigo || productCodes[0];
    if (!produto) {
      log("Product not mapped or inactive", { productCodes });
      return new Response(JSON.stringify({ error: "Product not mapped", productCodes }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const albumIds = (produto.album_ids ?? []) as string[];
    const meses = produto.meses_assinatura ?? 1;

    // Find user by email via admin API
    const { data: usersList, error: usersErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (usersErr) throw new Error(`List users failed: ${usersErr.message}`);
    const user = usersList?.users?.find((u) => (u.email || "").toLowerCase() === email);

    if (!user) {
      // Save as pending
      const { error: pendErr } = await supabase
        .from("hotmart_pendentes")
        .upsert(
          {
            email,
            produto_codigo: productCode,
            hotmart_transaction: transaction,
            album_ids: albumIds,
            meses_assinatura: meses,
            status: "pending",
          },
          { onConflict: "hotmart_transaction", ignoreDuplicates: false }
        );
      if (pendErr) throw new Error(`Insert pendente failed: ${pendErr.message}`);
      log("Saved as pending (no account yet)", { email, productCode });
      return new Response(JSON.stringify({ received: true, pending: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Grant access for each album
    if (albumIds.length > 0) {
      const rows = albumIds.map((album_id) => ({
        user_id: userId,
        album_id,
        is_manual: false,
      }));
      const { error: accErr } = await supabase
        .from("turmas_acessos")
        .upsert(rows, { onConflict: "user_id,album_id", ignoreDuplicates: false });
      if (accErr) throw new Error(`Grant acessos failed: ${accErr.message}`);
    }

    // Extend banco_geral_expires_at by N months
    const { data: profile } = await supabase
      .from("profiles")
      .select("banco_geral_expires_at")
      .eq("id", userId)
      .maybeSingle();
    const now = new Date();
    const currentExp = profile?.banco_geral_expires_at ? new Date(profile.banco_geral_expires_at) : null;
    const base = currentExp && currentExp > now ? currentExp : now;
    const newExp = new Date(base);
    newExp.setMonth(newExp.getMonth() + meses);

    const { error: profErr } = await supabase
      .from("profiles")
      .update({ banco_geral_expires_at: newExp.toISOString() })
      .eq("id", userId);
    if (profErr) throw new Error(`Update profile failed: ${profErr.message}`);

    // Mark pending record (if any) as processed
    if (transaction) {
      await supabase
        .from("hotmart_pendentes")
        .upsert(
          {
            email,
            produto_codigo: productCode,
            hotmart_transaction: transaction,
            album_ids: albumIds,
            meses_assinatura: meses,
            status: "processed",
            processado_at: new Date().toISOString(),
          },
          { onConflict: "hotmart_transaction", ignoreDuplicates: false }
        );
    }

    log("Access granted", { userId, email, albumIds, meses });
    return new Response(
      JSON.stringify({ received: true, granted: true, userId, albumIds, meses }),
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
