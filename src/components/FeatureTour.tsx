import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Trophy, Timer, Target, ChevronLeft, ChevronRight, CheckCircle2, BarChart3, Award } from "lucide-react";

const tourSteps = [
  {
    icon: FileText,
    title: "Discursivas Corrigidas",
    subtitle: "Correção inteligente e detalhada",
    description: "Envie suas respostas discursivas e receba uma correção completa com espelho de correção, pontos positivos, omissões e nota simulada.",
    highlights: ["Espelho de correção detalhado", "Identificação de erros e acertos", "Nota simulada por banca", "Feedback construtivo"],
    color: "primary",
    preview: (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Direito Penal — Legítima Defesa</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">8.5/10</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-[85%] rounded-full bg-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-emerald-500/10 text-emerald-400 p-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> 3 acertos
          </div>
          <div className="rounded bg-destructive/10 text-destructive p-2 flex items-center gap-1.5">
            <Target className="h-3 w-3" /> 1 omissão
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Trophy,
    title: "Ranking Gamificado",
    subtitle: "Compete e evolua com outros estudantes",
    description: "Participe do ranking semanal, ganhe badges por conquistas e acompanhe sua posição entre os melhores concurseiros.",
    highlights: ["Ranking semanal atualizado", "Badges e conquistas", "Pontuação por atividade", "Top 3 em destaque"],
    color: "accent",
    preview: (
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        {[
          { pos: 1, name: "Ana Silva", pts: 2450, medal: "🥇" },
          { pos: 2, name: "Carlos Lima", pts: 2280, medal: "🥈" },
          { pos: 3, name: "Beatriz M.", pts: 2100, medal: "🥉" },
        ].map((u) => (
          <div key={u.pos} className="flex items-center gap-3 rounded-md bg-secondary/50 px-3 py-2">
            <span className="text-lg">{u.medal}</span>
            <span className="flex-1 text-sm font-medium text-foreground">{u.name}</span>
            <span className="text-xs font-bold text-primary">{u.pts} pts</span>
          </div>
        ))}
        <div className="flex gap-1.5 justify-center pt-1">
          {["🏆", "🔥", "⭐"].map((b) => (
            <span key={b} className="text-lg bg-secondary rounded-full w-8 h-8 flex items-center justify-center">{b}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Timer,
    title: "Cronômetro de Estudos",
    subtitle: "Controle total do seu tempo",
    description: "Registre suas sessões de estudo, acompanhe horas diárias, semanais e mensais, e mantenha sua sequência de dias estudando.",
    highlights: ["Timer com sessões salvas", "Horas de hoje, semana e mês", "Sequência de dias (streak)", "Gráfico semanal de horas"],
    color: "primary",
    preview: (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="text-center">
          <span className="text-3xl font-mono font-bold text-primary">01:24:35</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Hoje", value: "2.5h" },
            { label: "Semana", value: "14h" },
            { label: "Sequência", value: "7 dias" },
          ].map((s) => (
            <div key={s.label} className="rounded-md bg-secondary p-2">
              <div className="text-sm font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-10 justify-center">
          {[40, 65, 80, 50, 90, 70, 30].map((h, i) => (
            <div key={i} className="w-5 rounded-t bg-primary/60" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    subtitle: "Visualize seu progresso",
    description: "Acompanhe suas estatísticas em um dashboard completo com gráficos de evolução, desafios semanais e metas personalizadas.",
    highlights: ["Estatísticas em tempo real", "Questões da semana", "Acompanhamento de metas", "Visão geral do desempenho"],
    color: "accent",
    preview: (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Questões", value: "47", icon: "📝" },
            { label: "Nota Média", value: "8.2", icon: "📊" },
            { label: "Horas", value: "86h", icon: "⏱️" },
            { label: "Badges", value: "12", icon: "🏅" },
          ].map((s) => (
            <div key={s.label} className="rounded-md bg-secondary p-2 flex items-center gap-2">
              <span className="text-lg">{s.icon}</span>
              <div>
                <div className="text-sm font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-accent" />
          <span className="text-xs text-muted-foreground">Próximo badge: Maratonista</span>
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full w-[70%] rounded-full bg-accent" />
          </div>
        </div>
      </div>
    ),
  },
];

interface FeatureTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureTour({ open, onOpenChange }: FeatureTourProps) {
  const [step, setStep] = useState(0);
  const current = tourSteps[step];

  const next = () => setStep((s) => Math.min(s + 1, tourSteps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const isLast = step === tourSteps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setStep(0); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border bg-card gap-0">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-5">
          {tourSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="p-6 pt-4"
          >
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-2">
              <div className={`rounded-lg p-2.5 ${current.color === "accent" ? "bg-accent/15" : "bg-primary/15"}`}>
                <current.icon className={`h-5 w-5 ${current.color === "accent" ? "text-accent" : "text-primary"}`} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">{current.title}</h3>
                <p className="text-xs text-muted-foreground">{current.subtitle}</p>
              </div>
            </div>

            {/* Preview */}
            <div className="my-4">{current.preview}</div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3">{current.description}</p>

            {/* Highlights */}
            <div className="grid grid-cols-2 gap-1.5">
              {current.highlights.map((h) => (
                <div key={h} className="flex items-center gap-1.5 text-xs text-foreground">
                  <CheckCircle2 className={`h-3 w-3 shrink-0 ${current.color === "accent" ? "text-accent" : "text-primary"}`} />
                  {h}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 pt-0">
          <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0} className="text-muted-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          {isLast ? (
            <Button size="sm" onClick={() => { onOpenChange(false); setStep(0); }} className="bg-primary text-primary-foreground">
              Entendi! Vamos começar
            </Button>
          ) : (
            <Button size="sm" onClick={next} className="bg-primary text-primary-foreground">
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
