import type { VmFiltroCargo, VmFiltroStatus } from "@/types/vademecum";
import { CARGO_ICON, CARGO_LABEL } from "@/types/vademecum";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Props {
  status: VmFiltroStatus;
  setStatus: (s: VmFiltroStatus) => void;
  cargo: VmFiltroCargo;
  setCargo: (c: VmFiltroCargo) => void;
}

const STATUS_TABS: { id: VmFiltroStatus; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "lidos", label: "Lidos" },
  { id: "nao_lidos", label: "Não lidos" },
  { id: "marcados", label: "Marcados" },
];

export function ArticleFilters({ status, setStatus, cargo, setCargo }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
      <div className="flex gap-1 rounded-md border border-border bg-card p-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatus(t.id)}
            className={cn(
              "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
              status === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Select value={cargo} onValueChange={(v) => setCargo(v as VmFiltroCargo)}>
        <SelectTrigger className="h-9 w-[200px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os cargos</SelectItem>
          {(["magistratura", "defensoria", "mp", "delegado"] as const).map((c) => (
            <SelectItem key={c} value={c}>
              {CARGO_ICON[c]} {CARGO_LABEL[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button size="sm" variant="outline" onClick={() => navigate("/cadernos")} className="ml-auto">
        <BookOpen className="mr-1 h-4 w-4" /> Meus cadernos
      </Button>
    </div>
  );
}
