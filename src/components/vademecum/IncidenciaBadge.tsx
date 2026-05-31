import type { VmCargo } from "@/types/vademecum";
import { CARGO_ICON, CARGO_LABEL } from "@/types/vademecum";
import { cn } from "@/lib/utils";

const CLASSES: Record<VmCargo, string> = {
  magistratura: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  defensoria: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  mp: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  delegado: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function IncidenciaBadge({ cargo, quantidade }: { cargo: VmCargo; quantidade: number }) {
  return (
    <span
      title={`${CARGO_LABEL[cargo]}: ${quantidade}×`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        CLASSES[cargo],
      )}
    >
      <span>{CARGO_ICON[cargo]}</span>
      <span>{quantidade}×</span>
    </span>
  );
}

export const CARGO_BORDER: Record<VmCargo, string> = {
  magistratura: "border-l-amber-500",
  defensoria: "border-l-sky-500",
  mp: "border-l-emerald-500",
  delegado: "border-l-rose-500",
};
