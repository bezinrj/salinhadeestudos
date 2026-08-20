import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VmSumula } from "@/hooks/useVmSumulas";

const BADGE: Record<string, string> = {
  STJ: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  STF: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  VINCULANTE: "border-gold/40 bg-gold/10 text-gold",
};

const TITULO: Record<string, string> = {
  STJ: "Súmula",
  STF: "Súmula",
  VINCULANTE: "Súmula Vinculante",
};

export function SumulaCard({ sumula }: { sumula: VmSumula }) {
  const tribunalSigla = sumula.tribunal === "STJ" ? "STJ" : "STF";

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Scale className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-display text-sm font-bold text-foreground">
          {TITULO[sumula.tribunal]} {sumula.numero} — {tribunalSigla}
        </h3>
        <span
          className={cn(
            "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            BADGE[sumula.tribunal],
          )}
        >
          {sumula.tribunal === "VINCULANTE" ? "Vinculante" : sumula.tribunal}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{sumula.texto}</p>
    </article>
  );
}
