import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingCards } from "@/components/PricingCards";
import { getPlanByPriceId } from "@/lib/stripe";
import { CalendarDays, CreditCard, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TrialCard } from "@/components/referral/TrialCard";

export default function MyPlan() {
  const { profile, subscribed, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const priceId = profile?.price_id ?? null;
  const plan = priceId ? getPlanByPriceId(priceId) : null;

  const subscriptionEnd = profile?.subscription_end ?? null;

  const daysRemaining = subscriptionEnd
    ? Math.max(
        0,
        Math.ceil((new Date(subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  const cycleLabel =
    plan?.billingCycle === "monthly"
      ? "Mensal"
      : plan?.billingCycle === "quarterly"
      ? "Trimestral"
      : "Anual";

  if (!subscribed || !plan) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Meu Plano</h1>
          <p className="text-muted-foreground">Você ainda não possui um plano ativo.</p>
        </div>
        <TrialCard />
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
                  {subscriptionEnd
                    ? new Date(subscriptionEnd).toLocaleDateString("pt-BR")
                    : "—"}
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

      <div>
        <h2 className="text-xl font-display font-bold mb-1">Trocar de plano</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Escolha o plano ideal para seus estudos
        </p>
        <PricingCards currentPriceId={priceId} isAuthenticated />
      </div>
    </div>
  );
}
