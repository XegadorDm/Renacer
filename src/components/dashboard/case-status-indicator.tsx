import { CaseStatus } from "@/lib/case-schema";
import { cn } from "@/lib/utils";

const statusColors: Record<CaseStatus, string> = {
  "Sin novedad": "bg-red-600",
  "Respuesta de gobierno en curso": "bg-amber-400",
  "Proceso finalizado con éxito": "bg-green-600",
};

export function CaseStatusIndicator({ status }: { status: CaseStatus }) {
  const colorClass = status in statusColors ? statusColors[status] : "bg-slate-400";

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border shadow-sm w-fit min-w-[140px] justify-center">
      <span className={cn("h-2.5 w-2.5 rounded-full shadow-inner animate-pulse", colorClass)} />
      <span className="text-[9px] font-black uppercase tracking-tight text-foreground/90 leading-none">
        {status}
      </span>
    </div>
  );
}
