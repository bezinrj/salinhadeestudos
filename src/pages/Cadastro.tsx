import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Scale, Check, Crown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS_LIST, CONTENT_PLANS, getAnyPlanName } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import loginBg from "@/assets/login-bg.png";

const FREE_REF = "free";

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const invitedEmail = useMemo(
    () => (searchParams.get("invite") || "").trim().toLowerCase(),
    [searchParams]
  );
  const initialPlan = (searchParams.get("plan") || FREE_REF).trim();

  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlan);
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const isPaid = selectedPlan && selectedPlan !== FREE_REF;
  const selectedPlanName = isPaid ? getAnyPlanName(selectedPlan) : null;

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!username.trim()) {
      setError("Nome de usuário é obrigatório.");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError("Informe um WhatsApp válido com DDD (10 ou 11 dígitos).");
      return;
    }
    setIsLoading(true);
    const result = await register(username.trim(), email, password, phoneDigits);
    if (!result.success) {
      setIsLoading(false);
      setError(result.error || "Erro ao criar conta.");
      return;
    }

    if (isPaid) {
      const { data: signIn } = await supabase.auth.signInWithPassword({ email, password });
      if (signIn?.session) {
        try {
          const { data, error: ckErr } = await supabase.functions.invoke("create-checkout", {
            body: { priceId: selectedPlan },
          });
          if (ckErr) throw ckErr;
          if (data?.url) {
            window.location.href = data.url;
            return;
          }
        } catch (err) {
          console.warn("Checkout after register failed:", err);
        }
      }
    }

    setIsLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})`, filter: "brightness(0.3) saturate(0.7)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/60" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Scale className="h-8 w-8 text-primary" />
          <span className="font-display text-2xl font-bold text-white">Salinha de Estudos</span>
        </div>

        <div className="grid lg:grid-cols-[1.1fr,1fr] gap-6">
          {/* Plan picker */}
          <Card className="border-border/30 bg-card/85 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="font-display text-lg">1. Escolha seu plano</CardTitle>
              <CardDescription>
                Você pode começar grátis e fazer upgrade quando quiser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Free option */}
              <button
                type="button"
                onClick={() => setSelectedPlan(FREE_REF)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all",
                  selectedPlan === FREE_REF
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                    : "border-border hover:border-primary/40 bg-secondary/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold">Grátis</span>
                      <span className="text-xs text-muted-foreground">Degustação</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      3 questões premium / mês, cronômetro e ranking básicos.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold">R$ 0</div>
                    <span className="text-[10px] text-muted-foreground">/mês</span>
                  </div>
                </div>
              </button>

              {STRIPE_PLANS_LIST.map((plan) => {
                const active = selectedPlan === plan.priceId;
                const isPopular = "popular" in plan && (plan as { popular?: boolean }).popular;
                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.priceId)}
                    className={cn(
                      "w-full text-left rounded-xl border p-4 transition-all relative",
                      active
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                        : "border-border hover:border-primary/40 bg-secondary/40"
                    )}
                  >
                    {isPopular && (
                      <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-0.5 font-semibold">
                        <Star className="h-3 w-3" /> Popular
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold">{plan.name}</span>
                          {plan.discount > 0 && (
                            <span className="text-[10px] font-semibold text-gold">
                              -{plan.discount}%
                            </span>
                          )}
                        </div>
                        <ul className="mt-2 space-y-1">
                          {plan.features.slice(0, 2).map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-1.5 text-xs text-muted-foreground"
                            >
                              <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-bold">
                          R$ {plan.priceMonthly.toFixed(2).replace(".", ",")}
                        </div>
                        <span className="text-[10px] text-muted-foreground">/mês</span>
                        {plan.billingCycle !== "monthly" && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            R$ {plan.priceTotal.toFixed(2).replace(".", ",")} no total
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Registration form */}
          <Card className="border-border/30 bg-card/85 backdrop-blur-xl shadow-2xl h-fit">
            <CardHeader>
              <CardTitle className="font-display text-lg">2. Crie sua conta</CardTitle>
              <CardDescription>
                {isPaid
                  ? "Concluiremos o cadastro e te levaremos ao pagamento."
                  : "Comece grátis em poucos segundos."}
              </CardDescription>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary w-fit">
                <Crown className="h-3 w-3" />
                Plano selecionado:&nbsp;
                <strong>{isPaid ? selectedPlanName ?? "Premium" : "Grátis"}</strong>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nome de usuário</Label>
                  <Input
                    id="reg-name"
                    placeholder="Seu nome"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-secondary border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">E-mail</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">WhatsApp</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="(11) 91234-5678"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="bg-secondary border-border"
                    maxLength={16}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Senha</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary border-border"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-electric text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading
                    ? isPaid
                      ? "Redirecionando ao pagamento..."
                      : "Criando conta..."
                    : isPaid
                    ? "Criar conta e ir para o pagamento"
                    : "Criar conta grátis"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Já tem conta?{" "}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Entrar
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
