import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/lib/api/types";
import { statusVariant } from "@/lib/api/format";

export function StatusBadge({
  status,
  className,
}: {
  status: ServiceStatus | string;
  className?: string;
}) {
  const v = statusVariant[status as ServiceStatus];
  const fallback = { label: status, tone: "bg-muted text-muted-foreground" };
  const { label, tone } = v ?? fallback;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
