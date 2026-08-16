interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  /** Formata o valor exibido. Recebe o valor bruto e o payload do item. */
  valueFormatter?: (value: number, item: any) => string;
  /** Linha secundária opcional (ex: percentual). */
  subFormatter?: (item: any) => string | null;
  /** Rótulo alternativo (por padrão usa `label` do eixo ou o `name` do item). */
  labelKey?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  subFormatter,
  labelKey,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const raw = item?.payload ?? {};
  const title = (labelKey && raw[labelKey]) || label || item?.name || "";
  const color = item?.payload?.cor || item?.color || item?.fill || "hsl(var(--gold))";
  const value = Number(item?.value ?? 0);
  const sub = subFormatter?.(raw);

  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="text-sm font-bold tabular-nums text-foreground">
          {valueFormatter ? valueFormatter(value, raw) : value}
        </span>
        {sub && <span className="text-xs text-muted-foreground tabular-nums">{sub}</span>}
      </div>
    </div>
  );
}

export default ChartTooltip;
