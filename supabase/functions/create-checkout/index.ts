import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const priceId: string | undefined = body?.priceId;
    const couponCode: string | undefined = body?.couponCode?.toString().trim() || undefined;
    const planKey: string | undefined = body?.planKey;
    if (!priceId) throw new Error("priceId is required");
    logStep("Payload received", { priceId, planKey, hasCoupon: !!couponCode });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // ---- Coupon handling (validated server-side) ----
    let percentOff = 0;
    if (couponCode) {
      const { data: validation, error: valErr } = await supabaseClient.rpc("validate_coupon", {
        _code: couponCode,
        _plan_key: planKey ?? "combo",
      });
      if (valErr) throw new Error(valErr.message);
      const row = Array.isArray(validation) ? validation[0] : validation;
      if (!row?.valid) {
        return new Response(
          JSON.stringify({ error: row?.reason ?? "Cupom inválido." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      percentOff = Number(row.percent_off) || 0;
      logStep("Coupon validated", { percentOff });

      // 100% off: grant access directly, no Stripe checkout needed
      if (percentOff >= 100) {
        const { data: redeem, error: redeemErr } = await supabaseClient.rpc("redeem_full_coupon", {
          _code: couponCode,
          _plan_key: planKey ?? "combo",
        });
        if (redeemErr) throw new Error(redeemErr.message);
        const result = redeem as { success?: boolean; message?: string; expires_at?: string };
        if (!result?.success) {
          return new Response(
            JSON.stringify({ error: result?.message ?? "Não foi possível resgatar o cupom." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        logStep("Full coupon redeemed", { expires_at: result.expires_at });
        return new Response(
          JSON.stringify({ granted: true, expires_at: result.expires_at }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    let discounts: { coupon: string }[] | undefined;
    if (percentOff > 0) {
      const stripeCoupon = await stripe.coupons.create({
        percent_off: percentOff,
        duration: "once",
        name: `Cupom ${couponCode}`,
      });
      discounts = [{ coupon: stripeCoupon.id }];
    }

    const SITE_URL = "https://salinhadeestudos.com.br";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      discounts,
      success_url: `${SITE_URL}/checkout-success`,
      cancel_url: `${SITE_URL}/meu-plano`,
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
