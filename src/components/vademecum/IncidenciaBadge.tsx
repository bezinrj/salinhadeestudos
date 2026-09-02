import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { VmCargo } from "@/types/vademecum";
import { CARGO_ICON, CARGO_LABEL } from "@/types/vademecum";
import { cn } from "@/lib/utils";

const CLASSES: Record<VmCargo, string> = {
  magistratura: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  defensoria: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  mp: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  delegado: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export interface IncidenciaOcorrencia {
  /** null = artigo inteiro */
  paragrafoId: string | null;
  label: string;
  trecho?: string;
}

interface Props {
  cargo: VmCargo;
  quantidade: number;
  ocorrencias?: IncidenciaOcorrencia[];
  onNavigate?: (paragrafoId: string | null) => void;
}

export function IncidenciaBadge({ cargo, quantidade, ocorrencias, onNavigate }: Props) {
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        CLASSES[cargo],
      )}
    >
      <span>{CARGO_ICON[cargo]}</span>
      <span>{quantidade}×</span>
    </span>
  );

  if (!ocorrencias || ocorrencias.length === 0) {
    return <span title={`${CARGO_LABEL[cargo]}: ${quantidade}×`}>{badge}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`${CARGO_LABEL[cargo]}: ${quantidade}× — ver onde está marcado`}
          className="rounded-md transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {badge}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-72 w-72 overflow-y-auto p-1">
        <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {CARGO_LABEL[cargo]} · {ocorrencias.length} marcação{ocorrencias.length > 1 ? "ões" : ""}
        </p>
        {ocorrencias.map((o) => (
          <button
            key={o.paragrafoId ?? "artigo"}
            type="button"
            onClick={() => onNavigate?.(o.paragrafoId)}
            className="flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-left hover:bg-accent"
          >
            <span className="text-sm font-medium text-foreground">{o.label}</span>
            {o.trecho && (
              <span className="line-clamp-2 text-[11px] text-muted-foreground">{o.trecho}</span>
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export const CARGO_BORDER: Record<VmCargo, string> = {
  magistratura: "border-l-amber-500",
  defensoria: "border-l-sky-500",
  mp: "border-l-emerald-500",
  delegado: "border-l-rose-500",
};
