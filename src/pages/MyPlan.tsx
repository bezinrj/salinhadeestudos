import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PricingCards } from "@/components/PricingCards";
import { updateUserSubscription } from "@/data/mockData";
import { CalendarDays, CreditCard, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MyPlan() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const sub = user?.subscription;

  const daysRemaining = sub
    ? Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalDays = sub
    ? Math.max(1, Math.ceil((new Date(sub.endDate).getTime() - new Date(sub.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const progressPercent = Math.round(((totalDays - daysRemaining) / totalDays) * 100);

  const cycleLabel = sub?.billingCycle === "monthly" ? "Mensal" : sub?.billingCycle === "quarterly" ? "Trimestral" : "Anual";

  const handleChangePlan = (planId: string) => {
    if (!user) return;
    const updated = updateUserSubscription(user.id, planId);
    if (updated) {
      // Force re-render by triggering profile update
      updateProfile({ name: updated.name });
      toast({
        title: "Plano alterado!",
        description: `Seu plano foi alterado para ${updated.subscription?.planName}.`,
      });
    }
  };

  if (!sub) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Meu Plano</h1>
          <p className="text-muted-foreground">Você ainda não possui um plano ativo.</p>
        </div>
        <PricingCards onSelect={handleChangePlan} ctaLabel="Assinar" />
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
            <CardTitle className="text-lg font-display">{sub.planName}</CardTitle>
            <Badge className={sub.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
              {sub.status === "active" ? "Ativo" : "Expirado"}
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
                  {new Date(sub.endDate).toLocaleDateString("pt-BR")}
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

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Vigência</span>
              <span>{progressPercent}% transcorrido</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <p className="text-xs text-muted-foreground">
            R$ {sub.priceMonthly.toFixed(2).replace(".", ",")}/mês • Cobrado R$ {sub.priceTotal.toFixed(2).replace(".", ",")} por {sub.billingCycle === "monthly" ? "mês" : sub.billingCycle === "quarterly" ? "trimestre" : "ano"}
          </p>
        </CardContent>
      </Card>

      {/* Change plan */}
      <div>
        <h2 className="text-xl font-display font-bold mb-1">Trocar de plano</h2>
        <p className="text-sm text-muted-foreground mb-6">Escolha o plano ideal para seus estudos</p>
        <PricingCards
          currentPlanId={sub.planId}
          onSelect={handleChangePlan}
          ctaLabel="Mudar para este"
        />
      </div>
    </div>
  );
}
