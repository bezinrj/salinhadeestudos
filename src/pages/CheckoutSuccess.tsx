import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Status = "verifying" | "success" | "pending" | "error";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<Status>(sessionId ? "verifying" : "success");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const maxAttempts = 10;
    const intervalMs = 2000;

    (async () => {
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled) return;
        try {
          const { data, error } = await supabase.functions.invoke("verify-turma-checkout", {
            body: { session_id: sessionId },
          });
          if (error) throw error;
          if (data?.granted) {
            if (!cancelled) setStatus("success");
            return;
          }
        } catch (e: unknown) {
          const m = e instanceof Error ? e.message : String(e);
          if (!cancelled) setErrorMsg(m);
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      if (!cancelled) setStatus("pending");
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full border-primary/30">
          <CardContent className="p-8 text-center space-y-6">
            {status === "verifying" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold mb-2">Confirmando seu pagamento...</h1>
                  <p className="text-muted-foreground">
                    Estamos liberando seu acesso. Isso leva apenas alguns segundos.
                  </p>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold mb-2">Acesso liberado!</h1>
                  <p className="text-muted-foreground">
                    Seu pagamento foi processado e sua turma já está disponível.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => navigate("/turmas")}
                    className="w-full gradient-electric text-primary-foreground font-semibold"
                  >
                    Ir para Minhas Turmas
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
                    Ir para o Dashboard
                  </Button>
                </div>
              </>
            )}

            {status === "pending" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold mb-2">Pagamento em processamento</h1>
                  <p className="text-muted-foreground">
                    Seu pagamento ainda está sendo confirmado pela Stripe. Atualize a página em alguns
                    minutos. Se persistir, fale com o suporte.
                  </p>
                  {errorMsg && (
                    <p className="text-xs text-muted-foreground mt-2 opacity-70">{errorMsg}</p>
                  )}
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full gradient-electric text-primary-foreground font-semibold"
                >
                  Verificar novamente
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold mb-2">Erro ao confirmar</h1>
                  <p className="text-muted-foreground">{errorMsg || "Tente novamente em instantes."}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
