'use client';
/**
 * @fileOverview Hook reactivo para gestionar el estado de sincronización y red.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { syncCase, retrySyncCase, syncPendingCases, type SyncResult } from '@/lib/sync-engine';
import type { Case } from '@/lib/case-schema';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface SyncEngineState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingCount: number;
  errorCount: number;
  lastResults: SyncResult[];
}

export interface SyncEngineActions {
  saveCase: (caseId: string, data: Partial<Case>) => Promise<SyncResult>;
  retryCase: (caseItem: Partial<Case> & { id: string; syncAttempts?: number }) => Promise<SyncResult>;
  syncAll: () => Promise<void>;
}

export function useSyncEngine(): SyncEngineState & SyncEngineActions {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastResults, setLastResults] = useState<SyncResult[]>([]);
  const syncInProgress = useRef(false);

  /**
   * Dispara la sincronización automática de la cola.
   */
  const triggerAutoSync = useCallback(async () => {
    if (!firestore || syncInProgress.current || !navigator.onLine) return;
    
    syncInProgress.current = true;
    setIsSyncing(true);
    
    try {
      const { synced, failed, results } = await syncPendingCases(firestore);
      setLastResults(results);
      setLastSyncAt(new Date());
      setPendingCount(0);
      setErrorCount(failed);
      
      if (synced > 0) {
        toast({ 
          title: `✅ ${synced} caso(s) sincronizado(s)`, 
          description: failed > 0 ? `${failed} con error persistente.` : 'Todos los datos están en la nube.' 
        });
      }
      if (failed > 0 && synced === 0) {
        toast({ 
          title: `⚠️ ${failed} caso(s) requieren atención`, 
          description: 'Revisa el panel de sincronización para más detalles.', 
          variant: 'destructive' 
        });
      }
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [firestore, toast]);

  /**
   * Listeners de estado de conexión.
   */
  useEffect(() => {
    const onOnline = () => { 
      setIsOnline(true); 
      toast({ 
        title: '🟢 Conexión restaurada', 
        description: 'Sincronizando registros pendientes con el servidor...' 
      }); 
      triggerAutoSync(); 
    };
    
    const onOffline = () => { 
      setIsOnline(false); 
      toast({ 
        title: '🔴 Modo sin conexión', 
        description: 'Los cambios se guardarán localmente hasta recuperar señal.', 
        variant: 'destructive' 
      }); 
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [triggerAutoSync, toast]);

  /**
   * Guarda un caso gestionando el estado de red.
   */
  const saveCase = useCallback(async (caseId: string, data: Partial<Case>): Promise<SyncResult> => {
    if (!firestore) return { caseId, success: false, error: 'Servicio no disponible', attempts: 0 };

    if (!navigator.onLine) {
      // Offline: usar setDocumentNonBlocking para no bloquear la UI
      try {
        const { setDocumentNonBlocking } = await import('@/firebase');
        const docRef = doc(firestore, 'cases', caseId);
        setDocumentNonBlocking(docRef, {
          ...data,
          syncStatus: 'pending',
          syncError: false,
          syncAttempts: 0,
          lastSyncError: null,
          lastSyncAt: null,
        }, { merge: true });
        // No usamos await — Firestore lo guarda en caché local inmediatamente
        setPendingCount(p => p + 1);
        return { caseId, success: true, attempts: 0 };
      } catch (err: any) {
        return { caseId, success: false, error: err.message, attempts: 0 };
      }
    }

    // Online: guardar directo con setDoc, sin pasar por updateSyncFields intermedio
    try {
      const docRef = doc(firestore, 'cases', caseId);
      await setDoc(docRef, {
        ...data,
        syncStatus: 'synced',
        syncError: false,
        lastSyncError: null,
        syncAttempts: 1,
        lastSyncAt: serverTimestamp(),
      }, { merge: true });
      setLastSyncAt(new Date());
      return { caseId, success: true, attempts: 1, syncedAt: new Date() };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error desconocido';
      try {
        const docRef = doc(firestore, 'cases', caseId);
        await setDoc(docRef, {
          syncStatus: 'error',
          syncError: true,
          lastSyncError: errorMsg,
          syncAttempts: 1,
          lastSyncAt: serverTimestamp(),
        }, { merge: true });
      } catch {}
      setErrorCount(p => p + 1);
      toast({ title: '❌ Error al guardar', description: errorMsg, variant: 'destructive' });
      return { caseId, success: false, error: errorMsg, attempts: 1 };
    }
  }, [firestore, toast]);

  /**
   * Reintenta manualmente la sincronización de un caso fallido.
   */
  const retryCase = useCallback(async (caseItem: Partial<Case> & { id: string; syncAttempts?: number }): Promise<SyncResult> => {
    if (!firestore) return { caseId: caseItem.id, success: false, error: 'Servicio no disponible', attempts: 0 };
    
    toast({ 
      title: '🔄 Reintentando...', 
      description: `Sincronizando caso ${(caseItem as any).caseNumber || caseItem.id}` 
    });
    
    const result = await retrySyncCase(firestore, caseItem);
    
    if (result.success) {
      setErrorCount(p => Math.max(0, p - 1));
      setLastSyncAt(result.syncedAt || new Date());
      toast({ title: '✅ Sincronización completada exitosamente' });
    } else {
      toast({ 
        title: '❌ Reintento fallido', 
        description: result.error, 
        variant: 'destructive' 
      });
    }
    
    setLastResults(prev => {
      const idx = prev.findIndex(r => r.caseId === result.caseId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = result;
        return updated;
      }
      return [...prev, result];
    });
    
    return result;
  }, [firestore, toast]);

  return { 
    isOnline, 
    isSyncing, 
    lastSyncAt, 
    pendingCount, 
    errorCount, 
    lastResults, 
    saveCase, 
    retryCase, 
    syncAll: triggerAutoSync 
  };
}
