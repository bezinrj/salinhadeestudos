import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useVmLei, useVmLeis, useVmProgresso } from "@/hooks/useVademecum";
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
  const { user, profile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const canEdit = isAdmin || isModerator;

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

  const totalLidos = artigos.filter((a) => progressoMap.get(a.id)?.lido).length;
  const progressPct = artigos.length ? Math.round((totalLidos / artigos.length) * 100) : 0;

  const handleToggle = (artigoId: string, field: "lido" | "marcado", value: boolean) => {
    toggle({ artigoId, field, value });
    if (field === "lido" && value) toast.success("Marcado como lido");
    if (field === "marcado" && value) toast.success("Artigo marcado");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <LeiSidebar leis={leis} activeLeiId={leiId} />

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
                    {totalLidos}/{artigos.length} lidos
                  </span>
                </div>
              </header>

              <ArticleFilters
                status={status}
                setStatus={setStatus}
                cargo={cargo}
                setCargo={setCargo}
                onAbrirMarcados={() => setMarcadosOpen(true)}
              />

              <div className="mt-4 space-y-4">
                {filtered.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Nenhum artigo corresponde ao filtro selecionado.
                  </p>
                ) : (
                  filtered.map((a) => (
                    <ArticleCard
                      key={a.id}
                      artigo={a}
                      progresso={progressoMap.get(a.id)}
                      filtroCargo={cargo}
                      marcacoesByBlock={marc.byBlock}
                      notasProf={notasProf.byArtigo.get(a.id) ?? []}
                      notaPriv={notasPriv.byArtigo.get(a.id)}
                      canAddProfNote={canEdit}
                      autorId={user?.id}
                      autorNome={profile?.name || profile?.username || "Professor"}
                      onToggleLido={(id, v) => handleToggle(id, "lido", v)}
                      onToggleMarcado={(id, v) => handleToggle(id, "marcado", v)}
                      onRemissaoClick={(rem) => setRemissaoDestinoId(rem.artigo_destino_id)}
                      onCreateMarcacao={(p) => marc.create.mutate(p)}
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
      />
    </div>
  );
}
