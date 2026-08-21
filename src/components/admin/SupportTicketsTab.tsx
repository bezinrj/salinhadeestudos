import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Mail, Phone, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STATUSES = ["aberta", "em_andamento", "resolvida"] as const;
const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  resolvida: "Resolvida",
};

export default function SupportTicketsTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("aberta");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: tickets = [] } = useQuery({
    queryKey: ["admin-support-tickets", status],
    queryFn: async () => {
      let q = (supabase as any).from("support_tickets").select("*").order("created_at", { ascending: false }).limit(300);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      const ids = [...new Set((data || []).map((t: any) => t.user_id))];
      if (!ids.length) return data || [];
      const { data: profs } = await supabase.from("profiles").select("id, name, username").in("id", ids as string[]);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      return (data || []).map((t: any) => ({ ...t, profile: map.get(t.user_id) }));
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await (supabase as any).from("support_tickets").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast({ title: "Solicitação atualizada" });
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const subjects = [...new Set(tickets.map((t: any) => t.subject))] as string[];

  const filtered = tickets.filter((t: any) => {
    if (subjectFilter !== "all" && t.subject !== subjectFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.email || "").toLowerCase().includes(q) ||
      (t.message || "").toLowerCase().includes(q) ||
      (t.profile?.name || "").toLowerCase().includes(q) ||
      (t.profile?.username || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Buscar por nome, e-mail ou mensagem..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="aberta">Abertas</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="resolvida">Resolvidas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-60"><SelectValue placeholder="Assunto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os assuntos</SelectItem>
            {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <Card className="gradient-card border-border">
          <CardContent className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <LifeBuoy className="h-6 w-6" /> Nenhuma solicitação encontrada.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((t: any) => {
          const isCancel = t.subject === "Cancelar assinatura";
          return (
            <Card key={t.id} className={cn("gradient-card border-border", isCancel && "border-destructive/40")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isCancel && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      <p className="text-sm font-semibold">{t.subject}</p>
                      <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[t.status] || t.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{t.plan_label || "—"}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">#{String(t.id).slice(0, 8).toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.profile?.name || t.profile?.username || "—"} · {new Date(t.created_at).toLocaleString("pt-BR")}
                    </p>
                    <div className="flex gap-3 flex-wrap mt-1">
                      {t.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{t.email}</span>}
                      {t.whatsapp && <span className="text-xs text-green-400 flex items-center gap-1"><Phone className="h-3 w-3" />{t.whatsapp}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {STATUSES.filter((s) => s !== t.status).map((s) => (
                      <Button key={s} size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => updateTicket.mutate({ id: t.id, patch: { status: s } })}>
                        {STATUS_LABEL[s]}
                      </Button>
                    ))}
                  </div>
                </div>

                <p className="text-sm whitespace-pre-wrap bg-secondary/40 rounded-md p-3">{t.message}</p>
                {t.cancel_reason && <p className="text-xs text-muted-foreground">Motivo informado: <span className="text-foreground">{t.cancel_reason}</span></p>}

                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Anotação interna..."
                    value={notes[t.id] ?? t.internal_note ?? ""}
                    onChange={(e) => setNotes((p) => ({ ...p, [t.id]: e.target.value }))}
                  />
                  <Button size="sm" variant="outline" onClick={() => updateTicket.mutate({ id: t.id, patch: { internal_note: notes[t.id] ?? t.internal_note ?? "" } })}>
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
