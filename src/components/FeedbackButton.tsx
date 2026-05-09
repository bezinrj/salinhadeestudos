import { useEffect, useState } from "react";
import { Star, MessageSquarePlus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function FeedbackButton() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [hasFeedback, setHasFeedback] = useState<boolean | null>(null);

  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [texto, setTexto] = useState("");
  const [estrelas, setEstrelas] = useState(5);
  const [publico, setPublico] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setHasFeedback(true); return; }
    (async () => {
      const { data, error } = await (supabase as any)
        .from("feedbacks")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (!error) setHasFeedback((data?.length ?? 0) > 0);
    })();
  }, [user]);

  useEffect(() => {
    if (open && profile && !nome) setNome(profile.name || profile.username || "");
  }, [open, profile, nome]);

  if (!user || hasFeedback !== false) return null;

  const handleSubmit = async () => {
    if (!nome.trim() || !cargo.trim() || !texto.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("feedbacks").insert({
      user_id: user.id,
      nome: nome.trim(),
      cargo: cargo.trim(),
      texto: texto.trim(),
      estrelas,
      publico,
      avatar_url: profile?.avatar_url || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Obrigado pelo seu feedback!", description: publico ? "Após aprovação poderá aparecer na home." : "Recebido em modo privado." });
    setHasFeedback(true);
    setOpen(false);
  };

  return (
    <>
      <style>{`
        @keyframes rgb-spin {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes feedback-pulse {
          0%, 100% { box-shadow: 0 0 14px 2px hsla(280, 90%, 60%, 0.45), 0 0 28px 6px hsla(200, 90%, 60%, 0.25); }
          50% { box-shadow: 0 0 22px 4px hsla(330, 90%, 60%, 0.55), 0 0 40px 10px hsla(160, 90%, 55%, 0.35); }
        }
        .feedback-rgb-border {
          background: linear-gradient(120deg, #ff0080, #7928ca, #00d4ff, #00ffaa, #ffcc00, #ff0080);
          background-size: 300% 300%;
          animation: rgb-spin 6s ease infinite, feedback-pulse 2.4s ease-in-out infinite;
        }
      `}</style>
      <button
        onClick={() => setOpen(true)}
        aria-label="Deixar feedback"
        className="fixed top-3 right-3 z-[80] rounded-full p-[2px] backdrop-blur-sm feedback-rgb-border"
      >
        <span className="flex items-center gap-2 rounded-full bg-background/85 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background/70 transition-colors">
          <MessageSquarePlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Deixe seu feedback</span>
          <span className="sm:hidden">Feedback</span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conte sua experiência</DialogTitle>
            <DialogDescription>
              Seu feedback nos ajuda a melhorar e pode aparecer na página inicial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fb-nome">Nome</Label>
              <Input id="fb-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-cargo">Cargo / Concurso almejado</Label>
              <Input id="fb-cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Estudante de Delegado PF" maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label>Avaliação</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEstrelas(n)}
                    className="p-1"
                    aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                  >
                    <Star className={cn("h-6 w-6 transition-colors", n <= estrelas ? "fill-gold text-gold" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-texto">Seu depoimento</Label>
              <Textarea id="fb-texto" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={500} rows={4} />
              <p className="text-[10px] text-muted-foreground text-right">{texto.length}/500</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="pr-3">
                <p className="text-sm font-medium">Tornar público</p>
                <p className="text-xs text-muted-foreground">Permitir que apareça na página inicial após aprovação.</p>
              </div>
              <Switch checked={publico} onCheckedChange={setPublico} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Enviando..." : "Enviar feedback"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
