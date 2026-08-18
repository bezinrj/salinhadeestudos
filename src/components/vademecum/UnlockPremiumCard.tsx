import { useState } from "react";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PricingCards } from "@/components/PricingCards";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type Variant = "professor" | "private" | "remissao" | "lei";

const VARIANT_STYLES: Record<Variant, { border: string; bg: string; text: string; label: string }> = {
  professor: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/5 hover:bg-amber-500/10",
    text: "text-amber-300",
    label: "Adicionar nota do professor",
  },
  private: {
    border: "border-pink-500/40",
    bg: "bg-pink-500/5 hover:bg-pink-500/10",
    text: "text-pink-300",
    label: "Adicionar nota privada",
  },
  remissao: {
    border: "border-sky-500/40",
    bg: "bg-sky-500/5 hover:bg-sky-500/10",
    text: "text-sky-300",
    label: "Adicionar remissão",
  },
  lei: {
    border: "border-gold/40",
    bg: "bg-gold/5 hover:bg-gold/10",
    text: "text-gold",
    label: "Ver a lei completa",
  },
};

interface Props {
  variant: Variant;
  /** Texto adicional exibido na variante "lei" */
  description?: string;
}

export function UnlockPremiumCard({ variant }: Props) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const s = VARIANT_STYLES[variant];

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "w-full rounded-lg border border-dashed p-3 flex items-center justify-between gap-3",
          s.border,
          s.bg.split(" ")[0],
        )}
      >
        <div className={cn("flex items-center gap-2 text-xs", s.text)}>
          <Lock className="h-3.5 w-3.5" />
          <span>+ {s.label}</span>
        </div>
        <Button
          size="sm"
          onClick={handleClick}
          className="bg-gold text-background hover:bg-gold/90 h-7 text-xs"
        >
          <Crown className="mr-1 h-3 w-3" />
          Desbloqueie sua Assinatura
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Desbloqueie sua Assinatura</DialogTitle>
            <DialogDescription>
              Escolha o plano ideal para liberar notas, remissões e todos os recursos premium.
            </DialogDescription>
          </DialogHeader>
          <PricingCards isAuthenticated />
        </DialogContent>
      </Dialog>
    </>
  );
}
