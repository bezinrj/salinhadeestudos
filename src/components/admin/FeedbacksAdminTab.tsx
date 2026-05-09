import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Feedback {
  id: string;
  nome: string;
  cargo: string;
  texto: string;
  estrelas: number;
  publico: boolean;
  aprovado: boolean;
  exibir_carrossel: boolean;
  avatar_url: string | null;
  created_at: string;
}

export default function FeedbacksAdminTab() {
  const qc = useQueryClient();

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["admin-feedbacks"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Feedback[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Feedback> }) => {
      const { error } = await (supabase as any).from("feedbacks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feedbacks"] }),
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("feedbacks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Feedback excluído" });
      qc.invalidateQueries({ queryKey: ["admin-feedbacks"] });
    },
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Carregando...</p>;

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Aprove feedbacks e selecione quais aparecerão no carrossel da página inicial.
      </div>

      {feedbacks.length === 0 && (
        <Card className="gradient-card border-border">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhum feedback recebido ainda.
          </CardContent>
        </Card>
      )}

      {feedbacks.map((f) => (
        <Card key={f.id} className="gradient-card border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{f.nome}</p>
                  <span className="text-xs text-muted-foreground">— {f.cargo}</span>
                  {!f.publico && <Badge variant="outline" className="text-[10px]">Privado</Badge>}
                  {f.aprovado && <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">Aprovado</Badge>}
                  {f.exibir_carrossel && <Badge className="text-[10px] bg-gold/20 text-gold border-gold/30">No carrossel</Badge>}
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={cn("h-3.5 w-3.5", n <= f.estrelas ? "fill-gold text-gold" : "text-muted-foreground")} />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap">{f.texto}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(f.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteMutation.mutate(f.id)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
              <label className="flex items-center justify-between gap-2 rounded-md bg-secondary/40 px-3 py-2 text-sm">
                <span>Aprovado</span>
                <Switch
                  checked={f.aprovado}
                  onCheckedChange={(v) => updateMutation.mutate({ id: f.id, patch: { aprovado: v, ...(v ? {} : { exibir_carrossel: false }) } })}
                />
              </label>
              <label className="flex items-center justify-between gap-2 rounded-md bg-secondary/40 px-3 py-2 text-sm">
                <span>Exibir no carrossel</span>
                <Switch
                  checked={f.exibir_carrossel}
                  disabled={!f.aprovado || !f.publico}
                  onCheckedChange={(v) => updateMutation.mutate({ id: f.id, patch: { exibir_carrossel: v } })}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
