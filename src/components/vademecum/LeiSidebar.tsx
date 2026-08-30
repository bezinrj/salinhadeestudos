import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, Scale, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { VmLei } from "@/types/vademecum";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const sb = supabase as any;

interface Props {
  leis: VmLei[];
  activeLeiId?: string;
  countByLei?: Map<string, number>;
  canReorder?: boolean;
  onReordered?: () => void;
}

function SortableLeiItem({ lei, active, countByLei }: {
  lei: VmLei;
  active: boolean;
  countByLei?: Map<string, number>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lei.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : undefined };

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-center">
        <button
          {...attributes}
          {...listeners}
          className="mr-0.5 flex-shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          title="Arrastar para reordenar"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <NavLink
          to={`/vademecum/${lei.id}`}
          className={cn(
            "block flex-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
            active && "bg-primary/15 text-primary",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="truncate font-medium">{lei.sigla}</span>
            {countByLei?.has(lei.id) && (
              <span className="text-[10px] text-muted-foreground">{countByLei.get(lei.id)}</span>
            )}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">{lei.nome}</div>
        </NavLink>
      </div>
    </li>
  );
}

export function LeiSidebar({ leis, activeLeiId, countByLei, canReorder = false, onReordered }: Props) {
  const [q, setQ] = useState("");
  const isSearching = !!q.trim();
  const reorderActive = canReorder && !isSearching;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Flat filtered list (used for reorder mode and as base)
  const filtered = useMemo(() => {
    const f = q.trim().toLowerCase();
    return leis.filter(
      (l) => !f || l.nome.toLowerCase().includes(f) || l.sigla.toLowerCase().includes(f),
    );
  }, [leis, q]);

  // Grouped view (only used in normal mode)
  const grouped = useMemo(() => {
    const map = new Map<string, VmLei[]>();
    filtered.forEach((l) => {
      if (!map.has(l.categoria)) map.set(l.categoria, []);
      map.get(l.categoria)!.push(l);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Local ordered state for optimistic reorder
  const [localOrder, setLocalOrder] = useState<VmLei[] | null>(null);
  const displayList = localOrder ?? filtered;

  // Reset local order when fresh data arrives from the server (leis prop changes)
  // This prevents snap-back: localOrder stays active until the refetch completes
  useEffect(() => {
    setLocalOrder(null);
  }, [leis]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayList.findIndex((l) => l.id === active.id);
    const newIndex = displayList.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(displayList, oldIndex, newIndex);

    // Optimistic update — stays active until leis prop refreshes via useEffect above
    setLocalOrder(reordered);

    // Persist new order to database
    try {
      await Promise.all(
        reordered.map((l, i) => sb.from("vm_leis").update({ ordem: i + 1 }).eq("id", l.id))
      );
      toast.success("Ordem das leis atualizada");
      onReordered?.();
    } catch (e: any) {
      toast.error("Erro ao salvar ordem: " + e.message);
      setLocalOrder(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-4">

        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="font-display text-base font-bold">Vade Mecum</span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setLocalOrder(null); }}
            placeholder="Buscar lei..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>
      <div className="border-b border-border px-2 py-2">
        <NavLink
          to="/vademecum/sumulas"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-secondary",
              isActive && "bg-primary/15 text-primary",
            )
          }
        >
          <Scale className="h-4 w-4" />
          <span>Súmulas</span>
          <span className="ml-auto text-[10px] text-muted-foreground">STJ · STF · SV</span>
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {reorderActive ? (
          /* ── Modo Reordenação: lista plana sem categorias ── */
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayList.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                ⇅ Arraste para reordenar
              </p>
              <ul className="space-y-0.5">
                {displayList.map((l) => (
                  <SortableLeiItem
                    key={l.id}
                    lei={l}
                    active={l.id === activeLeiId}
                    countByLei={countByLei}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          /* ── Modo Normal: agrupado por categoria ── */
          <>
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
          </>
      </nav>
    </div>
  );
}

/** Wrapper desktop: barra lateral fixa (a partir de lg) */
export function LeiSidebar(props: Props) {
  return (
    <aside className="hidden h-full w-[240px] shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
      <LeiListContent {...props} />
    </aside>
  );
}

