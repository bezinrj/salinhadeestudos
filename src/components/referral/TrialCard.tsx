import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Clock } from "lucide-react";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { ReferralTrialDialog } from "./ReferralTrialDialog";

export function TrialCard() {
  const { trial, refetch } = useTrialStatus();
  const [open, setOpen] = useState(false);

  if (trial.active) {
    return (
      <Card className="border-gold/30 bg-gold/5">
        <CardContent className="p-5 flex items-center gap-3">
          <Clock className="h-5 w-5 text-gold shrink-0" />
          <div>
            <p className="font-display font-semibold text-sm">Degustação premium ativa</p>
            <p className="text-xs text-muted-foreground">
              Restam aproximadamente {trial.hoursLeft}h de acesso completo (exceto Minhas Turmas).
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trial.canClaim) return null;

  return (
    <>
      <Card className="border-gold/30 bg-gold/5">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-semibold text-sm">Acesso Premium liberado por 3 dias</p>
              <p className="text-xs text-muted-foreground">
                Indique 2 amigos e libere Questões Discursivas, Ranking Semanal, Salinha Juris,
                Vade Digital, Cadernos e muito mais. Minhas Turmas não está incluída.
              </p>
            </div>
          </div>
          <Button className="gradient-electric text-white shrink-0" onClick={() => setOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1" /> Indicar amigos
          </Button>
        </CardContent>
      </Card>
      <ReferralTrialDialog open={open} onOpenChange={setOpen} onClaimed={() => refetch()} />
    </>
  );
}
