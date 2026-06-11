'use client';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Case } from '@/lib/case-schema';
import { useSyncEngine } from '@/hooks/use-sync-engine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CloudUpload, AlertCircle, CheckCircle2, RefreshCw, Wifi, WifiOff, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type WithId<T> = T & { id: string };

function SyncCaseRow({ c, onRetry, isRetrying }: { c: WithId<Case>; onRetry: (c: WithId<Case>) => void; isRetrying: boolean; }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3 bg-card hover:border-primary/20 transition-colors shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase truncate text-foreground">{c.firstName} {c.lastName}</p>
        <p className="text-[10px] font-mono text-muted-foreground">{c.caseNumber}</p>
        <div className="mt-1 space-y-0.5">
          {(c.syncAttempts ?? 0) > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Intentos fallidos: <span className="font-bold text-red-600">{c.syncAttempts}</span>
            </p>
          )}
          {c.lastSyncAt && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              Último: {c.lastSyncAt?.toDate ? format(c.lastSyncAt.toDate(), 'dd/MM/yy HH:mm', { locale: es }) : 'N/A'}
            </p>
          )}
          {c.lastSyncError && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-[10px] text-red-500 truncate cursor-help flex items-center gap-1">
                    <AlertCircle className="h-2.5 w-2.5" /> {c.lastSyncError}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-destructive text-destructive-foreground">
                  <p className="text-xs">{c.lastSyncError}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      {(c.syncStatus === 'error' || c.syncError) && (
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 px-2 text-[10px] shrink-0 border-red-200 text-red-600 hover:bg-red-50" 
          disabled={isRetrying} 
          onClick={() => onRetry(c)}
        >
          {isRetrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3 mr-1" />Reintentar</>}
        </Button>
      )}
    </div>
  );
}

export function SyncStatusPanel() {
  const firestore = useFirestore();
  const { isOnline, isSyncing, lastSyncAt, syncAll, retryCase } = useSyncEngine();
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const pendingQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'cases'), where('syncStatus', '==', 'pending')) : null, 
    [firestore]
  );
  
  const errorQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'cases'), where('syncStatus', '==', 'error')) : null, 
    [firestore]
  );

  const { data: pendingCases } = useCollection<Case>(pendingQuery);
  const { data: errorCases } = useCollection<Case>(errorQuery);

  const pendingCount = pendingCases?.length || 0;
  const errorCount = errorCases?.length || 0;
  const totalSyncIssues = pendingCount + errorCount;

  const handleRetry = async (c: WithId<Case>) => {
    setRetryingIds(prev => new Set(prev).add(c.id));
    try { 
      await retryCase(c); 
    } finally { 
      setRetryingIds(prev => { 
        const n = new Set(prev); 
        n.delete(c.id); 
        return n; 
      }); 
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 gap-2 px-2 hover:bg-muted">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600 animate-pulse" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline-block">
            {isOnline ? 'En línea' : 'Offline'}
          </span>
          {isSyncing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          {totalSyncIssues > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white shadow-sm",
              errorCount > 0 ? "bg-red-600" : "bg-orange-500"
            )}>
              {totalSyncIssues}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] flex flex-col p-0 border-l-primary/10">
        <SheetHeader className="p-6 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <RefreshCw className={cn("h-4 w-4 text-primary", isSyncing && "animate-spin")} />
              Motor de Sincronización
            </SheetTitle>
            <Badge variant={isOnline ? "default" : "destructive"} className="text-[10px] h-5 uppercase font-black">
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          <SheetDescription className="text-xs italic">
            Gestión de persistencia para zonas con conectividad limitada.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 flex flex-col flex-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl border bg-orange-50/30 p-4 text-center border-orange-200">
              <p className="text-3xl font-black text-orange-600">{pendingCount}</p>
              <p className="text-[9px] text-orange-700 font-bold uppercase tracking-widest">Pendientes</p>
            </div>
            <div className="rounded-xl border bg-red-50/30 p-4 text-center border-red-200">
              <p className="text-3xl font-black text-red-600">{errorCount}</p>
              <p className="text-[9px] text-red-700 font-bold uppercase tracking-widest">Errores</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <Button 
              size="lg" 
              className="w-full font-black text-xs h-12 shadow-lg" 
              disabled={!isOnline || isSyncing} 
              onClick={syncAll}
            >
              {isSyncing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />SINCRONIZANDO...</>
              ) : (
                <><CloudUpload className="mr-2 h-4 w-4" />SINCRONIZAR COLA AHORA</>
              )}
            </Button>
            
            {lastSyncAt && (
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-medium">
                <Clock className="h-3 w-3" />
                Sincronización manual: {format(lastSyncAt, "d 'de' MMM, HH:mm:ss", { locale: es })}
              </div>
            )}
          </div>

          <Tabs defaultValue="pending" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="pending" className="flex-1 text-[10px] font-bold uppercase tracking-tighter">
                Pendientes {pendingCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[8px]">{pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="errors" className="flex-1 text-[10px] font-bold uppercase tracking-tighter">
                Fallas {errorCount > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[8px]">{errorCount}</Badge>}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
              {pendingCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 text-green-200 mb-3" />
                  <p className="text-xs font-bold uppercase opacity-50">Cola despejada</p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {(pendingCases as WithId<Case>[])?.map(c => (
                    <SyncCaseRow key={c.id} c={c} onRetry={handleRetry} isRetrying={retryingIds.has(c.id)} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="errors" className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
              {errorCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 text-green-200 mb-3" />
                  <p className="text-xs font-bold uppercase opacity-50">Sin fallas críticas</p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {(errorCases as WithId<Case>[])?.map(c => (
                    <SyncCaseRow key={c.id} c={c} onRetry={handleRetry} isRetrying={retryingIds.has(c.id)} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
