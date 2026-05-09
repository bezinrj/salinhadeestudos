import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Config {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
}

export default function SiteConfigTab() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data = [], isLoading } = useQuery({
    queryKey: ["site-config"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("configuracoes_site")
        .select("*")
        .order("chave");
      if (error) throw error;
      return data as Config[];
    },
  });

  useEffect(() => {
    const init: Record<string, string> = {};
    data.forEach((c) => (init[c.chave] = c.valor));
    setValues(init);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (chave: string) => {
      const { error } = await (supabase as any)
        .from("configuracoes_site")
        .update({ valor: values[chave], updated_at: new Date().toISOString() })
        .eq("chave", chave);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Configuração atualizada" });
      qc.invalidateQueries({ queryKey: ["site-config"] });
      qc.invalidateQueries({ queryKey: ["sidebar-social-links"] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Carregando...</p>;

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Edite os links sociais que aparecem no menu lateral.
      </div>
      {data.map((c) => (
        <Card key={c.id} className="gradient-card border-border">
          <CardContent className="p-4 space-y-2">
            <Label className="capitalize">{c.descricao || c.chave}</Label>
            <div className="flex gap-2">
              <Input
                value={values[c.chave] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [c.chave]: e.target.value }))}
                placeholder="https://..."
              />
              <Button onClick={() => saveMutation.mutate(c.chave)} disabled={saveMutation.isPending}>
                Salvar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Chave: {c.chave}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
