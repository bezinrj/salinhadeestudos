import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { ReferralTrialDialog } from "./ReferralTrialDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, X, FileText, Trophy, Gavel, Library, NotebookPen, Plus } from "lucide-react";

const SNOOZE_KEY = "trial-offer-snoozed-at";
const SNOOZE_MS = 12 * 60 * 60 * 1000;

export const TRIAL_BENEFITS = [
  { icon: FileText, label: "Questões Discursivas", detail: "espelho e barema completos" },
  { icon: Trophy, label: "Ranking Semanal", detail: "dispute com outros alunos" },
  { icon: Gavel, label: "Salinha Juris", detail: "julgados decodificados" },
  { icon: Library, label: "Vade Digital", detail: "notas, grifos e remissões" },
  { icon: NotebookPen, label: "Cadernos e Cronômetro", detail: "organize sua rotina" },
  { icon: Plus, label: "E muito mais...", detail: "tudo liberado por 3 dias" },
];

export function TrialGate() {
  const { user, entitlements, loading } = useAuth();
  const { trial, loading: trialLoading, refetch } = useTrialStatus();
  const [offerOpen, setOfferOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Acesso ativo a qualquer turma também exclui o aviso
  const { data: hasTurmaAccess, isLoading: turmasLoading } = useQuery({
    queryKey: ["trial-gate-turmas", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("turmas_acessos")
        .select("album_id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return (count ?? 0) > 0;
    },
  });

  const hasAnyAccess =
    entitlements.discursivas || entitlements.vade || entitlements.juris || entitlements.cadernos || entitlements.staff;

  useEffect(() => {
    if (loading || trialLoading || turmasLoading || !user) return;
    if (hasAnyAccess || hasTurmaAccess) return;
    if (!trial.canClaim) return;
    const snoozed = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (Date.now() - snoozed < SNOOZE_MS) return;
    const t = setTimeout(() => setOfferOpen(true), 900);
    return () => clearTimeout(t);
  }, [loading, trialLoading, turmasLoading, user, hasAnyAccess, hasTurmaAccess, trial.canClaim]);

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    setOfferOpen(false);
  };

  return (
    <>
      <Dialog open={offerOpen} onOpenChange={(v) => (v ? setOfferOpen(true) : snooze())}>
        <div className="relative z-50">
          {/* Halo dourado pulsante atrás da janela */}
          <div aria-hidden className="pointer-events-none absolute -inset-16 -z-10 overflow-visible">
            <div className="absolute inset-0 rounded-[3rem] bg-gold/30 blur-3xl animate-gold-pulse" />
            <div
              className="absolute inset-8 rounded-[3rem] bg-gold/40 blur-2xl animate-gold-pulse"
              style={{ animationDelay: "1.2s" }}
            />
          </div>

          <DialogContent className="relative z-10 max-w-md overflow-visible border-gold/40 bg-card">
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                <Crown className="h-6 w-6 text-gold" />
              </div>
              <DialogTitle className="font-display text-2xl tracking-tight">
                Acesso <span className="text-gold">Premium</span> liberado por 3 dias
              </DialogTitle>
              <DialogDescription>Indique 2 amigos e comece agora.</DialogDescription>
            </DialogHeader>

            <ul className="space-y-2.5">
              {TRIAL_BENEFITS.map((b) => (
                <li key={b.label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-gold/10">
                    <b.icon className="h-3.5 w-3.5 text-gold" />
                  </span>
                  <span className="text-sm leading-tight">
                    <span className="font-medium text-foreground">{b.label}</span>
                    <span className="block text-xs text-muted-foreground">{b.detail}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                className="w-full gradient-electric text-white"
                onClick={() => { setOfferOpen(false); setFormOpen(true); }}
              >
                <Sparkles className="h-4 w-4 mr-1" /> Indicar amigos e liberar
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={snooze}>
                <X className="h-4 w-4 mr-1" /> Agora não
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                O conteúdo de Minhas Turmas não faz parte da degustação.
              </p>
            </div>
          </DialogContent>
        </div>
      </Dialog>

      <ReferralTrialDialog open={formOpen} onOpenChange={setFormOpen} onClaimed={() => refetch()} />
    </>
  );
}
