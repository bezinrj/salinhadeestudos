import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function CheckoutSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full border-primary/30">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Assinatura confirmada!</h1>
              <p className="text-muted-foreground">
                Seu pagamento foi processado com sucesso. Aproveite todos os recursos da plataforma.
              </p>
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full gradient-electric text-primary-foreground font-semibold"
            >
              Ir para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
