import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PricingCards } from "@/components/PricingCards";
import { getPlanByPriceId } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, CreditCard, Clock, Loader2 } from "lucide-react";

interface SubStatus {
  subscribed: boolean;
  price_id: string | null;
  product_id: string | null;
  subscription_end: string | null;
}

export default function MyPlan() {
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSub(data as SubStatus);
    } catch {
      setSub({ subscribed: false, price_id: null, product_id: null, subscription_end: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const plan = sub?.price_id ? getPlanByPriceId(sub.price_id) : null;

  const daysRemaining = sub?.subscription_end
    ? Math.max(0, Math.ceil((new Date(sub.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const cycleLabel = plan?.billingCycle === "monthly"
    ? "Mensal"
    : plan?.billingCycle === "quarterly"
    ? "Trimestral"
    : "Anual";

  if (!sub?.subscribed || !plan) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Meu Plano</h1>
          <p className="text-muted-foreground">Você ainda não possui um plano ativo.</p>
        </div>
        <PricingCards isAuthenticated />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Meu Plano</h1>
        <p className="text-muted-foreground">Gerencie sua assinatura</p>
      </div>

      {/* Current plan overview */}
      <Card className="border-primary/30 glow-electric">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Ativo
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Ciclo</p>
                <p className="text-sm font-medium">{cycleLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Vencimento</p>
                <p className="text-sm font-medium">
                  {new Date(sub.subscription_end!).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Restam</p>
                <p className="text-sm font-medium">{daysRemaining} dias</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            R$ {plan.priceMonthly.toFixed(2).replace(".", ",")}/mês • Cobrado R${" "}
            {plan.priceTotal.toFixed(2).replace(".", ",")} por{" "}
            {plan.billingCycle === "monthly"
              ? "mês"
              : plan.billingCycle === "quarterly"
              ? "trimestre"
              : "ano"}
          </p>
        </CardContent>
      </Card>

      {/* Change plan */}
      <div>
        <h2 className="text-xl font-display font-bold mb-1">Trocar de plano</h2>
        <p className="text-sm text-muted-foreground mb-6">Escolha o plano ideal para seus estudos</p>
        <PricingCards currentPriceId={sub.price_id} isAuthenticated />
      </div>
    </div>
  );
}
