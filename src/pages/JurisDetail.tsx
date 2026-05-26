import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Lightbulb, BookOpen, Search, Scale, CheckCircle2, Mic, MessageCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { IntegraBox } from "@/components/juris/IntegraBox";
import { JurisPremiumLock } from "@/components/juris/JurisPremiumLock";
import { JurisChatPanel } from "@/components/juris/JurisChatPanel";
import type { JurisJulgado } from "@/types/juris";

const TABS = [
  { id: "nocoes", label: "Noções", icon: Lightbulb, free: true },
  { id: "conceitual", label: "Conceitual", icon: BookOpen, free: false },
  { id: "problema", label: "Problema", icon: Search, free: false },
  { id: "comparativo", label: "Antes × Depois", icon: Scale, free: false },
  { id: "conclusoes", label: "Conclusões", icon: CheckCircle2, free: false },
  { id: "oratoria", label: "Oratória", icon: Mic, free: false },
  { id: "chat", label: "Assistente IA", icon: MessageCircle, free: false },
];

export default function JurisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subscribed } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const canManage = isAdmin || isModerator;
  const [tab, setTab] = useState("nocoes");

  const { data: j, isLoading } = useQuery({
    queryKey: ["juris-julgado", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("juris_julgados" as any)
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as JurisJulgado;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="container mx-auto p-8"><Skeleton className="h-96" /></div>;
  if (!j) return <div className="container mx-auto p-8 text-center text-muted-foreground">Julgado não encontrado.</div>;

  const canSeeFull = subscribed || canManage;
  const linesOf = (s: string) => (s || "").split("\n").map((x) => x.trim()).filter(Boolean);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-12">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/juris")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/juris/admin/${j.id}`)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Button>
        )}
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {j.tribunal && <Badge className="bg-primary/15 text-primary hover:bg-primary/20">{j.tribunal}</Badge>}
          {j.area && <Badge variant="secondary">{j.area}</Badge>}
          {j.assunto && <Badge variant="outline" className="border-primary/40 text-primary">{j.assunto}</Badge>}
          {j.info && <Badge variant="outline" className="border-gold/40 text-gold">{j.info}</Badge>}
          {j.data && <Badge variant="outline">{j.data}</Badge>}
          {!j.published && <Badge variant="destructive">Rascunho</Badge>}
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold leading-tight md:text-3xl">{j.titulo}</h1>
        {(j.relator || j.numero) && (
          <p className="text-sm text-muted-foreground">
            {[j.relator, j.numero].filter(Boolean).join(" · ")}
          </p>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex h-auto bg-secondary/40 p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5 data-[state=active]:bg-card">
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
                {!t.free && !canSeeFull && <span className="ml-1 text-[10px] text-gold">★</span>}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mt-6 space-y-4">
            <TabsContent value="nocoes" className="m-0 space-y-4">
              {j.nocoes?.frase && (
                <Card><CardContent className="p-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">💡 Em uma frase</div>
                  <p className="text-base leading-relaxed">{j.nocoes.frase}</p>
                </CardContent></Card>
              )}
              {j.nocoes?.contexto && (
                <Card><CardContent className="p-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">👥 Contexto e impacto</div>
                  <p className="text-sm leading-relaxed text-foreground/90">{j.nocoes.contexto}</p>
                </CardContent></Card>
              )}
              {(j.nocoes?.ok || j.nocoes?.ko) && (
                <Card><CardContent className="space-y-3 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">⚖️ Resultado do julgamento</div>
                  {j.nocoes?.ok && (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                      <div className="mb-1 text-xs font-semibold text-green-500">CONSTITUCIONAL / VÁLIDO</div>
                      <p className="text-sm">{j.nocoes.ok}</p>
                    </div>
                  )}
                  {j.nocoes?.ko && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                      <div className="mb-1 text-xs font-semibold text-destructive">INCONSTITUCIONAL / INVÁLIDO</div>
                      <p className="text-sm">{j.nocoes.ko}</p>
                    </div>
                  )}
                </CardContent></Card>
              )}
              <IntegraBox texto={j.integra_texto} refText={j.integra_ref} />
            </TabsContent>

            {!canSeeFull ? (
              <>
                {TABS.filter((t) => !t.free).map((t) => (
                  <TabsContent key={t.id} value={t.id} className="m-0"><JurisPremiumLock /></TabsContent>
                ))}
              </>
            ) : (
              <>
                <TabsContent value="conceitual" className="m-0 space-y-4">
                  <Card><CardContent className="p-5">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">📖 Parte conceitual</div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{j.conceitual || "—"}</p>
                  </CardContent></Card>
                  <IntegraBox texto={j.integra_texto} refText={j.integra_ref} />
                </TabsContent>

                <TabsContent value="problema" className="m-0 space-y-4">
                  <Card><CardContent className="p-5">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">⚠️ O problema</div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{j.problema || "—"}</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-5">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">🛡️ A solução adotada</div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{j.solucao || "—"}</p>
                  </CardContent></Card>
                  <IntegraBox texto={j.integra_texto} refText={j.integra_ref} />
                </TabsContent>

                <TabsContent value="comparativo" className="m-0 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-destructive/30"><CardContent className="p-5">
                      <div className="mb-3 text-sm font-semibold text-destructive">✕ Antes</div>
                      <div className="space-y-2">
                        {linesOf(j.antes).map((l, i) => (
                          <div key={i} className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 text-sm">{l}</div>
                        ))}
                      </div>
                    </CardContent></Card>
                    <Card className="border-green-500/30"><CardContent className="p-5">
                      <div className="mb-3 text-sm font-semibold text-green-500">✓ Depois</div>
                      <div className="space-y-2">
                        {linesOf(j.depois).map((l, i) => (
                          <div key={i} className="rounded-md border border-green-500/20 bg-green-500/5 p-2.5 text-sm">{l}</div>
                        ))}
                      </div>
                    </CardContent></Card>
                  </div>
                  <IntegraBox texto={j.integra_texto} refText={j.integra_ref} />
                </TabsContent>

                <TabsContent value="conclusoes" className="m-0 space-y-4">
                  <Card><CardContent className="p-5">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">✅ Conclusões objetivas</div>
                    <div className="space-y-2.5">
                      {linesOf(j.conclusoes).map((l, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</div>
                          <p className="flex-1 pt-0.5 text-sm leading-relaxed">{l.replace(/^\d+\.\s*/, "")}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent></Card>
                  <IntegraBox texto={j.integra_texto} refText={j.integra_ref} />
                </TabsContent>

                <TabsContent value="oratoria" className="m-0 space-y-4">
                  {j.principios && (
                    <Card><CardContent className="p-5">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">⚖️ Princípios jurídicos</div>
                      <div className="space-y-3">
                        {linesOf(j.principios).map((l, i) => {
                          const [nome, ...rest] = l.split("—");
                          return (
                            <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                              <div className="font-semibold text-foreground">{nome.trim()}</div>
                              {rest.length > 0 && <div className="mt-1 text-sm text-muted-foreground">{rest.join("—").trim()}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent></Card>
                  )}
                  {j.doutrina && (
                    <Card><CardContent className="p-5">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">📚 Doutrinadores</div>
                      <div className="space-y-3">
                        {linesOf(j.doutrina).map((l, i) => {
                          const [autor, ...rest] = l.split("—");
                          return (
                            <div key={i} className="border-l-2 border-primary/40 pl-3">
                              <div className="text-sm font-semibold">{autor.trim()}</div>
                              {rest.length > 0 && <div className="text-sm text-muted-foreground">{rest.join("—").trim()}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent></Card>
                  )}
                  {j.jurisprudencia && (
                    <Card><CardContent className="p-5">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">⭐ Jurisprudência</div>
                      <div className="space-y-3">
                        {linesOf(j.jurisprudencia).map((l, i) => {
                          const [ref, ...rest] = l.split("—");
                          return (
                            <div key={i} className="rounded-lg border border-gold/20 bg-gold/5 p-3">
                              <div className="text-sm font-semibold text-gold">{ref.trim()}</div>
                              {rest.length > 0 && <div className="mt-1 text-sm text-foreground/90">{rest.join("—").trim()}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent></Card>
                  )}
                  {j.abertura && (
                    <Card className="border-primary/30"><CardContent className="p-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">🎙️ Argumento de abertura</div>
                      <p className="text-base italic leading-relaxed">"{j.abertura}"</p>
                    </CardContent></Card>
                  )}
                  {j.tese && (
                    <Card className="border-gold/30"><CardContent className="p-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">💬 Tese síntese</div>
                      <p className="text-base italic leading-relaxed">"{j.tese}"</p>
                    </CardContent></Card>
                  )}
                  <IntegraBox texto={j.integra_texto} refText={j.integra_ref} />
                </TabsContent>

                <TabsContent value="chat" className="m-0">
                  <JurisChatPanel julgado={j} />
                </TabsContent>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
