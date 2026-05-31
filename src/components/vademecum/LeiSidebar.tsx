import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { VmLei } from "@/types/vademecum";
import { cn } from "@/lib/utils";

interface Props {
  leis: VmLei[];
  activeLeiId?: string;
  countByLei?: Map<string, number>;
}

export function LeiSidebar({ leis, activeLeiId, countByLei }: Props) {
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    const f = q.trim().toLowerCase();
    const filtered = leis.filter(
      (l) => !f || l.nome.toLowerCase().includes(f) || l.sigla.toLowerCase().includes(f),
    );
    const map = new Map<string, VmLei[]>();
    filtered.forEach((l) => {
      if (!map.has(l.categoria)) map.set(l.categoria, []);
      map.get(l.categoria)!.push(l);
    });
    return Array.from(map.entries());
  }, [leis, q]);

  return (
    <aside className="hidden h-full w-[240px] shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="font-display text-base font-bold">Vade Mecum</span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar lei..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {grouped.map(([cat, items]) => (
          <div key={cat} className="mb-4">
            <h4 className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cat}</h4>
            <ul className="space-y-0.5">
              {items.map((l) => {
                const active = l.id === activeLeiId;
                return (
                  <li key={l.id}>
                    <NavLink
                      to={`/vademecum/${l.id}`}
                      className={cn(
                        "block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
                        active && "bg-primary/15 text-primary",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate font-medium">{l.sigla}</span>
                        {countByLei?.has(l.id) && (
                          <span className="text-[10px] text-muted-foreground">{countByLei.get(l.id)}</span>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">{l.nome}</div>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">Nenhuma lei encontrada</p>
        )}
      </nav>
    </aside>
  );
}
