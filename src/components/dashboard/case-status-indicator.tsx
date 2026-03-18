import { cn } from "@/lib/utils";

/**
 * Componente que muestra el estado del caso.
 * Refleja visualmente el resultado de la llamada de forma local.
 */
export function CaseStatusIndicator({ status }: { status?: string }) {
  let colorClass = "bg-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.5)]";
  let label = "Sin novedad";

  if (status === "CONTACTADO") {
    colorClass = "bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.5)]";
    label = "Contactado";
  } else if (status === "NO CONTACTADO") {
    colorClass = "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]";
    label = "No contactado";
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border shadow-sm w-fit min-w-[150px] justify-center hover:scale-105 transition-transform duration-200 cursor-default">
      <span className={cn("h-3 w-3 rounded-full animate-pulse", colorClass)} />
      <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/90 leading-none text-center">
        {label}
      </span>
    </div>
  );
}
