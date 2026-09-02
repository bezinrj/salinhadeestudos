import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Loader2, Plus, Sparkles, Trash2, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";

interface Friend {
  name: string;
  email: string;
  whatsapp: string;
}

interface SentInvite {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
}

const emptyFriend = (): Friend => ({ name: "", email: "", whatsapp: "" });

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export function ReferralTrialDialog({
  open,
  onOpenChange,
  onClaimed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onClaimed?: () => void;
}) {
  const { profile, checkSubscription } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([emptyFriend(), emptyFriend()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<SentInvite[] | null>(null);

  const update = (i: number, patch: Partial<Friend>) =>
    setFriends((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const waLink = (invite: SentInvite) => {
    const msg = `Oi ${invite.name}! Estou usando a Salinha de Estudos para treinar discursivas com correção por IA, Vade Mecum digital e ranking de estudos. Te indiquei para criar sua conta gratuita: https://salinhadeestudos.com.br/cadastro`;
    return `https://wa.me/55${(invite.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  };

  const handleSubmit = async () => {
    setError("");
    const payload = friends
      .map((f) => ({ name: f.name.trim(), email: f.email.trim().toLowerCase(), whatsapp: f.whatsapp.replace(/\D/g, "") }))
      .filter((f) => f.name && f.email && f.whatsapp);

    if (payload.length < 2) {
      setError("Preencha nome, e-mail e WhatsApp de pelo menos 2 amigos.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: rpcError } = await (supabase as any).rpc("claim_referral_trial", {
        _indicacoes: payload,
      });
      if (rpcError) throw rpcError;
      if (!data?.success) {
        setError(data?.message || "Não foi possível ativar sua degustação.");
        return;
      }

      const invites: SentInvite[] = data.invites || [];
      setSent(invites);

      // Dispara os convites por e-mail (sem bloquear a liberação do acesso)
      await Promise.allSettled(
        invites.map((inv) =>
          supabase.functions.invoke("send-friend-invite-email", {
            body: { referralId: inv.id },
          })
        )
      );


      await checkSubscription();
      onClaimed?.();
      toast.success("Degustação de 3 dias ativada!");
    } catch (e: any) {
      setError(e?.message || "Erro ao enviar indicações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display">
                <Sparkles className="h-5 w-5 text-gold" /> Degustação ativada!
              </DialogTitle>
              <DialogDescription>
                Você tem 3 dias de acesso premium. Envie agora o convite pelo WhatsApp para os seus amigos —
                o e-mail já foi disparado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {sent.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 border-border">
                    <a href={waLink(inv)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                    </a>
                  </Button>
                </div>
              ))}
            </div>
            <Button className="w-full gradient-electric text-white" onClick={() => onOpenChange(false)}>
              <Check className="h-4 w-4 mr-1" /> Concluir
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display">
                <Gift className="h-5 w-5 text-gold" /> 3 dias de degustação premium
              </DialogTitle>
              <DialogDescription>
                Indique pelo menos 2 amigos e libere na hora o acesso completo por 3 dias: Discursivas,
                Vade Digital, Salinha Juris e Cadernos. (Minhas Turmas não está incluída.)
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {friends.map((f, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Amigo {i + 1}
                    </Label>
                    {friends.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setFriends((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    value={f.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    placeholder="Nome"
                    className="bg-background border-border"
                  />
                  <Input
                    type="email"
                    value={f.email}
                    onChange={(e) => update(i, { email: e.target.value })}
                    placeholder="E-mail"
                    className="bg-background border-border"
                  />
                  <Input
                    value={f.whatsapp}
                    onChange={(e) => update(i, { whatsapp: formatPhone(e.target.value) })}
                    placeholder="WhatsApp com DDD"
                    className="bg-background border-border"
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border"
              onClick={() => setFriends((prev) => [...prev, emptyFriend()])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar outro amigo
            </Button>

            <Button onClick={handleSubmit} disabled={loading} className="w-full gradient-electric text-white">
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Enviar indicações e liberar 3 dias
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
