import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PLAN_KEYS = [
  { value: "combo", label: "Combo Vade + Juris" },
  { value: "vade", label: "Vade Digital" },
  { value: "juris", label: "Salinha Juris" },
  { value: "pro", label: "Salinha PRO" },
];

export function CouponsTab() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("40");
  const [planKey, setPlanKey] = useState("combo");
  const [maxUses, setMaxUses] = useState("");
  const [notes, setNotes] = useState("");

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("coupons").insert({
        code: code.trim().toUpperCase(),
        percent_off: Number(percentOff),
        plan_key: planKey,
        max_uses: maxUses.trim() ? Number(maxUses) : null,
        notes: notes.trim() || null,
        created_by: userRes.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cupom criado");
      setCode("");
      setNotes("");
      setMaxUses("");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cupom removido");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Ticket className="h-5 w-5 text-gold" /> Novo cupom
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Código</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="DISCORD100"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Desconto (%)</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={percentOff}
              onChange={(e) => setPercentOff(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Plano</Label>
            <Select value={planKey} onValueChange={setPlanKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_KEYS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Usos máximos</Label>
            <Input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="ilimitado"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="2 impulsos Discord" />
          </div>
          <div className="md:col-span-5">
            <Button
              onClick={() => create.mutate()}
              disabled={!code.trim() || create.isPending}
              className="gradient-gold text-accent-foreground"
            >
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar cupom
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Cupons cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cupom cadastrado.</p>
          ) : (
            coupons.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
              >
                <span className="font-mono font-semibold">{c.code}</span>
                <Badge variant="outline" className="text-gold border-gold/40">
                  {c.percent_off}% OFF
                </Badge>
                <Badge variant="secondary">{c.plan_key}</Badge>
                <span className="text-xs text-muted-foreground">
                  {c.used_count} uso(s){c.max_uses ? ` de ${c.max_uses}` : " • ilimitado"}
                </span>
                {c.notes && <span className="text-xs text-muted-foreground">• {c.notes}</span>}
                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: c.id, is_active: v })}
                    />
                    <span className="text-xs text-muted-foreground">
                      {c.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove.mutate(c.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
