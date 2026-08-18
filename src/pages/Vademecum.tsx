import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useVmLei, useVmLeis, useVmProgresso } from "@/hooks/useVademecum";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useVmMarcacoes,
  useVmNotasProfessor,
  useVmNotasPrivadas,
} from "@/hooks/useVademecumExtras";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { LeiSidebar } from "@/components/vademecum/LeiSidebar";
import { ArticleCard } from "@/components/vademecum/ArticleCard";
import { ArticleFilters } from "@/components/vademecum/ArticleFilters";
import { MarkedArticlesDrawer } from "@/components/vademecum/MarkedArticlesDrawer";
import { RemissaoDrawer } from "@/components/vademecum/RemissaoDrawer";
import type { VmFiltroCargo, VmFiltroStatus } from "@/types/vademecum";

export default function Vademecum() {
  const { leiId } = useParams<{ leiId?: string }>();
  const navigate = useNavigate();
  const { user, profile, entitlements } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const canEdit = isAdmin || isModerator;
  const hasVade = entitlements.vade || canEdit;
  const FREE_PREVIEW_ARTICLES = 10;

  const { data: leis = [], isLoading: leisLoading } = useVmLeis();

  useEffect(() => {
    if (!leiId && leis.length > 0) {
      navigate(`/vademecum/${leis[0].id}`, { replace: true });
    }
  }, [leiId, leis, navigate]);

  const { data, isLoading } = useVmLei(leiId);
  const { progressoMap, toggle } = useVmProgresso(leiId);

  const artigos = data?.artigos ?? [];
  const artigoIds = useMemo(() => artigos.map((a) => a.id), [artigos]);
  const marc = useVmMarcacoes(artigoIds);
  const notasProf = useVmNotasProfessor(artigoIds);
  const notasPriv = useVmNotasPrivadas(artigoIds);

  const [status, setStatus] = useState<VmFiltroStatus>("todos");
  const [cargo, setCargo] = useState<VmFiltroCargo>("todos");
  const [marcadosOpen, setMarcadosOpen] = useState(false);
  const [remissaoDestinoId, setRemissaoDestinoId] = useState<string | null>(null);
  const [pendingOrigem, setPendingOrigem] = useState<any | null>(null);
  const [retornoOrigem, setRetornoOrigem] = useState<any | null>(null);

  const filtered = useMemo(() => {
    return artigos.filter((a) => {
      const p = progressoMap.get(a.id);
      if (status === "lidos" && !p?.lido) return false;
      if (status === "nao_lidos" && p?.lido) return false;
      if (status === "marcados" && !p?.marcado) return false;
      if (cargo !== "todos") {
        const inc = a.incidencias.find((i) => i.cargo === cargo);
        if (!inc || inc.quantidade === 0) return false;
      }
      return true;
    });
  }, [artigos, progressoMap, status, cargo]);

  // Degustação: usuários sem o plano veem apenas os 10 primeiros artigos de cada lei
  const allowedIds = useMemo(
    () => new Set(artigos.slice(0, FREE_PREVIEW_ARTICLES).map((a) => a.id)),
    [artigos]
  );
  const visibleArtigos = useMemo(
    () => (hasVade ? filtered : filtered.filter((a) => allowedIds.has(a.id))),
    [hasVade, filtered, allowedIds]
  );
  const showPaywall = !hasVade && artigos.length > FREE_PREVIEW_ARTICLES;

  const artigosContaveis = useMemo(() => {
    return artigos.filter((a) => a.rotulo && /^Art\.?\s*\d+/i.test(a.rotulo.trim()));
  }, [artigos]);

  const totalLidos = useMemo(() => {
    return artigosContaveis.filter((a) => progressoMap.get(a.id)?.lido).length;
  }, [artigosContaveis, progressoMap]);

  const progressPct = artigosContaveis.length ? Math.round((totalLidos / artigosContaveis.length) * 100) : 0;


  const handleToggle = (artigoId: string, field: "lido" | "marcado", value: boolean) => {
    toggle({ artigoId, field, value });
    if (field === "lido" && value) toast.success("Marcado como lido");
    if (field === "marcado" && value) toast.success("Artigo marcado");
  };

  const queryClient = useQueryClient();

  const handleAddRemissao = async (artigoId: string, destArtigoId: string, textoExibido: string) => {
    try {
      if (!user?.id) {
        toast.error("Faça login para adicionar remissões.");
        return;
      }
      const { error } = await supabase.from("vm_remissoes").insert({
        artigo_origem_id: artigoId,
        artigo_destino_id: destArtigoId,
        texto_exibido: textoExibido,
        user_id: user.id,
      } as any);
      if (error) throw error;
      toast.success("Remissão adicionada");
      queryClient.invalidateQueries({ queryKey: ["vm-lei", leiId] });
    } catch (e: any) {
      toast.error("Erro ao adicionar remissão: " + e.message);
    }
  };

  const handleDeleteRemissao = async (remissaoId: string) => {
    try {
      const { error } = await supabase.from("vm_remissoes").delete().eq("id", remissaoId);
      if (error) throw error;
      toast.success("Remissão removida");
      queryClient.invalidateQueries({ queryKey: ["vm-lei", leiId] });
    } catch (e: any) {
      toast.error("Erro ao remover remissão: " + e.message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <LeiSidebar
        leis={leis}
        activeLeiId={leiId}
        canReorder={canEdit}
        onReordered={() => queryClient.invalidateQueries({ queryKey: ["vm-leis"] })}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
          {isLoading || leisLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !data ? (
            <p className="text-sm text-muted-foreground">Selecione uma lei na barra lateral.</p>
          ) : (
            <>
              <header className="mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">
                      {data.lei.nome} <span className="text-muted-foreground">({data.lei.sigla})</span>
                    </h1>
                    {data.lei.descricao && (
                      <p className="mt-1 text-sm text-muted-foreground">{data.lei.descricao}</p>
                    )}
                  </div>
                  {canEdit && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/vademecum/admin"><Settings className="mr-1 h-4 w-4" /> Gerenciar</Link>
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={progressPct} className="h-2 flex-1" />
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {totalLidos}/{artigosContaveis.length} lidos
                  </span>
                </div>
              </header>

              <ArticleFilters
                status={status}
                setStatus={setStatus}
                cargo={cargo}
                setCargo={setCargo}
              />

              <div className="mt-4 space-y-4">
                {visibleArtigos.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Nenhum artigo corresponde ao filtro selecionado.
                  </p>
                ) : (
                  visibleArtigos.map((a) => (
                    <ArticleCard
                      key={a.id}
                      artigo={a}
                      progresso={progressoMap.get(a.id)}
                      filtroCargo={cargo}
                      marcacoesByBlock={marc.byBlock}
                      notasProf={notasProf.byArtigo.get(a.id) ?? []}
                      notaPriv={notasPriv.byArtigo.get(a.id)}
                      canAddProfNote={canEdit}
                      subscribed={hasVade}
                      autorId={user?.id}
                      autorNome={profile?.name || profile?.username || "Professor"}
                      onToggleLido={(id, v) => handleToggle(id, "lido", v)}
                      onToggleMarcado={(id, v) => handleToggle(id, "marcado", v)}
                      onRemissaoClick={(rem) => {
                        setRemissaoDestinoId(rem.artigo_destino_id);
                        const originArt = artigos.find((a) => a.id === rem.artigo_origem_id);
                        if (originArt && data) {
                          setPendingOrigem({
                            artigoId: originArt.id,
                            leiId: data.lei.id,
                            rotulo: originArt.rotulo || `Art. ${originArt.numero}`,
                            leiSigla: data.lei.sigla,
                          });
                        }
                      }}
                      onCreateMarcacao={(p) => marc.create.mutate(p)}
                      onUpdateMarcacao={(id, cor, anotacao) => marc.update.mutate({ id, cor, anotacao })}
                      onRemoveMarcacao={(id) => marc.remove.mutate(id)}
                      onCreateProfNote={(artigoId, conteudo) =>
                        notasProf.create.mutateAsync({
                          artigo_id: artigoId,
                          autor_id: user!.id,
                          autor_nome: profile?.name || profile?.username || "Professor",
                          conteudo,
                        })
                      }
                      onRemoveProfNote={(id) => notasProf.remove.mutate(id)}
                      onSavePrivNote={(artigoId, conteudo) =>
                        notasPriv.upsert.mutateAsync({ artigo_id: artigoId, conteudo })
                      }
                      onRemovePrivNote={(id) => notasPriv.remove.mutateAsync(id)}
                      leis={leis}
                      onAddRemissao={handleAddRemissao}
                      onDeleteRemissao={handleDeleteRemissao}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {data && (
        <MarkedArticlesDrawer
          open={marcadosOpen}
          onOpenChange={setMarcadosOpen}
          leiNome={data.lei.sigla}
          artigos={artigos}
          progressoMap={progressoMap}
        />
      )}

      <RemissaoDrawer
        open={!!remissaoDestinoId}
        onOpenChange={(v) => !v && setRemissaoDestinoId(null)}
        artigoDestinoId={remissaoDestinoId}
        onNavigateToDestino={() => {
          if (pendingOrigem) {
            setRetornoOrigem(pendingOrigem);
            setPendingOrigem(null);
          }
        }}
      />

      {retornoOrigem && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            size="default"
            className="flex items-center gap-2 rounded-full shadow-lg bg-sky-600 hover:bg-sky-700 text-white font-medium border border-sky-400/20"
            onClick={() => {
              navigate(`/vademecum/${retornoOrigem.leiId}`);
              setTimeout(() => {
                document.getElementById(`vm-art-${retornoOrigem.artigoId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                const el = document.getElementById(`vm-art-${retornoOrigem.artigoId}`);
                if (el) {
                  el.classList.add("ring-2", "ring-sky-500", "ring-offset-2", "ring-offset-background");
                  setTimeout(() => {
                    el.classList.remove("ring-2", "ring-sky-500", "ring-offset-2", "ring-offset-background");
                  }, 2000);
                }
              }, 300);
              setRetornoOrigem(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para {retornoOrigem.leiSigla} — {retornoOrigem.rotulo}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full shadow-lg bg-background text-muted-foreground hover:text-foreground border border-border"
            onClick={() => setRetornoOrigem(null)}
            title="Fechar"
          >
            <span className="text-lg">×</span>
          </Button>
        </div>
      )}
    </div>
  );
}
