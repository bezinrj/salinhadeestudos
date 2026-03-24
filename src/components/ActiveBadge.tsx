import { getBadgeIconById } from "@/hooks/useBadges";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { badges as badgeDefinitions } from "@/data/mockData";

interface ActiveBadgeProps {
  badgeId: string | null | undefined;
  size?: "sm" | "md";
}

export function ActiveBadge({ badgeId, size = "sm" }: ActiveBadgeProps) {
  const icon = getBadgeIconById(badgeId);
  if (!icon) return null;

  const badge = badgeDefinitions.find(b => b.id === badgeId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={size === "sm" ? "text-sm" : "text-base"} title={badge?.name}>
          {icon}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs font-medium">{badge?.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}
