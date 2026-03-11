import { CaseStatus } from "@/lib/case-schema";
import { cn } from "@/lib/utils";

const statusColors: Record<CaseStatus, string> = {
  "Sin novedad": "bg-slate-400",
  "Respuesta de gobierno en curso": "bg-slate-400",
  "Proceso finalizado con exito": "bg-slate-400",
};

export function CaseStatusIndicator({ status }: { status: CaseStatus }) {
  const colorClass = status in statusColors ? statusColors[status] : "bg-slate-400";

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border shadow-sm w-fit min-w-[150px] justify-center">
      <span className={cn("h-3 w-3 rounded-full shadow-inner", colorClass)} />
      <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/90 leading-none">
        {status}
      </span>
    </div>
  );
}