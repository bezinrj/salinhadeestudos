import heroBg from "@/assets/hero-bg.png";
const heroVideo = "/hero-video.mp4";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, Target, TrendingUp, Users, ChevronRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { PricingCards } from "@/components/PricingCards";
import { HomeFeedbacksCarousel } from "@/components/HomeFeedbacksCarousel";
import { FeatureShowcase } from "@/components/home/FeatureShowcase";
import { demoRanking } from "@/data/mockData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const benefits = [
  { icon: Scale, title: "Foco Jurídico", description: "Questões para Delegado, Magistratura e Ministério Público" },
  { icon: Target, title: "Feedback Preciso", description: "Correção estruturada com pontos positivos e omissões" },
  { icon: TrendingUp, title: "Evolução Contínua", description: "Acompanhe seu desempenho ao longo do tempo" },
  { icon: Users, title: "Comunidade Ativa", description: "Estude junto com outros concurseiros dedicados" },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={heroBg}
          className="absolute inset-0 w-full h-full object-cover object-center md:object-center"
          style={{ filter: "saturate(0.6) brightness(0.35)" }}
          src={heroVideo}
        />
        <noscript>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})`, filter: "blur(1.5px) saturate(0.6) brightness(0.35)" }}
          />
        </noscript>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        <div className="container mx-auto px-4 py-16 md:py-28 relative">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <Scale className="h-7 w-7 text-primary" />
              <span className="font-display text-xl font-bold">Salinha de Estudos</span>
            </div>
            <Button variant="outline" onClick={() => navigate("/login")} className="border-primary/30 text-primary hover:bg-primary/10">
              Entrar
            </Button>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
              Domine as{" "}
              <span className="text-primary">discursivas</span>
              {" "}e alcance a{" "}
              <span className="text-gold">aprovação</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              Plataforma gamificada para concurseiros da área jurídica. Correção inteligente, rankings competitivos e controle total dos seus estudos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate("/cadastro")} className="gradient-electric text-white font-semibold text-base px-8">
                Criar conta <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="border-border text-foreground hover:bg-secondary">
                Fazer Login
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pt-16 md:pt-24 pb-4 md:pb-8">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Tudo que você precisa para <span className="text-primary">evoluir</span></h2>
        </motion.div>
      </section>

      {/* Showcase com telas reais do produto */}
      <FeatureShowcase />


      {/* Benefits */}
      <section className="border-y border-border bg-card/30">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="rounded-full bg-secondary p-4 w-fit mx-auto mb-3">
                  <b.icon className="h-6 w-6 text-gold" />
                </div>
                <h4 className="font-display font-semibold mb-1">{b.title}</h4>
                <p className="text-sm text-muted-foreground">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rankings Preview - demo only */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold mb-3">Ranking em <span className="text-gold">destaque</span></h2>
          <p className="text-muted-foreground">Os melhores estudantes desta semana</p>
        </div>
        <div className="max-w-md mx-auto space-y-3">
          {demoRanking.map((u) => (
            <div key={u.userId} className="flex items-center gap-3 rounded-lg bg-card border border-border px-4 py-3">
              <span className={`text-sm font-bold ${u.position <= 3 ? "text-gold" : "text-muted-foreground"}`}>
                #{u.position}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-xs font-semibold">{u.avatar}</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium">{u.name}</span>
              <span className="text-sm font-bold text-primary">{u.score} pts</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feedbacks dos alunos */}
      <HomeFeedbacksCarousel />

      {/* Pricing */}
      <section id="planos" className="container mx-auto px-4 py-16 md:py-24 scroll-mt-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            Escolha seu <span className="text-primary">plano</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Invista na sua aprovação. Comece hoje e evolua suas discursivas com correção inteligente.
          </p>
        </div>
        <PricingCards onSelectUnauthenticated={(plan) => navigate(`/cadastro?plan=${encodeURIComponent(plan)}`)} />
        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline font-semibold">
            Entrar
          </button>
        </p>
      </section>
      {/* CTA */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-gold/25 bg-card/60 backdrop-blur-sm px-6 py-14 md:px-16 md:py-20 text-center shadow-[0_30px_90px_-40px_hsl(var(--gold)/0.4)]"
        >
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(hsl(var(--gold))_1px,transparent_1px)] [background-size:22px_22px]" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              Comece hoje
            </span>

            <h2 className="mt-5 text-3xl md:text-5xl font-display font-bold leading-tight">
              Pronto para <span className="text-gold">começar</span>?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Junte-se a centenas de concurseiros e comece a evoluir suas discursivas hoje.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/cadastro")}
                className="gradient-electric text-white font-semibold px-8 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)] transition-transform hover:scale-[1.03]"
              >
                Criar minha conta <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-gold/40 text-gold hover:bg-gold/10 font-semibold px-8"
              >
                Já tenho conta
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Acesso imediato</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Correção detalhada</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gold" /> Comunidade ativa</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">Salinha de Estudos</span>
          </div>
          <p>© 2026 Salinha de Estudos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
