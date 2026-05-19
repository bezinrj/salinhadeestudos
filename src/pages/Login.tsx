import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import loginBg from "@/assets/login-bg.png";

export default function Login() {
  const [searchParams] = useSearchParams();
  const invitedEmail = useMemo(() => (searchParams.get("invite") || "").trim().toLowerCase(), [searchParams]);
  const tabParam = (searchParams.get("tab") || "").toLowerCase();
  const planParam = (searchParams.get("plan") || "").trim();
  const initialTab: "login" | "register" =
    tabParam === "register" || invitedEmail || planParam ? "register" : tabParam === "login" ? "login" : "login";
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(invitedEmail ? "Você foi convidado(a)! Complete seu cadastro abaixo." : "");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"login" | "register">(initialTab);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (invitedEmail) {
      setEmail(invitedEmail);
      setDefaultTab("register");
    }
  }, [invitedEmail]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!forgotEmail.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg("Enviamos um link de redefinição para o seu e-mail.");
      setShowForgot(false);
      setForgotEmail("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Erro ao fazer login.");
    }
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
    setIsLoading(true);
    const result = await register(username.trim(), email, password);
    if (!result.success) {
      setIsLoading(false);
      setError(result.error || "Erro ao criar conta.");
      return;
    }

    // If a paid plan was chosen on the landing pricing cards, kick off checkout
    if (planParam && planParam !== "free") {
      // Ensure we have a session before invoking the edge function
      const { data: signIn } = await supabase.auth.signInWithPassword({ email, password });
      if (signIn?.session) {
        try {
          const { data, error: ckErr } = await supabase.functions.invoke("create-checkout", {
            body: { priceId: planParam },
          });
          if (ckErr) throw ckErr;
          if (data?.url) {
            window.location.href = data.url;
            return;
          }
        } catch (err) {
          // fall through to dashboard if checkout fails
          console.warn("Checkout after register failed:", err);
        }
      }
    }

    setIsLoading(false);
    navigate(planParam === "free" ? "/dashboard" : "/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${loginBg})`,
          filter: "brightness(0.3) saturate(0.7)",
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/60" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Scale className="h-8 w-8 text-primary" />
          <span className="font-display text-2xl font-bold text-white">Salinha de Estudos</span>
        </div>

        <Card className="border-border/30 bg-card/85 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">Bem-vindo(a)</CardTitle>
            <CardDescription>Entre ou crie sua conta para começar</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-sm text-primary">
                {successMsg}
              </div>
            )}
            {showForgot ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display text-base font-semibold">Recuperar senha</h3>
                  <p className="text-xs text-muted-foreground">
                    Enviaremos um link para redefinir sua senha no e-mail informado.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">E-mail</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="bg-secondary border-border"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setShowForgot(false); setError(""); }}
                    disabled={forgotLoading}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1 gradient-electric text-white font-semibold" disabled={forgotLoading}>
                    {forgotLoading ? "Enviando..." : "Enviar link"}
                  </Button>
                </div>
              </form>
            ) : (
            <Tabs value={defaultTab} onValueChange={(v) => setDefaultTab(v as "login" | "register")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input id="login-email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-border" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="bg-secondary border-border" required />
                  </div>
                  <Button type="submit" className="w-full gradient-electric text-white font-semibold" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setError(""); setSuccessMsg(""); setForgotEmail(email); }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nome de usuário</Label>
                    <Input id="reg-name" placeholder="Seu nome" value={username} onChange={e => setUsername(e.target.value)} className="bg-secondary border-border" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">E-mail</Label>
                    <Input id="reg-email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-border" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Senha</Label>
                    <Input id="reg-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} className="bg-secondary border-border" required />
                  </div>
                  <Button type="submit" className="w-full gradient-electric text-white font-semibold" disabled={isLoading}>
                    {isLoading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
