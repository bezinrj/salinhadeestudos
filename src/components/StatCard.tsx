import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "gold" | "electric" | "purple";
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "border-border",
    gold: "border-gold/30 glow-gold",
    electric: "border-primary/30 glow-electric",
    purple: "border-purple/30",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    gold: "text-gold",
    electric: "text-primary",
    purple: "text-purple",
  };

  return (
    <Card className={cn("gradient-card border transition-all hover:scale-[1.02]", variantStyles[variant])}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-display text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn("rounded-lg bg-secondary p-2.5", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
