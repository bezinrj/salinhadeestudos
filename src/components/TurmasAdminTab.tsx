import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, X, BookOpen, GripVertical, Layers, Tag } from "lucide-react";
import { toast } from "sonner";
import { TURMA_ICON_NAMES, getTurmaIcon } from "@/lib/turmasIcons";

type Categoria = { id: string; nome: string; cor: string; icone: string };
type Album = {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria_id: string | null;
  capa_url: string | null;
  questoes_por_liberacao: number;
  intervalo_dias: number;
  data_inicio: string;
  is_active: boolean;
};
type Questao = { id: string; public_id: number; title: string; discipline: string };
type TurmaQuestao = {
  id: string;
  ordem: number;
  liberado_em: string;
  question_id: string;
  question: Questao | null;
};

export default function TurmasAdminTab() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"albuns" | "categorias">("albuns");

  // Album form
  const [showAlbum, setShowAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [aTitulo, setATitulo] = useState("");
  const [aDescricao, setADescricao] = useState("");
  const [aCategoria, setACategoria] = useState<string>("");
  const [aCapa, setACapa] = useState("");
  const [aQpL, setAQpL] = useState(1);
  const [aIntervalo, setAIntervalo] = useState(7);
  const [aDataInicio, setADataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [aActive, setAActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Categoria form
  const [showCat, setShowCat] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [cNome, setCNome] = useState("");
  const [cCor, setCCor] = useState("#6366f1");
  const [cIcone, setCIcone] = useState("BookOpen");

  // Questoes manager
  const [managingAlbum, setManagingAlbum] = useState<Album | null>(null);

  const { data: categorias = [] } = useQuery({
    queryKey: ["admin-turmas-categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("turmas_categorias").select("*").order("nome");
      if (error) throw error;
      return (data || []) as Categoria[];
    },
  });

  const { data: albuns = [] } = useQuery({
    queryKey: ["admin-turmas-albuns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas_albuns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Album[];
    },
  });

  const resetAlbum = () => {
    setEditingAlbum(null);
    setATitulo(""); setADescricao(""); setACategoria(""); setACapa("");
    setAQpL(1); setAIntervalo(7); setADataInicio(new Date().toISOString().slice(0, 10)); setAActive(true);
  };

  const openEditAlbum = (a: Album) => {
    setEditingAlbum(a);
    setATitulo(a.titulo);
    setADescricao(a.descricao || "");
    setACategoria(a.categoria_id || "");
    setACapa(a.capa_url || "");
    setAQpL(a.questoes_por_liberacao);
    setAIntervalo(a.intervalo_dias);
    setADataInicio(a.data_inicio.slice(0, 10));
    setAActive(a.is_active);
    setShowAlbum(true);
  };

  const saveAlbum = useMutation({
    mutationFn: async () => {
      const payload = {
        titulo: aTitulo,
        descricao: aDescricao || null,
        categoria_id: aCategoria || null,
        capa_url: aCapa || null,
        questoes_por_liberacao: Math.max(1, aQpL),
        intervalo_dias: Math.max(1, aIntervalo),
        data_inicio: new Date(aDataInicio).toISOString(),
        is_active: aActive,
      };
      if (editingAlbum) {
        const { error } = await supabase.from("turmas_albuns").update(payload).eq("id", editingAlbum.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("turmas_albuns").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-turmas-albuns"] });
      queryClient.invalidateQueries({ queryKey: ["turmas-albuns"] });
      setShowAlbum(false);
      resetAlbum();
      toast.success("Turma salva!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("turmas_albuns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-turmas-albuns"] });
      queryClient.invalidateQueries({ queryKey: ["turmas-albuns"] });
      toast.success("Turma excluída.");
    },
  });

  const saveCat = useMutation({
    mutationFn: async () => {
      const payload = { nome: cNome, cor: cCor, icone: cIcone };
      if (editingCat) {
        const { error } = await supabase.from("turmas_categorias").update(payload).eq("id", editingCat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("turmas_categorias").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-turmas-categorias"] });
      queryClient.invalidateQueries({ queryKey: ["turmas-categorias"] });
      setShowCat(false);
      setEditingCat(null);
      setCNome(""); setCCor("#6366f1"); setCIcone("BookOpen");
      toast.success("Categoria salva!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("turmas_categorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-turmas-categorias"] });
      queryClient.invalidateQueries({ queryKey: ["turmas-categorias"] });
      toast.success("Categoria excluída.");
    },
  });

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `turmas/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("schedule-covers").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Erro ao enviar imagem");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("schedule-covers").getPublicUrl(path);
    setACapa(urlData.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada!");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={tab === "albuns" ? "default" : "outline"} size="sm" onClick={() => setTab("albuns")}>
          <Layers className="h-4 w-4 mr-2" /> Álbuns
        </Button>
        <Button variant={tab === "categorias" ? "default" : "outline"} size="sm" onClick={() => setTab("categorias")}>
          <Tag className="h-4 w-4 mr-2" /> Categorias
        </Button>
      </div>

      {tab === "albuns" && (
        <Card className="gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Álbuns / Turmas</CardTitle>
            <Button size="sm" onClick={() => { resetAlbum(); setShowAlbum(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nova Turma
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {albuns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma turma ainda.</p>
            ) : (
              albuns.map((a) => {
                const cat = categorias.find((c) => c.id === a.categoria_id);
                const Icon = getTurmaIcon(cat?.icone);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/50">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${cat?.cor || "#6366f1"}20`, color: cat?.cor || "#6366f1" }}
                    >
                      {a.capa_url ? (
                        <img src={a.capa_url} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.titulo}</p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-0.5">
                        {cat && <Badge variant="outline" style={{ borderColor: `${cat.cor}50`, color: cat.cor }}>{cat.nome}</Badge>}
                        <span>{a.questoes_por_liberacao} q / {a.intervalo_dias}d</span>
                        <span>Início: {new Date(a.data_inicio).toLocaleDateString("pt-BR")}</span>
                        {!a.is_active && <Badge variant="outline">Inativa</Badge>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setManagingAlbum(a)}>
                      <BookOpen className="h-4 w-4 mr-1" /> Questões
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditAlbum(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Excluir esta turma?")) deleteAlbum.mutate(a.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {tab === "categorias" && (
        <Card className="gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Categorias</CardTitle>
            <Button size="sm" onClick={() => { setEditingCat(null); setCNome(""); setCCor("#6366f1"); setCIcone("BookOpen"); setShowCat(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nova Categoria
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {categorias.map((c) => {
              const Icon = getTurmaIcon(c.icone);
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/50">
                  <span
                    className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${c.cor}20`, color: c.cor }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="flex-1 text-sm font-medium">{c.nome}</p>
                  <Button variant="ghost" size="icon" onClick={() => { setEditingCat(c); setCNome(c.nome); setCCor(c.cor); setCIcone(c.icone); setShowCat(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Excluir categoria?")) deleteCat.mutate(c.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Album dialog */}
      <Dialog open={showAlbum} onOpenChange={(o) => { if (!o) { setShowAlbum(false); resetAlbum(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAlbum ? "Editar Turma" : "Nova Turma"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Título *</label>
              <Input value={aTitulo} onChange={(e) => setATitulo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Descrição</label>
              <Textarea value={aDescricao} onChange={(e) => setADescricao(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Categoria</label>
              <Select value={aCategoria || "none"} onValueChange={(v) => setACategoria(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem categoria —</SelectItem>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Questões por liberação</label>
                <Input type="number" min={1} value={aQpL} onChange={(e) => setAQpL(parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Intervalo (dias)</label>
                <Input type="number" min={1} value={aIntervalo} onChange={(e) => setAIntervalo(parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Data de início</label>
              <Input type="date" value={aDataInicio} onChange={(e) => setADataInicio(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Capa</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
              {aCapa ? (
                <div className="relative">
                  <img src={aCapa} alt="" className="w-full h-32 object-cover rounded-lg border border-border/50" />
                  <button className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center" onClick={() => setACapa("")}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button className="w-full h-24 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:border-primary/40" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Enviar imagem"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={aActive} onCheckedChange={setAActive} />
              <span className="text-xs">Ativa</span>
            </div>
            <Button className="w-full" disabled={!aTitulo.trim() || saveAlbum.isPending} onClick={() => saveAlbum.mutate()}>
              {saveAlbum.isPending ? "Salvando..." : editingAlbum ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categoria dialog */}
      <Dialog open={showCat} onOpenChange={(o) => { if (!o) { setShowCat(false); setEditingCat(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome *</label>
              <Input value={cNome} onChange={(e) => setCNome(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cor</label>
              <div className="flex items-center gap-2">
                <input type="color" value={cCor} onChange={(e) => setCCor(e.target.value)} className="h-9 w-12 rounded border border-border" />
                <Input value={cCor} onChange={(e) => setCCor(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ícone</label>
              <Select value={cIcone} onValueChange={setCIcone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TURMA_ICON_NAMES.map((name) => {
                    const I = getTurmaIcon(name);
                    return (
                      <SelectItem key={name} value={name}>
                        <span className="inline-flex items-center gap-2"><I className="h-4 w-4" /> {name}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!cNome.trim() || saveCat.isPending} onClick={() => saveCat.mutate()}>
              {saveCat.isPending ? "Salvando..." : editingCat ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Questoes manager */}
      {managingAlbum && (
        <QuestoesManagerDialog
          album={managingAlbum}
          onClose={() => setManagingAlbum(null)}
        />
      )}
    </div>
  );
}

function QuestoesManagerDialog({ album, onClose }: { album: Album; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: turmaQuestoes = [] } = useQuery({
    queryKey: ["admin-turma-questoes", album.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas_questoes")
        .select("id, ordem, liberado_em, question_id, question:weekly_questions(id, public_id, title, discipline)")
        .eq("album_id", album.id)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TurmaQuestao[];
    },
  });

  const existingIds = new Set(turmaQuestoes.map((q) => q.question_id));

  const { data: usedQuestionIds = [] } = useQuery({
    queryKey: ["admin-turmas-questoes-usadas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas_questoes")
        .select("question_id");
      if (error) throw error;
      return (data || []).map((d: any) => d.question_id as string);
    },
  });

  const usedSet = new Set(usedQuestionIds);

  const { data: availableQuestions = [] } = useQuery({
    queryKey: ["admin-available-questoes", search],
    queryFn: async () => {
      const term = search.trim();
      // Detecta busca por ID público: "Q224", "Q-224", "224"
      const idMatch = term.match(/^Q?-?\s*(\d+)$/i);
      let q = supabase
        .from("weekly_questions")
        .select("id, public_id, title, discipline")
        .eq("is_weekly", false)
        .order("created_at", { ascending: false })
        .limit(200);
      if (idMatch) {
        q = q.eq("public_id", parseInt(idMatch[1], 10));
      } else if (term) {
        q = q.ilike("title", `%${term}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Questao[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const nextOrdem = (turmaQuestoes[turmaQuestoes.length - 1]?.ordem || 0) + 1;
      const { error } = await supabase.from("turmas_questoes").insert({
        album_id: album.id,
        question_id: questionId,
        ordem: nextOrdem,
        liberado_em: new Date().toISOString(),
      });
      if (error) throw error;
      // Vincula a questão ao álbum para removê-la do banco geral de discursivas
      const { error: updErr } = await supabase
        .from("weekly_questions")
        .update({ album_id: album.id })
        .eq("id", questionId);
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-turma-questoes", album.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-turmas-questoes-usadas"] });
      queryClient.invalidateQueries({ queryKey: ["discursivas-questions"] });
      toast.success("Questão adicionada.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Recupera question_id antes de deletar para liberar a questão de volta ao banco geral
      const { data: tq } = await supabase
        .from("turmas_questoes")
        .select("question_id")
        .eq("id", id)
        .maybeSingle();
      const { error } = await supabase.from("turmas_questoes").delete().eq("id", id);
      if (error) throw error;
      if (tq?.question_id) {
        await supabase
          .from("weekly_questions")
          .update({ album_id: null })
          .eq("id", tq.question_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-turma-questoes", album.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-turmas-questoes-usadas"] });
      queryClient.invalidateQueries({ queryKey: ["discursivas-questions"] });
      toast.success("Removida.");
    },
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Questões — {album.titulo}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs uppercase text-muted-foreground mb-2 font-semibold">Na turma ({turmaQuestoes.length})</h3>
            <div className="space-y-1 max-h-[55vh] overflow-y-auto">
              {turmaQuestoes.map((tq) => (
                <div key={tq.id} className="flex items-center gap-2 p-2 rounded bg-secondary/40 border border-border/50">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold w-6">{tq.ordem}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{tq.question?.title || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {tq.question?.discipline}
                      {tq.question?.public_id != null && <> · Q-{String(tq.question.public_id).padStart(3, "0")}</>}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMutation.mutate(tq.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {turmaQuestoes.length === 0 && <p className="text-xs text-muted-foreground p-3 text-center">Nenhuma questão ainda.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase text-muted-foreground mb-2 font-semibold">Disponíveis</h3>
            <Input placeholder="Buscar por título..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {availableQuestions.filter((q) => !existingIds.has(q.id) && !usedSet.has(q.id)).map((q) => (
                <div key={q.id} className="flex items-center gap-2 p-2 rounded bg-secondary/40 border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{q.title}</p>
                    <p className="text-[10px] text-muted-foreground">Q-{String(q.public_id).padStart(3, "0")} · {q.discipline}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addMutation.mutate(q.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
