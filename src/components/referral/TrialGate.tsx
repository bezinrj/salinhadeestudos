import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { ReferralTrialDialog } from "./ReferralTrialDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, X } from "lucide-react";

const SNOOZE_KEY = "trial-offer-snoozed-at";
const SNOOZE_MS = 12 * 60 * 60 * 1000;

export function TrialGate() {
  const { user, entitlements, loading } = useAuth();
  const { trial, loading: trialLoading, refetch } = useTrialStatus();
  const [offerOpen, setOfferOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const hasAnyAccess =
    entitlements.discursivas || entitlements.vade || entitlements.juris || entitlements.cadernos || entitlements.staff;

  useEffect(() => {
    if (loading || trialLoading || !user) return;
    if (hasAnyAccess || trial.claimed) return;
    const snoozed = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (Date.now() - snoozed < SNOOZE_MS) return;
    const t = setTimeout(() => setOfferOpen(true), 900);
    return () => clearTimeout(t);
  }, [loading, trialLoading, user, hasAnyAccess, trial.claimed]);

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    setOfferOpen(false);
  };

  return (
    <>
      <Dialog open={offerOpen} onOpenChange={(v) => (v ? setOfferOpen(true) : snooze())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Gift className="h-5 w-5 text-gold" /> Libere 3 dias de acesso premium
            </DialogTitle>
            <DialogDescription>
              Indique 2 amigos (nome, e-mail e WhatsApp) e desbloqueie na hora, por 3 dias, tudo o que a Salinha
              oferece: Discursivas com correção por IA, Vade Digital, Salinha Juris e Cadernos.
              O conteúdo de "Minhas Turmas" não faz parte da degustação.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full gradient-electric text-white"
              onClick={() => { setOfferOpen(false); setFormOpen(true); }}
            >
              <Sparkles className="h-4 w-4 mr-1" /> Indicar amigos e liberar
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={snooze}>
              <X className="h-4 w-4 mr-1" /> Agora não
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReferralTrialDialog open={formOpen} onOpenChange={setFormOpen} onClaimed={() => refetch()} />
    </>
  );
}
