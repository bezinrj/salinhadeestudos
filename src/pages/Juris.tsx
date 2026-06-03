import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Scale, Search, ArrowRight, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import type { JurisJulgado } from "@/types/juris";

export default function Juris() {
  const navigate = useNavigate();
  const { subscribed } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const canManage = isAdmin || isModerator;

  const [search, setSearch] = useState("");
  const [tribunal, setTribunal] = useState<string>("all");
  const [materia, setMateria] = useState<string>("all");
  const [assunto, setAssunto] = useState<string>("all");
  const [info, setInfo] = useState<string>("all");

  const { data: julgados, isLoading } = useQuery({
    queryKey: ["juris-julgados-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("juris_julgados" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as JurisJulgado[];
    },
  });

  const tribunais = useMemo(() => {
    const s = new Set<string>();
    julgados?.forEach((j) => j.tribunal && s.add(j.tribunal));
    return Array.from(s).sort();
  }, [julgados]);

  const materias = useMemo(() => {
    const s = new Set<string>();
    julgados?.forEach((j) => {
      (j.areas?.length ? j.areas : (j.area ? [j.area] : [])).forEach((x) => x && s.add(x));
    });
    return Array.from(s).sort();
  }, [julgados]);

  const assuntos = useMemo(() => {
    const s = new Set<string>();
    julgados?.forEach((j) => {
      const jAreas = j.areas?.length ? j.areas : (j.area ? [j.area] : []);
      if (materia !== "all" && !jAreas.includes(materia)) return;
      (j.assuntos?.length ? j.assuntos : (j.assunto ? [j.assunto] : [])).forEach((x) => x && s.add(x));
    });
    return Array.from(s).sort();
  }, [julgados, materia]);

  const informativosPorTribunal = useMemo(() => {
    const map: Record<string, Set<string>> = { STJ: new Set(), STF: new Set() };
    julgados?.forEach((j) => {
      if (!j.info) return;
      const trib = (j.tribunal || "").toUpperCase();
      if (trib !== "STJ" && trib !== "STF") return;
      map[trib].add(String(j.info));
    });
    const sortDesc = (arr: string[]) =>
      arr.sort((a, b) => {
        const na = parseInt(a.replace(/\D/g, ""), 10);
        const nb = parseInt(b.replace(/\D/g, ""), 10);
        if (isNaN(na) && isNaN(nb)) return b.localeCompare(a);
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return nb - na;
      });
    return {
      STJ: sortDesc(Array.from(map.STJ)),
      STF: sortDesc(Array.from(map.STF)),
    };
  }, [julgados]);

  const filtered = useMemo(() => {
    return (julgados ?? []).filter((j) => {
      if (!j.published && !canManage) return false;
      const jAreas = j.areas?.length ? j.areas : (j.area ? [j.area] : []);
      const jAssuntos = j.assuntos?.length ? j.assuntos : (j.assunto ? [j.assunto] : []);
      if (tribunal !== "all" && j.tribunal !== tribunal) return false;
      if (materia !== "all" && !jAreas.includes(materia)) return false;
      if (assunto !== "all" && !jAssuntos.includes(assunto)) return false;
      if (info !== "all" && String(j.info) !== info) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${j.titulo} ${j.tribunal} ${j.numero} ${jAreas.join(" ")} ${jAssuntos.join(" ")} ${j.nocoes?.frase ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [julgados, tribunal, materia, assunto, info, search, canManage]);


  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 md:p-10"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
              <Scale className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                Salinha <span className="text-primary">Juris</span>
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground md:text-base">
                Julgados decodificados em estrutura didática — com assistente IA para tirar suas dúvidas.
              </p>
            </div>
          </div>
          {canManage && (
            <Button onClick={() => navigate("/juris/admin")} className="bg-primary text-primary-foreground">
              + Novo julgado
            </Button>
          )}
        </div>
        {!subscribed && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-4 py-2.5 text-sm text-gold">
            <Crown className="h-4 w-4" />
            <span>Versão gratuita mostra apenas as Noções de cada julgado. Para o conteúdo completo, assine Premium.</span>
          </div>
        )}
      </motion.div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, tribunal, número..."
            className="pl-9"
          />
        </div>
        <Select value={tribunal} onValueChange={setTribunal}>
          <SelectTrigger className="md:w-[160px]"><SelectValue placeholder="Tribunal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tribunais</SelectItem>
            {tribunais.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={materia} onValueChange={(v) => { setMateria(v); setAssunto("all"); }}>
          <SelectTrigger className="md:w-[180px]"><SelectValue placeholder="Matéria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as matérias</SelectItem>
            {materias.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assunto} onValueChange={setAssunto}>
          <SelectTrigger className="md:w-[180px]"><SelectValue placeholder="Assunto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os assuntos</SelectItem>
            {assuntos.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Informativos STJ / STF */}
      {(informativosPorTribunal.STJ.length > 0 || informativosPorTribunal.STF.length > 0) && (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {(["STJ", "STF"] as const).map((trib) => {
            const items = informativosPorTribunal[trib];
            if (items.length === 0) return null;
            return (
              <div
                key={trib}
                className="rounded-2xl border border-border bg-card/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    Informativos <span className="text-primary">{trib}</span>
                  </h3>
                  {info !== "all" && (
                    <button
                      onClick={() => setInfo("all")}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((n) => {
                    const active = info === n;
                    return (
                      <button
                        key={n}
                        onClick={() => {
                          setInfo(active ? "all" : n);
                          setTribunal(active ? "all" : trib);
                        }}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nenhum julgado encontrado.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="group relative h-full cursor-pointer border-border bg-card transition-colors hover:border-primary/50"
                onClick={() => navigate(`/juris/${j.id}`)}
              >
                <CardContent className="flex h-full flex-col p-5">
                  {(() => {
                    const jAreas = j.areas?.length ? j.areas : (j.area ? [j.area] : []);
                    const jTopicos = j.topicos ?? [];
                    const primeiraMateria = jTopicos[0]?.materia || jAreas[0] || "";
                    const extrasCount = Math.max(
                      (jTopicos.length || jAreas.length) - 1,
                      0
                    );
                    return (
                      <>
                        <div className="mb-3 flex flex-wrap items-center gap-1.5">
                          {j.tribunal && <Badge variant="secondary" className="bg-primary/15 text-primary">{j.tribunal}</Badge>}
                          {primeiraMateria && (
                            <Badge variant="outline" className="border-primary/40 text-primary">{primeiraMateria}</Badge>
                          )}
                          {extrasCount > 0 && (
                            <Badge variant="outline" className="border-border text-muted-foreground">+{extrasCount}</Badge>
                          )}
                          {j.info && <Badge variant="outline" className="border-gold/40 text-gold">{j.info}</Badge>}
                          {!j.published && <Badge variant="destructive">Rascunho</Badge>}
                        </div>
                        <h3 className="mb-2 line-clamp-2 font-display text-lg font-semibold leading-snug">
                          {j.titulo || "(sem título)"}
                        </h3>
                        <div className="mb-3 text-xs text-muted-foreground">
                          {[j.data, j.numero].filter(Boolean).join(" · ")}
                        </div>
                      </>
                    );
                  })()}
                  <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {j.nocoes?.frase || "Sem resumo."}
                  </p>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-medium text-primary">
                    <span>Abrir</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
