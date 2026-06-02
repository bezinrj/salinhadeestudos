import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, Loader2, Save, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { EMPTY_JULGADO, type JurisJulgado } from "@/types/juris";
import { useJurisMaterias, useJurisAssuntos, useInvalidateTaxonomy } from "@/hooks/useJurisTaxonomy";
import { JurisTaxonomyManager } from "@/components/juris/JurisTaxonomyManager";

type Form = Omit<JurisJulgado, "id" | "created_at" | "updated_at" | "created_by"> & { published: boolean };

export default function JurisAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: la } = useIsAdmin();
  const { isModerator, loading: lm } = useIsModerator();
  const editing = id && id !== "novo";

  const [rawText, setRawText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>({ ...EMPTY_JULGADO, published: false });

  useEffect(() => {
    if (!editing) return;
    (async () => {
      const { data, error } = await supabase.from("juris_julgados" as any).select("*").eq("id", id!).single();
      if (error || !data) { toast.error("Julgado não encontrado"); navigate("/juris"); return; }
      const j = data as unknown as JurisJulgado;
      setForm({ ...j });
    })();
  }, [editing, id, navigate]);

  useEffect(() => {
    if (!la && !lm && !isAdmin && !isModerator) navigate("/juris");
  }, [la, lm, isAdmin, isModerator, navigate]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setNocao = (k: keyof Form["nocoes"], v: string) =>
    setForm((f) => ({ ...f, nocoes: { ...f.nocoes, [k]: v } }));

  async function generate() {
    if (rawText.trim().length < 50) { toast.error("Cole ao menos 50 caracteres."); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("juris-generate", { body: { text: rawText } });
      if (error) throw error;
      if (data?.julgado) {
        setForm((f) => ({ ...f, ...data.julgado, published: f.published }));
        toast.success("Julgado estruturado! Revise e publique.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar.");
    } finally { setGenerating(false); }
  }

  async function save() {
    if (!form.titulo.trim()) { toast.error("Título é obrigatório."); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing) {
        const { error } = await supabase.from("juris_julgados" as any).update(payload).eq("id", id!);
        if (error) throw error;
        toast.success("Atualizado!");
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("juris_julgados" as any)
          .insert({ ...payload, created_by: u.user?.id })
          .select("id").single();
        if (error) throw error;
        toast.success("Julgado criado!");
        navigate(`/juris/${(data as any).id}`);
        return;
      }
      navigate(`/juris/${id}`);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar.");
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!editing || !confirm("Excluir este julgado? Esta ação é irreversível.")) return;
    const { error } = await supabase.from("juris_julgados" as any).delete().eq("id", id!);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído");
    navigate("/juris");
  }

  const TF = ({ k, label, rows = 3 }: { k: keyof Omit<Form, "nocoes" | "published">; label: string; rows?: number }) => (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <Textarea value={(form as any)[k] || ""} onChange={(e) => set(k, e.target.value as any)} rows={rows} />
    </div>
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 pb-24 md:pb-12">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/juris")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        {editing && (
          <Button variant="ghost" size="sm" onClick={remove} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        )}
      </div>

      <h1 className="mb-6 font-display text-2xl font-bold">{editing ? "Editar julgado" : "Novo julgado"}</h1>

      {!editing && (
        <Card className="mb-6 border-primary/30">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> Gerar com IA
            </div>
            <p className="text-xs text-muted-foreground">
              Cole o texto integral do julgado (ementa, acórdão, notícia do informativo). A IA estrutura todos os campos.
            </p>
            <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={8} placeholder="Cole aqui o texto do julgado..." />
            <Button onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Estruturar com IA
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Título</Label><Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} /></div>
            <div><Label className="text-xs">Tribunal</Label><Input value={form.tribunal} onChange={(e) => set("tribunal", e.target.value)} /></div>
            <div><Label className="text-xs">Número</Label><Input value={form.numero} onChange={(e) => set("numero", e.target.value)} /></div>
            <div><Label className="text-xs">Relator</Label><Input value={form.relator} onChange={(e) => set("relator", e.target.value)} /></div>
            <div><Label className="text-xs">Data</Label><Input value={form.data} onChange={(e) => set("data", e.target.value)} /></div>
            <div><Label className="text-xs">Informativo</Label><Input value={form.info} onChange={(e) => set("info", e.target.value)} /></div>
            <MateriasMultiPicker
              values={form.areas?.length ? form.areas : (form.area ? [form.area] : [])}
              onChange={(arr) => setForm((f) => ({ ...f, areas: arr, area: arr[0] || "" }))}
            />
            <AssuntosMultiPicker
              materias={form.areas?.length ? form.areas : (form.area ? [form.area] : [])}
              values={form.assuntos?.length ? form.assuntos : (form.assunto ? [form.assunto] : [])}
              onChange={(arr) => setForm((f) => ({ ...f, assuntos: arr, assunto: arr[0] || "" }))}
            />

          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-3 text-sm font-semibold text-primary">Noções</div>
            <div className="space-y-3">
              <div><Label className="text-xs">Em uma frase</Label><Textarea value={form.nocoes.frase || ""} onChange={(e) => setNocao("frase", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Contexto e impacto</Label><Textarea value={form.nocoes.contexto || ""} onChange={(e) => setNocao("contexto", e.target.value)} rows={3} /></div>
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label className="text-xs">Constitucional / Válido</Label><Textarea value={form.nocoes.ok || ""} onChange={(e) => setNocao("ok", e.target.value)} rows={2} /></div>
                <div><Label className="text-xs">Inconstitucional / Inválido</Label><Textarea value={form.nocoes.ko || ""} onChange={(e) => setNocao("ko", e.target.value)} rows={2} /></div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <TF k="conceitual" label="Parte conceitual" rows={4} />
            <div className="grid gap-3 md:grid-cols-2">
              <TF k="problema" label="O problema" />
              <TF k="solucao" label="A solução" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TF k="antes" label="Antes (um por linha)" rows={4} />
              <TF k="depois" label="Depois (um por linha)" rows={4} />
            </div>

            <div className="rounded-lg border border-border bg-secondary/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-sm font-semibold text-primary">📌 Casos concretos</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => set("casos_concretos", [...(form.casos_concretos || []), { antes: "", depois: "" }])}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar caso
                </Button>
              </div>
              {(form.casos_concretos || []).length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum caso adicionado. Use 2–3 exemplos práticos.</p>
              )}
              <div className="space-y-3">
                {(form.casos_concretos || []).map((c, idx) => (
                  <div key={idx} className="rounded-md border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold">Caso {idx + 1}</span>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => set("casos_concretos", form.casos_concretos.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <Label className="text-[10px] uppercase text-destructive">Antes</Label>
                        <Textarea rows={3} value={c.antes} onChange={(e) => set("casos_concretos", form.casos_concretos.map((x, i) => i === idx ? { ...x, antes: e.target.value } : x))} />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-green-600">Depois</Label>
                        <Textarea rows={3} value={c.depois} onChange={(e) => set("casos_concretos", form.casos_concretos.map((x, i) => i === idx ? { ...x, depois: e.target.value } : x))} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <TF k="conclusoes" label="Conclusões numeradas (uma por linha)" rows={4} />
            <TF k="principios" label="Princípios (NOME — descrição)" rows={3} />
            <TF k="doutrina" label="Doutrina (AUTOR — posição)" rows={3} />
            <TF k="jurisprudencia" label="Jurisprudência (REF — descrição)" rows={3} />
            <TF k="abertura" label="Argumento de abertura" rows={2} />
            <TF k="tese" label="Tese síntese" rows={2} />
            <TF k="integra_texto" label="Íntegra — texto" rows={5} />
            <TF k="integra_ref" label="Íntegra — referência" rows={2} />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} />
              <Label className="text-sm">Publicado</Label>
            </div>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {!editing && (
        <div className="mt-6">
          <JurisTaxonomyManager />
        </div>
      )}
    </div>
  );
}

function MateriaPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: materias = [] } = useJurisMaterias();
  const invalidate = useInvalidateTaxonomy();
  const [adding, setAdding] = useState(false);
  const [novo, setNovo] = useState("");
  const options = useMemo(() => {
    const set = new Set(materias.map((m) => m.nome));
    if (value) set.add(value);
    return Array.from(set).sort();
  }, [materias, value]);

  async function addAndSelect() {
    const nome = novo.trim();
    if (!nome) return;
    const { error } = await supabase.from("juris_materias" as any).insert({ nome });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    invalidate();
    onChange(nome);
    setNovo(""); setAdding(false);
    toast.success("Matéria adicionada");
  }

  return (
    <div>
      <Label className="text-xs">Matéria</Label>
      {adding ? (
        <div className="flex gap-2">
          <Input autoFocus value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nova matéria" onKeyDown={(e) => e.key === "Enter" && addAndSelect()} />
          <Button type="button" size="icon" onClick={addAndSelect}><Plus className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => setAdding(false)}>×</Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Select value={value || undefined} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" size="icon" variant="outline" onClick={() => setAdding(true)} title="Nova matéria"><Plus className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

function AssuntoPicker({ materia, value, onChange }: { materia: string; value: string; onChange: (v: string) => void }) {
  const { data: materias = [] } = useJurisMaterias();
  const { data: assuntos = [] } = useJurisAssuntos();
  const invalidate = useInvalidateTaxonomy();
  const [adding, setAdding] = useState(false);
  const [novo, setNovo] = useState("");

  const materiaId = materias.find((m) => m.nome === materia)?.id;
  const lista = assuntos.filter((a) => a.materia_id === materiaId).map((a) => a.nome);
  const options = useMemo(() => {
    const set = new Set(lista);
    if (value) set.add(value);
    return Array.from(set).sort();
  }, [lista, value]);

  async function addAndSelect() {
    const nome = novo.trim();
    if (!nome) return;
    if (!materiaId) { toast.error("Escolha a matéria primeiro"); return; }
    const { error } = await supabase.from("juris_assuntos" as any).insert({ nome, materia_id: materiaId });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    invalidate();
    onChange(nome);
    setNovo(""); setAdding(false);
    toast.success("Assunto adicionado");
  }

  return (
    <div>
      <Label className="text-xs">Assunto</Label>
      {adding ? (
        <div className="flex gap-2">
          <Input autoFocus value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Novo assunto" onKeyDown={(e) => e.key === "Enter" && addAndSelect()} />
          <Button type="button" size="icon" onClick={addAndSelect}><Plus className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => setAdding(false)}>×</Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Select value={value || undefined} onValueChange={onChange} disabled={!materia}>
            <SelectTrigger><SelectValue placeholder={materia ? "Selecione..." : "Escolha a matéria"} /></SelectTrigger>
            <SelectContent>
              {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" size="icon" variant="outline" onClick={() => setAdding(true)} disabled={!materia} title="Novo assunto"><Plus className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

