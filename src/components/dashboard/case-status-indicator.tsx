
import { CaseStatus } from "@/lib/case-schema";
import { cn } from "@/lib/utils";

const statusColors: Record<CaseStatus, string> = {
  "Sin novedad": "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]",
  "Respuesta de gobierno en curso": "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]",
  "Proceso finalizado con exito": "bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.5)]",
};

export function CaseStatusIndicator({ status }: { status: CaseStatus }) {
  const colorClass = status in statusColors ? statusColors[status] : "bg-slate-400";

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border shadow-sm w-fit min-w-[150px] justify-center hover:scale-105 transition-transform duration-200 cursor-default">
      <span className={cn("h-3 w-3 rounded-full animate-pulse", colorClass)} />
      <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/90 leading-none">
        {status}
      </span>
    </div>
  );
}
