import { useMemo } from "react";
import { Search, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LeiSidebar } from "@/components/vademecum/LeiSidebar";
import { SumulaCard } from "@/components/vademecum/SumulaCard";
import { UnlockPremiumCard } from "@/components/vademecum/UnlockPremiumCard";
import { useVmLeis } from "@/hooks/useVademecum";
import { useVmSumulas, TRIBUNAL_LABEL, type VmSumulaTribunal } from "@/hooks/useVmSumulas";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";

const FREE_PREVIEW = 15;

export default function VademecumSumulas() {
  const { entitlements } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const hasVade = entitlements.vade || isAdmin || isModerator;

  const { data: leis = [] } = useVmLeis();
  const { data: sumulas = [], isLoading } = useVmSumulas();

  const [q, setQ] = usePersistedState<string>("sumulas:q", "");
  const [tribunal, setTribunal] = usePersistedState<string>("sumulas:tribunal", "todos");
  const [materia, setMateria] = usePersistedState<string>("sumulas:materia", "todas");
  const [assunto, setAssunto] = usePersistedState<string>("sumulas:assunto", "todos");

  const byTribunal = useMemo(
    () => (tribunal === "todos" ? sumulas : sumulas.filter((s) => s.tribunal === tribunal)),
    [sumulas, tribunal],
  );

  const materias = useMemo(
    () => Array.from(new Set(byTribunal.map((s) => s.materia))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [byTribunal],
  );

  const assuntos = useMemo(() => {
    const base = materia === "todas" ? byTribunal : byTribunal.filter((s) => s.materia === materia);
    return Array.from(new Set(base.map((s) => s.assunto))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [byTribunal, materia]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return byTribunal.filter((s) => {
      if (materia !== "todas" && s.materia !== materia) return false;
      if (assunto !== "todos" && s.assunto !== assunto) return false;
      if (!term) return true;
      return (
        s.texto.toLowerCase().includes(term) ||
        String(s.numero).includes(term) ||
        s.materia.toLowerCase().includes(term) ||
        s.assunto.toLowerCase().includes(term)
      );
    });
  }, [byTribunal, materia, assunto, q]);

  const visible = hasVade ? filtered : filtered.slice(0, FREE_PREVIEW);
  const showPaywall = !hasVade && filtered.length > FREE_PREVIEW;

  // Agrupamento: matéria → assunto
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, typeof visible>>();
    visible.forEach((s) => {
      if (!map.has(s.materia)) map.set(s.materia, new Map());
      const sub = map.get(s.materia)!;
      if (!sub.has(s.assunto)) sub.set(s.assunto, []);
      sub.get(s.assunto)!.push(s);
    });
    return Array.from(map.entries()).map(([m, sub]) => [m, Array.from(sub.entries())] as const);
  }, [visible]);

  const clearFilters = () => {
    setQ("");
    setTribunal("todos");
    setMateria("todas");
    setAssunto("todos");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <LeiSidebar leis={leis} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
          <header className="mb-4">
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
              <Scale className="h-6 w-6 text-primary" /> Súmulas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              STJ, STF e Vinculantes organizadas por matéria e assunto.
            </p>
          </header>

          <div className="space-y-2 border-b border-border pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por número, matéria, assunto ou trecho do enunciado..."
                className="h-9 pl-8 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={tribunal}
                onValueChange={(v) => {
                  setTribunal(v);
                  setMateria("todas");
                  setAssunto("todos");
                }}
              >
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tribunais</SelectItem>
                  {(["STJ", "STF", "VINCULANTE"] as VmSumulaTribunal[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TRIBUNAL_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={materia}
                onValueChange={(v) => {
                  setMateria(v);
                  setAssunto("todos");
                }}
              >
                <SelectTrigger className="h-9 w-[220px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="todas">Todas as matérias</SelectItem>
                  {materias.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assunto} onValueChange={setAssunto}>
                <SelectTrigger className="h-9 w-[240px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="todos">Todos os assuntos</SelectItem>
                  {assuntos.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs">
                Limpar filtros
              </Button>

              <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
                {filtered.length} súmula{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando súmulas...</p>
            ) : visible.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhuma súmula corresponde aos filtros selecionados.
              </p>
            ) : (
              grouped.map(([mat, assuntosList]) => (
                <section key={mat}>
                  <h2 className="mb-2 font-display text-lg font-bold text-primary">{mat}</h2>
                  <div className="space-y-4">
                    {assuntosList.map(([ass, items]) => (
                      <div key={ass}>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {ass} <span className="text-[10px] font-normal">({items.length})</span>
                        </h3>
                        <div className="space-y-2">
                          {items.map((s) => (
                            <SumulaCard key={s.id} sumula={s} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}

            {showPaywall && (
              <UnlockPremiumCard
                variant="lei"
                description={`Você está vendo apenas as ${FREE_PREVIEW} primeiras súmulas. Assine o Vade Digital para liberar todas as súmulas do STJ, STF e Vinculantes, além das leis, notas, grifos e cadernos.`}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
