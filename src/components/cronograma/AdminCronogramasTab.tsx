import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, FileEdit, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Cronograma = {
  id: string;
  nome: string;
  categoria: string | null;
  imagem_url: string | null;
  premium: boolean;
};

export default function AdminCronogramasTab() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [premium, setPremium] = useState(false);

  const { data: cronogramas = [], isLoading } = useQuery({
    queryKey: ["admin-cronogramas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cronogramas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Cronograma[];
    },
  });

  const resetForm = () => {
    setNome(""); setCategoria(""); setImagemUrl(""); setPremium(false); setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("cronogramas").update({ nome, categoria, imagem_url: imagemUrl || null, premium }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cronogramas").insert({ nome, categoria, imagem_url: imagemUrl || null, premium });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cronogramas"] });
      queryClient.invalidateQueries({ queryKey: ["cronogramas"] });
      setShowForm(false);
      resetForm();
      toast.success(editingId ? "Cronograma atualizado!" : "Cronograma criado!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cronogramas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cronogramas"] });
      toast.success("Cronograma excluído!");
    },
  });

  const openEdit = (c: Cronograma) => {
    setEditingId(c.id);
    setNome(c.nome);
    setCategoria(c.categoria || "");
    setImagemUrl(c.imagem_url || "");
    setPremium(c.premium);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">Gestão de Cronogramas</h3>
        <Button size="sm" className="gap-1" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" /> Novo
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : cronogramas.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum cronograma cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {cronogramas.map(c => (
            <Card key={c.id} className="border-border/50 bg-card/50">
              <CardContent className="p-3 flex items-center gap-3">
                {c.imagem_url && (
                  <img src={c.imagem_url} alt={c.nome} className="w-12 h-16 object-cover rounded-lg" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {c.categoria && <Badge variant="outline" className="text-[9px]">{c.categoria}</Badge>}
                    {c.premium && <Badge className="bg-accent text-accent-foreground text-[9px] border-0">Premium</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => navigate(`/cronograma/${c.id}`)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(c)}>
                    <FileEdit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => {
                    if (confirm(`Excluir "${c.nome}"?`)) deleteMutation.mutate(c.id);
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cronograma" : "Novo Cronograma"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Ciclo Delegado PCDF" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
              <Input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ex: Delegado" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">URL da imagem de capa</label>
              <Input value={imagemUrl} onChange={e => setImagemUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={premium} onCheckedChange={setPremium} />
              <span className="text-xs text-foreground/80">Premium</span>
            </div>
            <Button className="w-full" disabled={!nome.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
