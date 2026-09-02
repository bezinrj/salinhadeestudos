import { Tag, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { VmCargo } from "@/types/vademecum";
import { CARGO_ICON, CARGO_LABEL } from "@/types/vademecum";
import { cn } from "@/lib/utils";

const CARGOS: VmCargo[] = ["magistratura", "defensoria", "mp", "delegado"];

interface Props {
  active: VmCargo[];
  onToggle: (cargo: VmCargo, next: boolean) => void;
  label?: string;
  compact?: boolean;
}

export function CargoTagPicker({ active, onToggle, label = "Marcar cargos", compact = false }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={label}
          aria-label={label}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
            compact ? "h-5 w-5 justify-center align-middle" : "px-2 py-0.5 text-[11px]",
          )}
        >
          <Tag className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {!compact && <span>{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Cobrado em provas de
        </p>
        {CARGOS.map((c) => {
          const on = active.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => onToggle(c, !on)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span className="w-4 text-center">{on ? <Check className="h-3.5 w-3.5 text-primary" /> : null}</span>
              <span>{CARGO_ICON[c]}</span>
              <span className="text-foreground">{CARGO_LABEL[c]}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
