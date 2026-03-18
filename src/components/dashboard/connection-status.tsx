'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente que muestra visualmente si el usuario tiene conexión a internet.
 * Crucial para la confianza del trabajador social en zonas rurales.
 */
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Inicializar estado
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Badge 
      variant={isOnline ? "outline" : "secondary"}
      className={cn(
        "flex items-center gap-2 px-3 py-1 transition-all duration-500 border",
        isOnline 
          ? "border-green-500/30 text-green-600 bg-green-50" 
          : "border-orange-500/30 text-orange-600 bg-orange-50 animate-pulse"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span className="text-[10px] font-bold uppercase tracking-tight">En Línea</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Modo Offline</span>
        </>
      )}
    </Badge>
  );
}
