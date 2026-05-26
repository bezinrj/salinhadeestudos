import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PremiumLockProps {
  title?: string;
  description?: string;
}

export function JurisPremiumLock({
  title = "Conteúdo Premium",
  description = "Assine o plano Premium para acessar a análise completa do julgado e o assistente IA.",
}: PremiumLockProps) {
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card p-10 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(45_95%_55%/0.15),transparent_70%)]" />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/20">
          <Lock className="h-7 w-7 text-gold" />
        </div>
        <h3 className="mb-2 font-display text-2xl font-bold text-foreground">{title}</h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">{description}</p>
        <Button
          onClick={() => navigate("/meu-plano")}
          className="bg-gold text-background hover:bg-gold/90"
        >
          <Crown className="mr-2 h-4 w-4" />
          Desbloquear com Premium
        </Button>
      </div>
    </div>
  );
}
