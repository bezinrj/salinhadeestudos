import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Loader2, Sparkles, Ticket, Scale, BookOpen, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CONTENT_PLANS, type ContentPlan } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ICONS: Record<string, typeof Scale> = {
  vade: BookOpen,
  juris: Scale,
  combo: Layers,
  pro: Crown,
};

interface Props {
  currentPriceId?: string | null;
  isAuthenticated?: boolean;
  onSelectUnauthenticated?: (planRef: string) => void;
}

export function ContentPlanCards({
  currentPriceId,
  isAuthenticated = false,
  onSelectUnauthenticated,
}: Props) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const { toast } = useToast();
  const { checkSubscription } = useAuth();

  const handleSelect = async (plan: ContentPlan) => {
    if (!isAuthenticated) {
      onSelectUnauthenticated?.(plan.priceId);
      return;
    }
    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: plan.priceId,
          planKey: plan.planKey,
          couponCode: plan.acceptsCoupon && coupon.trim() ? coupon.trim() : undefined,
        },
      });
      if (error) {
        const ctx = (error as any)?.context;
        let msg = error.message;
        try {
          const body = await ctx?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      if ((data as any)?.granted) {
        toast({
          title: "Cupom aplicado!",
          description: "Acesso liberado por 1 mês. Aproveite seus estudos.",
        });
        setCoupon("");
        await checkSubscription();
        return;
      }
      if ((data as any)?.url) {
        window.location.href = (data as any).url;
      } else {
        throw new Error("Não foi possível iniciar o checkout.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar checkout";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
      {CONTENT_PLANS.map((plan, i) => {
        const Icon = ICONS[plan.id] ?? Sparkles;
        const isCurrent = currentPriceId === plan.priceId;
        const isLoading = loadingPlan === plan.id;

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Card
              className={cn(
                "relative h-full transition-all border",
                plan.highlight ? "border-gold/50" : "border-border hover:border-primary/30",
                isCurrent && "ring-2 ring-gold"
              )}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-gold text-accent-foreground border-0 gap-1">
                    <Crown className="h-3 w-3" /> Plano atual
                  </Badge>
                </div>
              )}
              {plan.acceptsCoupon && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-gold text-accent-foreground border-0 gap-1">
                    <Ticket className="h-3 w-3" /> Aceita cupom
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2 pt-6">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/25">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                <span className="text-xs text-muted-foreground">{plan.tagline}</span>
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
                  <p className="text-xs text-muted-foreground mt-1">Renovação mensal • cancele quando quiser</p>
                </div>

                <ul className="space-y-2 text-left text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.acceptsCoupon && isAuthenticated && (
                  <Input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Cupom de desconto (opcional)"
                    className="text-center text-sm"
                  />
                )}

                <Button
                  onClick={() => handleSelect(plan)}
                  disabled={isCurrent || isLoading}
                  className={cn(
                    "w-full font-semibold",
                    plan.highlight && !isCurrent && "gradient-gold text-accent-foreground",
                    isCurrent && "opacity-60"
                  )}
                  variant={plan.highlight ? "default" : "outline"}
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
