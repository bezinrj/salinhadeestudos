import heroBg from "@/assets/hero-bg.png";
const heroVideo = "/hero-video.mp4";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, FileText, Trophy, Timer, Target, TrendingUp, Users, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PricingCards } from "@/components/PricingCards";
import { HomeFeedbacksCarousel } from "@/components/HomeFeedbacksCarousel";
import { demoRanking } from "@/data/mockData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const features = [
  { icon: FileText, title: "Discursivas Corrigidas", description: "Envie suas respostas e receba correção detalhada com espelho, erros, acertos e nota simulada." },
  { icon: Trophy, title: "Ranking Gamificado", description: "Compete com outros estudantes. Ganhe badges, suba no ranking e destaque-se semanalmente." },
  { icon: Timer, title: "Cronômetro de Estudos", description: "Registre suas horas, acompanhe seu progresso e mantenha sua sequência de dias estudados." },
];

const benefits = [
  { icon: Scale, title: "Foco Jurídico", description: "Questões para Delegado, Magistratura e Ministério Público" },
  { icon: Target, title: "Feedback Preciso", description: "Correção estruturada com pontos positivos e omissões" },
  { icon: TrendingUp, title: "Evolução Contínua", description: "Acompanhe seu desempenho ao longo do tempo" },
  { icon: Users, title: "Comunidade Ativa", description: "Estude junto com outros concurseiros dedicados" },
];

export default function Home() {
  const navigate = useNavigate();
  const [tourOpen, setTourOpen] = useState(false);
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
              <Button size="lg" onClick={() => navigate("/login")} className="gradient-electric text-white font-semibold text-base px-8">
                Começar agora <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setTourOpen(true)} className="border-border text-foreground hover:bg-secondary">
                Conhecer funcionalidades
              </Button>
              <FeatureTour open={tourOpen} onOpenChange={setTourOpen} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Tudo que você precisa para <span className="text-primary">evoluir</span></h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Ferramentas projetadas para maximizar seu desempenho em concursos de Delegado, Magistratura e Ministério Público.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
              <Card className="gradient-card border-border hover:border-primary/30 transition-all h-full group">
                <CardContent className="p-6">
                  <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

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
      <section className="container mx-auto px-4 py-16 md:py-24">
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
        <Card className="gradient-electric border-0 text-center">
          <CardContent className="p-10 md:p-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Pronto para começar?</h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">Junte-se a centenas de concurseiros e comece a evoluir suas discursivas hoje.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/cadastro")} className="bg-white text-primary hover:bg-white/90 font-semibold px-8">
                Criar minha conta
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="border-white/40 text-white hover:bg-white/10 font-semibold px-8">
                Já tenho conta
              </Button>
            </div>
          </CardContent>
        </Card>
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
