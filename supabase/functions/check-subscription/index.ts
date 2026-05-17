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
  console.log(`[CHECK-SUBSCRIPTION] ${step}${d}`);
};

const planByPriceId: Record<string, { tier: string; months: number }> = {
  price_1TBMTPLy0axdgWvJblk2ZJjZ: { tier: "monthly", months: 1 },
  price_1TBMTpLy0axdgWvJjbmiZ92u: { tier: "quarterly", months: 3 },
  price_1TBMUHLy0axdgWvJInHob9Il: { tier: "annual", months: 12 },
};

const addMonths = (base: Date, months: number) => {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header, returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Auth error, returning unsubscribed", { message: userError.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const caller = userData.user;
    if (!caller?.email) throw new Error("User not authenticated or email not available");
    logStep("Caller authenticated", { userId: caller.id, email: caller.email });

    // Check if admin is querying another user
    let targetUserId = caller.id;
    let targetEmail = caller.email;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // no body — self-check
    }

    if (body.user_id && body.user_id !== caller.id) {
      // Verify caller is admin
      const { data: isAdmin } = await supabaseClient.rpc("has_role", {
        _user_id: caller.id,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
      targetUserId = body.user_id;
      const { data: targetUser, error: targetErr } = await supabaseClient.auth.admin.getUserById(body.user_id);
      if (targetErr || !targetUser?.user?.email) {
        throw new Error("Target user not found or has no email");
      }
      targetEmail = targetUser.user.email;
      logStep("Admin lookup for user", { targetUserId: body.user_id, targetEmail });
    }

    // 1) Check manual_subscriptions FIRST (fast DB lookup, avoids Stripe timeout)
    const { data: manualSubs } = await supabaseClient
      .from("manual_subscriptions")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1);

    if (manualSubs && manualSubs.length > 0) {
      const ms = manualSubs[0];
      logStep("Active manual subscription found", { plan_type: ms.plan_type, expires_at: ms.expires_at });
      await supabaseClient
        .from("profiles")
        .update({ subscription_tier: ms.plan_type || "premium", subscription_end: ms.expires_at, price_id: null })
        .eq("id", targetUserId);
      return new Response(
        JSON.stringify({
          subscribed: true,
          manual: true,
          plan_type: ms.plan_type,
          subscription_end: ms.expires_at,
          subscription_tier: ms.plan_type || "premium",
          price_id: null,
          product_id: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 2) Check Stripe (with timeout protection)
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
      timeout: 10000, // 10s timeout per Stripe call
      maxNetworkRetries: 1,
    });

    let hasStripeSub = false;
    let priceId: string | null = null;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let currentPeriodStart: number | null = null;
    let currentPeriodEnd: number | null = null;

    try {
      const customers = await stripe.customers.list({ email: targetEmail, limit: 1 });

      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        logStep("Found Stripe customer", { customerId });
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });
        if (subscriptions.data.length > 0) {
          hasStripeSub = true;
          const subscription = subscriptions.data[0];
          const item = subscription.items.data[0];
          priceId = item.price.id;
          productId = item.price.product as string;
          currentPeriodStart = (subscription as any).current_period_start ?? (item as any).current_period_start ?? subscription.created;
          currentPeriodEnd = (subscription as any).current_period_end ?? (item as any).current_period_end ?? null;
          logStep("Active Stripe subscription found", { priceId, productId, currentPeriodStart, currentPeriodEnd });
        }
      }
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
      logStep("Stripe lookup failed, treating as no Stripe sub", { message: msg });
    }

    if (hasStripeSub) {
      const plan = priceId ? planByPriceId[priceId] : null;
      const tier = plan?.tier ?? "monthly";
      const periodStartDate = new Date((currentPeriodStart ?? Math.floor(Date.now() / 1000)) * 1000);
      const stripeEndDate = currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null;
      const packageEndDate = plan ? addMonths(periodStartDate, plan.months) : stripeEndDate;
      const effectiveEndDate = [stripeEndDate, packageEndDate]
        .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()))
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? addMonths(new Date(), 1);
      subscriptionEnd = effectiveEndDate.toISOString();

      await supabaseClient
        .from("profiles")
        .update({ subscription_tier: tier, subscription_end: subscriptionEnd, price_id: priceId })
        .eq("id", targetUserId);

      return new Response(
        JSON.stringify({
          subscribed: true,
          price_id: priceId,
          product_id: productId,
          subscription_end: subscriptionEnd,
          subscription_tier: tier,
          manual: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { data: localProfile } = await supabaseClient
      .from("profiles")
      .select("subscription_tier, subscription_end, price_id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (localProfile?.subscription_tier && localProfile?.subscription_end) {
      const localEnd = new Date(localProfile.subscription_end);
      if (localEnd >= new Date()) {
        logStep("Active local entitlement found", {
          tier: localProfile.subscription_tier,
          subscriptionEnd: localProfile.subscription_end,
        });
        return new Response(
          JSON.stringify({
            subscribed: true,
            price_id: localProfile.price_id,
            product_id: null,
            subscription_end: localProfile.subscription_end,
            subscription_tier: localProfile.subscription_tier,
            manual: false,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }


    // Clear subscription_tier if no active sub
    await supabaseClient
      .from("profiles")
      .update({ subscription_tier: null, subscription_end: null, price_id: null })
      .eq("id", targetUserId);
    logStep("No active subscription found");
    return new Response(
      JSON.stringify({ subscribed: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
