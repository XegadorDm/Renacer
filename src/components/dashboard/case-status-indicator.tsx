import { CaseStatus } from "@/lib/case-schema";
import { cn } from "@/lib/utils";

const statusColors: Record<CaseStatus, string> = {
  "Sin novedad": "bg-red-500",
  "Respuesta Gobierno en curso": "bg-yellow-500",
  "Proceso finalizado con exito": "bg-green-500",
};

export function CaseStatusIndicator({ status }: { status: CaseStatus }) {
  // Ensure status exists in statusColors to prevent runtime errors
  const colorClass = status in statusColors ? statusColors[status] : "bg-gray-400";

  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", colorClass)} />
      <span className="text-sm font-medium text-foreground">{status}</span>
    </div>
  );
}
