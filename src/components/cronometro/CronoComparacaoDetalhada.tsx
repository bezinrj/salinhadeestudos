import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { Periodo } from "@/hooks/useCrono";
import { useComparacaoMaterias, useComparacaoAssuntos } from "@/hooks/useCronoCanon";

interface Props {
  periodo: Periodo;
}

function Linha({
  nome,
  minhas,
  media,
  alunos,
  percentil,
  cor,
}: {
  nome: string;
  minhas: number;
  media: number;
  alunos: number;
  percentil: number | null;
  cor: string;
}) {
  const max = Math.max(minhas, media, 0.1);
  const acima = minhas >= media;
  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cor }} />
          <span className="truncate text-sm font-medium" title={nome}>{nome}</span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
          <Users className="h-3 w-3" /> {alunos}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">Você</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/5">
            <div className="h-full rounded-full" style={{ width: `${(minhas / max) * 100}%`, background: cor }} />
          </div>
          <span className="w-12 shrink-0 text-right text-xs tabular-nums">{minhas.toFixed(1)}h</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">Média</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/5">
            <div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${(media / max) * 100}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{media.toFixed(1)}h</span>
        </div>
      </div>

      <div className={`flex items-center gap-1.5 text-[11px] ${acima ? "text-emerald-400" : "text-amber-400"}`}>
        {acima ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {minhas === 0
          ? "você ainda não estudou este item no período"
          : acima
            ? `${(minhas - media).toFixed(1)}h acima da média`
            : `${(media - minhas).toFixed(1)}h abaixo da média`}
        {percentil != null && minhas > 0 && (
          <span className="text-muted-foreground">· top {Math.max(1, 100 - percentil)}%</span>
        )}
      </div>
    </div>
  );
}

export function CronoComparacaoDetalhada({ periodo }: Props) {
  const [modo, setModo] = useState<"materia" | "assunto">("materia");
  const { data: materias = [], isLoading: lm } = useComparacaoMaterias(periodo);
  const { data: assuntos = [], isLoading: la } = useComparacaoAssuntos(periodo);

  const isLoading = modo === "materia" ? lm : la;
  const vazio = modo === "materia" ? materias.length === 0 : assuntos.length === 0;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Comparação por {modo === "materia" ? "matéria" : "assunto"}</h2>
            <p className="text-xs text-muted-foreground">
              Suas horas vs. a média dos alunos, usando os nomes oficiais do catálogo.
            </p>
          </div>
          <div className="flex rounded-lg bg-foreground/5 p-1">
            {(["materia", "assunto"] as const).map(g => (
              <button
                key={g}
                onClick={() => setModo(g)}
                className={`rounded-md px-3 py-1 text-xs transition-colors ${
                  modo === g ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g === "materia" ? "Matéria" : "Assunto"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando comparação…</p>
        ) : vazio ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Ainda não há dados suficientes neste período. Registre sessões usando as matérias e assuntos do catálogo oficial.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 max-h-[28rem] overflow-auto pr-1">
            {modo === "materia"
              ? materias.map(m => (
                  <Linha
                    key={m.materia_canon_id}
                    nome={m.materia_nome}
                    minhas={m.minhas_horas}
                    media={m.media_horas}
                    alunos={m.alunos}
                    percentil={m.percentil}
                    cor={m.cor || "hsl(var(--gold))"}
                  />
                ))
              : assuntos.map(a => (
                  <Linha
                    key={a.assunto_canon_id}
                    nome={`${a.assunto_nome} · ${a.materia_nome}`}
                    minhas={a.minhas_horas}
                    media={a.media_horas}
                    alunos={a.alunos}
                    percentil={a.percentil}
                    cor="hsl(var(--gold))"
                  />
                ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CronoComparacaoDetalhada;
