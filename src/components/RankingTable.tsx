import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { RankingEntry } from "@/data/mockData";

interface RankingTableProps {
  entries: RankingEntry[];
  currentUserId?: string;
  valueLabel?: string;
  valueFormatter?: (val: number) => string;
}

export function RankingTable({ entries, currentUserId = "u1", valueLabel = "Pontos", valueFormatter }: RankingTableProps) {
  const formatValue = valueFormatter || ((v: number) => v.toLocaleString("pt-BR"));

  const getMedalColor = (pos: number) => {
    if (pos === 1) return "text-gold bg-gold/10 border-gold/30";
    if (pos === 2) return "text-muted-foreground bg-muted/50 border-muted-foreground/30";
    if (pos === 3) return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    return "";
  };

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isCurrentUser = entry.userId === currentUserId;
        const isTop3 = entry.position <= 3;

        return (
          <div
            key={entry.userId}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
              isCurrentUser ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/50",
              isTop3 && !isCurrentUser && "bg-secondary/30"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
              isTop3 ? cn("border", getMedalColor(entry.position)) : "text-muted-foreground"
            )}>
              {entry.position}
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn("text-xs font-semibold", isTop3 ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground")}>
                {entry.avatar}
              </AvatarFallback>
            </Avatar>
            <span className={cn("flex-1 text-sm font-medium", isCurrentUser && "text-primary")}>
              {entry.name}
              {isCurrentUser && <span className="ml-1.5 text-xs text-primary/70">(você)</span>}
            </span>
            <div className="text-right">
              <span className={cn("text-sm font-bold", isTop3 ? "text-foreground" : "text-muted-foreground")}>
                {formatValue(entry.score)}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">{valueLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
