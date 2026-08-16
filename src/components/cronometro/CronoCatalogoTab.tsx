import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, RefreshCw, Users, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useCronoCatalogo, useCronoCatalogoAdmin } from "@/hooks/useCronoCanon";

const PALETTE = ["#EAB308", "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

export default function CronoCatalogoTab() {
  const { materiasCanon, assuntosCanon } = useCronoCatalogo(true);
  const {
    pendencias, aliases,
    saveMateria, deleteMateria, saveAssunto, deleteAssunto,
    addAlias, deleteAlias, relink,
  } = useCronoCatalogoAdmin();

  const [novaMateria, setNovaMateria] = useState("");
  const [novaCor, setNovaCor] = useState(PALETTE[0]);
  const [selMateria, setSelMateria] = useState<string>("");
  const [novoAssunto, setNovoAssunto] = useState("");
  const [aliasAlvo, setAliasAlvo] = useState<Record<string, string>>({});

  const assuntosDaMateria = useMemo(
    () => assuntosCanon.filter(a => a.materia_canon_id === selMateria),
    [assuntosCanon, selMateria]
  );

  const aliasesPorCanon = useMemo(() => {
    const map = new Map<string, typeof aliases>();
    aliases.forEach(a => {
      const list = map.get(a.canon_id) || [];
      list.push(a);
      map.set(a.canon_id, list as any);
    });
    return map;
  }, [aliases]);

  const nomeCanon = (id: string) =>
    materiasCanon.find(m => m.id === id)?.nome || assuntosCanon.find(a => a.id === id)?.nome || "—";

  const handleVincular = async (p: (typeof pendencias)[number]) => {
    const canonId = aliasAlvo[`${p.tipo}:${p.texto_norm}`];
    if (!canonId) return;
    try {
      await addAlias.mutateAsync({ tipo: p.tipo, canon_id: canonId, texto: p.texto });
      await relink.mutateAsync();
      toast.success(`"${p.texto}" agora conta como ${nomeCanon(canonId)}.`);
    } catch {
      toast.error("Não foi possível vincular.");
    }
  };

  const handleCriarCanonDePendencia = async (p: (typeof pendencias)[number]) => {
    try {
      if (p.tipo === "materia") {
        await saveMateria.mutateAsync({ nome: p.texto, cor: PALETTE[materiasCanon.length % PALETTE.length] });
      } else {
        if (!p.materia_canon_id) {
          toast.error("Vincule primeiro a matéria deste assunto ao catálogo.");
          return;
        }
        await saveAssunto.mutateAsync({ nome: p.texto, materia_canon_id: p.materia_canon_id });
      }
      await relink.mutateAsync();
      toast.success(`"${p.texto}" adicionado ao catálogo.`);
    } catch {
      toast.error("Não foi possível adicionar ao catálogo.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Catálogo oficial usado na comparação social do Cronômetro. Sinônimos fazem "Penal" contar como "Direito Penal".
        </p>
        <Button size="sm" variant="outline" onClick={() => relink.mutate(undefined, {
          onSuccess: () => toast.success("Vínculos reprocessados."),
          onError: () => toast.error("Falha ao reprocessar."),
        })}>
          <RefreshCw className="mr-2 h-4 w-4" /> Reprocessar vínculos
        </Button>
      </div>

      {/* Pendências */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">
            Pendências de classificação {pendencias.length > 0 && <Badge className="ml-2">{pendencias.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendencias.length === 0 && (
            <p className="text-sm text-muted-foreground">Nada pendente — tudo classificado.</p>
          )}
          {pendencias.map(p => {
            const key = `${p.tipo}:${p.texto_norm}`;
            const opcoes = p.tipo === "materia"
              ? materiasCanon
              : assuntosCanon.filter(a => !p.materia_canon_id || a.materia_canon_id === p.materia_canon_id);
            return (
              <div key={key} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5">
                <Badge variant="outline" className="text-[10px]">{p.tipo}</Badge>
                <span className="text-sm font-medium">{p.texto}</span>
                {p.materia_nome && <span className="text-xs text-muted-foreground">em {p.materia_nome}</span>}
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" /> {p.alunos}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Select value={aliasAlvo[key] || ""} onValueChange={(v) => setAliasAlvo(s => ({ ...s, [key]: v }))}>
                    <SelectTrigger className="h-8 w-56 text-xs">
                      <SelectValue placeholder="Vincular a…" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {opcoes.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" disabled={!aliasAlvo[key]} onClick={() => handleVincular(p)}>
                    <Link2 className="mr-1 h-3.5 w-3.5" /> Vincular
                  </Button>
                  <Button size="sm" onClick={() => handleCriarCanonDePendencia(p)}
                    className="bg-gold text-gold-foreground hover:opacity-90">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Criar oficial
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Matérias canônicas */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Matérias oficiais</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input className="flex-1 min-w-[12rem]" placeholder="Nova matéria oficial"
                value={novaMateria} onChange={e => setNovaMateria(e.target.value)} />
              <div className="flex items-center gap-1">
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setNovaCor(c)} aria-label={c}
                    className={`h-5 w-5 rounded-full border-2 ${novaCor === c ? "border-foreground" : "border-transparent"}`}
                    style={{ background: c }} />
                ))}
              </div>
              <Button size="sm" className="bg-gold text-gold-foreground hover:opacity-90"
                onClick={() => {
                  const nome = novaMateria.trim();
                  if (!nome) return;
                  saveMateria.mutate({ nome, cor: novaCor }, {
                    onSuccess: () => { setNovaMateria(""); toast.success("Matéria criada."); },
                    onError: () => toast.error("Já existe ou falhou."),
                  });
                }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[26rem] divide-y divide-border overflow-auto rounded-md border border-border">
              {materiasCanon.map(m => (
                <div key={m.id} className={`p-2 ${selMateria === m.id ? "bg-foreground/5" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: m.cor }} />
                    <button className="flex-1 text-left text-sm" onClick={() => setSelMateria(m.id)}>{m.nome}</button>
                    {!m.ativo && <Badge variant="outline" className="text-[10px]">inativa</Badge>}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={() => {
                        if (!confirm(`Excluir "${m.nome}" do catálogo oficial?`)) return;
                        deleteMateria.mutate(m.id);
                      }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {(aliasesPorCanon.get(m.id) || []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 pl-5">
                      {(aliasesPorCanon.get(m.id) || []).map(a => (
                        <button key={a.id} onClick={() => deleteAlias.mutate(a.id)}
                          className="rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-destructive">
                          {a.texto_norm} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assuntos canônicos */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Assuntos oficiais {selMateria ? `· ${materiasCanon.find(m => m.id === selMateria)?.nome}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selMateria ? (
              <p className="text-sm text-muted-foreground">Selecione uma matéria oficial ao lado.</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input placeholder="Novo assunto oficial" value={novoAssunto}
                    onChange={e => setNovoAssunto(e.target.value)} />
                  <Button size="sm" className="bg-gold text-gold-foreground hover:opacity-90"
                    onClick={() => {
                      const nome = novoAssunto.trim();
                      if (!nome) return;
                      saveAssunto.mutate({ nome, materia_canon_id: selMateria }, {
                        onSuccess: () => { setNovoAssunto(""); toast.success("Assunto criado."); },
                        onError: () => toast.error("Já existe ou falhou."),
                      });
                    }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="max-h-[26rem] divide-y divide-border overflow-auto rounded-md border border-border">
                  {assuntosDaMateria.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">Nenhum assunto oficial nesta matéria.</p>
                  )}
                  {assuntosDaMateria.map(a => (
                    <div key={a.id} className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm">{a.nome}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                          onClick={() => {
                            if (!confirm(`Excluir "${a.nome}"?`)) return;
                            deleteAssunto.mutate(a.id);
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {(aliasesPorCanon.get(a.id) || []).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(aliasesPorCanon.get(a.id) || []).map(al => (
                            <button key={al.id} onClick={() => deleteAlias.mutate(al.id)}
                              className="rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-destructive">
                              {al.texto_norm} ×
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
