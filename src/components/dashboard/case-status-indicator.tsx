import { cn } from "@/lib/utils";

/**
 * Componente que muestra el estado del caso.
 * Por petición del usuario, ahora todos los estados se visualizan como "Sin novedad".
 */
export function CaseStatusIndicator({ status }: { status?: string }) {
  // Siempre mostramos el estilo de "Sin novedad"
  const colorClass = "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]";

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border shadow-sm w-fit min-w-[150px] justify-center hover:scale-105 transition-transform duration-200 cursor-default">
      <span className={cn("h-3 w-3 rounded-full animate-pulse", colorClass)} />
      <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/90 leading-none text-center">
        Sin novedad
      </span>
    </div>
  );
}
