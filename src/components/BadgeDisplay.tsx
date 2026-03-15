import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Badge as BadgeType } from "@/data/mockData";
import { useState } from "react";

interface BadgeDisplayProps {
  badges: BadgeType[];
  size?: "sm" | "md";
}

const categoryLabels: Record<string, string> = {
  discursivas: "📝 Discursivas",
  notas: "🎯 Notas",
  ranking: "🏆 Ranking",
  estudo: "📚 Estudo",
  constância: "🔥 Constância",
  semanal: "📅 Semanal",
  evolução: "🚀 Evolução",
  assinatura: "💎 Assinatura",
};

export function BadgeDisplay({ badges, size = "md" }: BadgeDisplayProps) {
  const [filter, setFilter] = useState<string>("all");

  const categories = Array.from(new Set(badges.map(b => b.category || "outros")));
  const filtered = filter === "all" ? badges : badges.filter(b => (b.category || "outros") === filter);
  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">Progresso:</span>
        <span className="font-bold text-primary">{earnedCount}/{badges.length}</span>
        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(earnedCount / badges.length) * 100}%` }} />
        </div>
      </div>

      {/* Category filters */}
      {size === "md" && (
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={cn("cursor-pointer text-[10px] py-0.5", filter === "all" ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground")}
            onClick={() => setFilter("all")}
          >
            Todas
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant="outline"
              className={cn("cursor-pointer text-[10px] py-0.5", filter === cat ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground")}
              onClick={() => setFilter(cat)}
            >
              {categoryLabels[cat] || cat}
            </Badge>
          ))}
        </div>
      )}

      {/* Badges grid */}
      <div className={cn("grid gap-2", size === "md" ? "grid-cols-1 sm:grid-cols-2" : "flex flex-wrap")}>
        {filtered.map((badge) => (
          <div
            key={badge.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
              badge.earned
                ? "border-gold/20 bg-gold/5 hover:bg-gold/10"
                : "border-border bg-muted/30 opacity-50 grayscale"
            )}
          >
            <span className={cn(size === "sm" ? "text-lg" : "text-2xl")}>{badge.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={cn("font-semibold", size === "sm" ? "text-xs" : "text-sm", badge.earned ? "text-foreground" : "text-muted-foreground")}>
                {badge.name}
              </p>
              {size === "md" && (
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              )}
              {badge.earned && badge.earnedAt && size === "md" && (
                <p className="text-[10px] text-gold/70 mt-0.5">Desbloqueada em {badge.earnedAt}</p>
              )}
            </div>
            {badge.earned ? (
              <Badge variant="outline" className="ml-auto border-gold/30 text-gold text-[10px] shrink-0">✓</Badge>
            ) : (
              <span className="text-[10px] text-muted-foreground shrink-0">🔒</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
