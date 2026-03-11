import { CaseStatus } from "@/lib/case-schema";
import { cn } from "@/lib/utils";

const statusColors: Record<CaseStatus, string> = {
  "Sin novedad": "bg-red-500",
  "Respuesta Gobierno en curso": "bg-yellow-500",
  "Proceso finalizado con exito": "bg-green-500",
};

export function CaseStatusIndicator({ status }: { status: CaseStatus }) {
  const colorClass = status in statusColors ? statusColors[status] : "bg-gray-400";

  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-3 w-3 rounded-full shadow-sm", colorClass)} />
      <span className="text-sm font-bold text-foreground">{status}</span>
    </div>
  );
}