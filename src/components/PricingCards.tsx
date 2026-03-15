import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Star, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STRIPE_PLANS_LIST } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PricingCardsProps {
  currentPriceId?: string | null;
  onSelectUnauthenticated?: () => void;
  isAuthenticated?: boolean;
}

export function PricingCards({
  currentPriceId,
  onSelectUnauthenticated,
  isAuthenticated = false,
}: PricingCardsProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelect = async (priceId: string) => {
    if (!isAuthenticated) {
      onSelectUnauthenticated?.();
      return;
    }

    setLoadingPlan(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar checkout";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {STRIPE_PLANS_LIST.map((plan, i) => {
        const isCurrent = currentPriceId === plan.priceId;
        const isPopular = "popular" in plan && plan.popular;
        const isLoading = loadingPlan === plan.priceId;

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
          >
            <Card
              className={cn(
                "relative h-full transition-all border",
                isPopular
                  ? "border-primary glow-electric"
                  : "border-border hover:border-primary/30",
                isCurrent && "ring-2 ring-gold"
              )}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-electric text-primary-foreground border-0 gap-1">
                    <Star className="h-3 w-3" /> Mais popular
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-gold text-accent-foreground border-0 gap-1">
                    <Crown className="h-3 w-3" /> Plano atual
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                {plan.discount > 0 && (
                  <span className="text-xs font-semibold text-gold">{plan.discount}% de desconto</span>
                )}
              </CardHeader>

              <CardContent className="text-center space-y-4">
                <div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-4xl font-display font-bold">
                      {plan.priceMonthly.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  {plan.billingCycle !== "monthly" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cobrado R$ {plan.priceTotal.toFixed(2).replace(".", ",")} /{" "}
                      {plan.billingCycle === "quarterly" ? "trimestre" : "ano"}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 text-left text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelect(plan.priceId)}
                  disabled={isCurrent || isLoading}
                  className={cn(
                    "w-full font-semibold",
                    isPopular && !isCurrent ? "gradient-electric text-primary-foreground" : "",
                    isCurrent && "opacity-60"
                  )}
                  variant={isPopular ? "default" : "outline"}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    "Plano atual"
                  ) : isAuthenticated ? (
                    "Assinar"
                  ) : (
                    "Começar agora"
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
