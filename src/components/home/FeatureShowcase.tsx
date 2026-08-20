import { motion } from "framer-motion";
import { BookOpen, Scale, Trophy, FileText, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import showcaseVade from "@/assets/showcase-vade.jpg";
import showcaseJuris from "@/assets/showcase-juris.jpg";
import showcaseRanking from "@/assets/showcase-ranking.jpg";
import showcaseDiscursivas from "@/assets/showcase-discursivas.jpg";

const blocks = [
  {
    id: "discursivas",
    icon: FileText,
    seal: "Discursivas",
    title: "Discursivas corrigidas para todos os cargos",
    description:
      "Envie sua resposta e receba uma correção detalhada com espelho, erros, acertos e nota simulada.",
    bullets: [
      "Questões para Delegado, Magistratura, Ministério Público, Defensoria, OAB e mais",
      "Correção com espelho, omissões e nota simulada",
      "Banco crescente de questões inéditas",
      "Questões gratuitas e premium para todos os perfis",
    ],
    image: showcaseDiscursivas,
    alt: "Lista de questões discursivas para cargos jurídicos mistos na Salinha de Estudos",
    accent: "primary" as const,
  },
  {
    id: "vade",
    icon: BookOpen,
    seal: "Vade Digital",
    title: "Um Vade Mecum vivo, do jeito que você estuda",
    description:
      "Leis e súmulas completas com grifos coloridos, notas do professor e suas próprias anotações direto no artigo.",
    bullets: [
      "Grifos por cor e notas privadas em cada artigo",
      "Notas do professor com mnemônicos e macetes",
      "Remissões entre artigos e cadernos de estudo",
      "Mais de 1.400 súmulas do STJ, STF e Vinculantes",
    ],
    image: showcaseVade,
    alt: "Artigo 1º da Constituição no Vade Mecum digital com grifo e nota do professor",
    accent: "gold" as const,
  },
  {
    id: "juris",
    icon: Scale,
    seal: "Salinha Juris",
    title: "Julgados decodificados + assistente de IA",
    description:
      "Informativos do STF e do STJ traduzidos em estrutura didática — e uma IA que responde suas dúvidas usando apenas o julgado aberto.",
    bullets: [
      "Tese em uma frase, contexto, impacto e íntegra",
      "Blocos de conceitual, problema, antes × depois e oratória",
      "Assistente de IA fiel ao conteúdo do julgado",
      "Filtros por tribunal, matéria, assunto e informativo",
    ],
    image: showcaseJuris,
    alt: "Assistente de IA da Salinha Juris explicando um julgado do STF em linguagem simples",
    accent: "primary" as const,
  },
  {
    id: "ranking",
    icon: Trophy,
    seal: "Questões da Semana",
    title: "Discursiva semanal, correção e pódio",
    description:
      "Toda semana uma questão inédita. Você responde, recebe correção detalhada e disputa posição no ranking com os outros alunos.",
    bullets: [
      "Correção com espelho, omissões e nota simulada",
      "Pódio semanal e ranking geral gamificado",
      "Pontos por desempenho e horas de estudo",
      "Badges e conquistas para manter a constância",
    ],
    image: showcaseRanking,
    alt: "Pódio e ranking geral das questões da semana com pontuação dos alunos",
    accent: "gold" as const,
  },
];

export function FeatureShowcase() {

  return (
    <section className="container mx-auto px-4 pb-4 md:pb-8">
      <div className="space-y-20 md:space-y-28">
        {blocks.map((b, i) => {
          const reversed = i % 2 === 1;
          const Icon = b.icon;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className={cn(
                "grid lg:grid-cols-2 gap-8 lg:gap-14 items-center",
                reversed && "lg:[&>*:first-child]:order-2"
              )}
            >
              {/* Text */}
              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                    b.accent === "gold"
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-primary/40 bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {b.seal}
                </span>
                <h3 className="mt-4 text-2xl md:text-3xl font-display font-bold leading-tight">
                  {b.title}
                </h3>
                <p className="mt-3 text-muted-foreground">{b.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {b.bullets.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={cn(
                          "h-4 w-4 mt-0.5 shrink-0",
                          b.accent === "gold" ? "text-gold" : "text-primary"
                        )}
                      />
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Image window */}
              <div
                className={cn(
                  "relative rounded-2xl border p-2 bg-card/60 backdrop-blur-sm",
                  b.accent === "gold"
                    ? "border-gold/25 shadow-[0_20px_60px_-25px_hsl(var(--gold)/0.45)]"
                    : "border-primary/25 shadow-[0_20px_60px_-25px_hsl(var(--primary)/0.5)]"
                )}
              >
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    salinhadeestudos.com.br
                  </span>
                </div>
                <img
                  src={b.image}
                  alt={b.alt}
                  loading="lazy"
                  className="w-full rounded-xl border border-border/60"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Numbers strip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { v: "30+", l: "Leis completas" },
          { v: "1.400+", l: "Súmulas organizadas" },
          { v: "Semanal", l: "Novos julgados e questões" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-xl border border-border bg-card/50 px-4 py-5 text-center"
          >
            <div className="font-display text-2xl font-bold text-gold">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </motion.div>

      <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        Tudo isso em um só lugar — escolha seu plano abaixo.
      </div>
    </section>
  );
}
