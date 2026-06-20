'use client';
/**
 * @fileOverview Hook reactivo para gestionar el estado de sincronización y red.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { retrySyncCase, SyncResult } from '@/lib/sync-engine';
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
   * Filtra en el cliente para mayor fiabilidad con la caché offline.
   */
  const triggerAutoSync = useCallback(async (source: 'auto' | 'manual' = 'auto') => {
    if (!firestore) return;
    if (!navigator.onLine) return;
    if (syncInProgress.current) {
      console.log('[SyncEngine] Sincronización ya en progreso, ignorando llamada duplicada.');
      return;
    }
    
    syncInProgress.current = true;
    setIsSyncing(true);
    
    // Timeout de seguridad: libera el candado a los 30 segundos máximo
    const safetyTimeout = setTimeout(() => {
      syncInProgress.current = false;
      setIsSyncing(false);
      console.warn('[SyncEngine] Timeout de seguridad activado, liberando candado.');
    }, 30000);
    
    try {
      const { collection, getDocs, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      // Leer TODA la colección y filtrar en cliente (más confiable que where() con caché offline)
      const casesRef = collection(firestore, 'cases');
      const snapshot = await getDocs(casesRef);
      
      const allDocs = snapshot.docs.filter(d => {
        const data = d.data();
        return data.syncStatus === 'pending' || data.syncStatus === 'error';
      });
      
      console.log(`[SyncEngine] Total docs en colección: ${snapshot.docs.length}`);
      console.log(`[SyncEngine] Documentos pendientes/error encontrados: ${allDocs.length}`);
      allDocs.forEach(d => console.log(`[SyncEngine] -> ${d.id}: ${d.data().syncStatus}`));
      
      let synced = 0;
      let failed = 0;
      
      for (const docSnap of allDocs) {
        const data = docSnap.data();
        console.log(`[SyncEngine] Sincronizando ${docSnap.id}...`);
        
        try {
          const docRef = doc(firestore, 'cases', docSnap.id);
          await setDoc(docRef, {
            ...data,
            syncStatus: 'synced',
            syncError: false,
            lastSyncError: null,
            syncAttempts: (data.syncAttempts || 0) + 1,
            lastSyncAt: serverTimestamp(),
            lastSyncType: source,
          }, { merge: true });
          
          console.log(`[SyncEngine] ✅ ${docSnap.id} sincronizado`);
          
          try {
            const logsRef = collection(firestore, 'cases', docSnap.id, 'syncLogs');
            await setDoc(doc(logsRef), {
              timestamp: new Date().toISOString(),
              operation: source === 'auto' ? 'auto_sync' : 'manual_sync',
              syncType: source,
              result: 'success',
              error: null,
              attempt: (data.syncAttempts || 0) + 1,
              online: true,
            }, { merge: false });
          } catch (logErr) {
            console.warn(`[SyncEngine] syncLog falló para ${docSnap.id}:`, logErr);
          }
          
          synced++;
        } catch (err: any) {
          console.error(`[SyncEngine] ❌ Error sincronizando ${docSnap.id}:`, err);
          failed++;
          try {
            const docRef = doc(firestore, 'cases', docSnap.id);
            await setDoc(docRef, {
              syncStatus: 'error',
              syncError: true,
              lastSyncError: err.message || 'Error de sincronización',
              syncAttempts: (data.syncAttempts || 0) + 1,
              lastSyncAt: serverTimestamp(),
              lastSyncType: source,
            }, { merge: true });
          } catch {}
        }
      }
      
      console.log(`[SyncEngine] FIN — exitosos: ${synced}, fallidos: ${failed}`);
      
      setLastSyncAt(new Date());
      setPendingCount(0);
      setErrorCount(failed);
      
      if (synced > 0 || failed > 0) {
        toast({ 
          title: source === 'auto' 
            ? `🔄 Sincronización automática: ${synced} caso(s)` 
            : `✅ Sincronización manual: ${synced} caso(s)`, 
          description: failed > 0 ? `${failed} con error persistente.` : 'Todos los datos están en la nube.' 
        });
      }
    } catch (outerErr) {
      console.error('[SyncEngine] Error general en triggerAutoSync:', outerErr);
    } finally {
      clearTimeout(safetyTimeout);
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
      triggerAutoSync('auto'); 
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
        lastSyncType: 'manual',
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
          lastSyncType: 'manual',
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
    syncAll: () => triggerAutoSync('manual')
  };
}
