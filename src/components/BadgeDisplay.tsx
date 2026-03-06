import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Badge as BadgeType } from "@/data/mockData";

interface BadgeDisplayProps {
  badges: BadgeType[];
  size?: "sm" | "md";
}

export function BadgeDisplay({ badges, size = "md" }: BadgeDisplayProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
            badge.earned
              ? "border-gold/20 bg-gold/5 hover:bg-gold/10"
              : "border-border bg-muted/30 opacity-40"
          )}
        >
          <span className={cn(size === "sm" ? "text-lg" : "text-2xl")}>{badge.icon}</span>
          <div>
            <p className={cn("font-semibold", size === "sm" ? "text-xs" : "text-sm", badge.earned ? "text-foreground" : "text-muted-foreground")}>
              {badge.name}
            </p>
            {size === "md" && (
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            )}
          </div>
          {badge.earned && (
            <Badge variant="outline" className="ml-auto border-gold/30 text-gold text-[10px]">
              ✓
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
