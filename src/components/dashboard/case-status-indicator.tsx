import type { CaseStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusColors: Record<CaseStatus, string> = {
  "Sin novedad": "bg-green-500",
  "Pendiente de pago": "bg-yellow-500",
  "Pendiente de cobro": "bg-orange-500",
};

export function CaseStatusIndicator({ status }: { status: CaseStatus }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", statusColors[status])} />
      <span className="text-sm text-muted-foreground">{status}</span>
    </div>
  );
}
