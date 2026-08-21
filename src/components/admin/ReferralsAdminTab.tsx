import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Mail, Phone, Users } from "lucide-react";

export default function ReferralsAdminTab() {
  const [search, setSearch] = useState("");

  const { data: referrals = [] } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("referrals")
        .select("id, referrer_id, friend_name, friend_email, friend_whatsapp, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  const { data: profileMap } = useQuery({
    queryKey: ["admin-referrers", referrals.length],
    enabled: referrals.length > 0,
    queryFn: async () => {
      const ids = [...new Set(referrals.map((r: any) => r.referrer_id))];
      const { data } = await supabase.from("profiles").select("id, name, username").in("id", ids);
      const map = new Map<string, string>();
      (data || []).forEach((p: any) => map.set(p.id, p.name || p.username));
      return map;
    },
  });

  const term = search.trim().toLowerCase();
  const filtered = referrals.filter((r: any) =>
    !term ||
    r.friend_name?.toLowerCase().includes(term) ||
    r.friend_email?.toLowerCase().includes(term) ||
    (profileMap?.get(r.referrer_id) || "").toLowerCase().includes(term)
  );

  const uniqueReferrers = new Set(referrals.map((r: any) => r.referrer_id)).size;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="gradient-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Gift className="h-5 w-5 text-gold" />
            <div>
              <p className="text-xl font-display font-bold">{referrals.length}</p>
              <p className="text-xs text-muted-foreground">Indicações enviadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-display font-bold">{uniqueReferrers}</p>
              <p className="text-xs text-muted-foreground">Alunos que indicaram</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Indicações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Buscar por indicado ou por quem indicou..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="space-y-2">
            {filtered.map((r: any) => (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.friend_name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {r.friend_email}</span>
                    {r.friend_whatsapp && (
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {r.friend_whatsapp}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    por {profileMap?.get(r.referrer_id) || "—"}
                  </Badge>
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                    {r.status === "registered" ? "Cadastrado" : "Convidado"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma indicação encontrada.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
