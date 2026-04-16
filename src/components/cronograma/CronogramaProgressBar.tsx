import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  completed: number;
  total: number;
}

export default function CronogramaProgressBar({ completed, total }: Props) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {completed} de {total} tópicos concluídos ({pct}%)
            </span>
          </div>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%`, transition: "width 0.4s ease" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
