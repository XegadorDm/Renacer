'use server';
/**
 * @fileOverview Motor de sincronización de bajo nivel para Firestore.
 * Gestiona transiciones de estado y persistencia de auditoría de red.
 */

import {
  Firestore, doc, setDoc, updateDoc, collection,
  query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import type { Case } from '@/lib/case-schema';

export type SyncState = 'pending' | 'syncing' | 'synced' | 'error';

export interface SyncResult {
  caseId: string;
  success: boolean;
  error?: string;
  attempts: number;
  syncedAt?: Date;
}

/**
 * Actualiza los campos de auditoría de sincronización en un documento.
 */
async function updateSyncFields(
  firestore: Firestore, caseId: string, state: SyncState,
  extra?: { error?: string; attempts?: number }
): Promise<void> {
  const docRef = doc(firestore, 'cases', caseId);
  const update: Record<string, any> = { 
    syncStatus: state, 
    lastSyncAt: serverTimestamp() 
  };
  
  if (state === 'error' && extra?.error) { 
    update.lastSyncError = extra.error; 
    update.syncError = true; 
  }
  
  if (state === 'synced') { 
    update.syncError = false; 
    update.lastSyncError = null; 
  }
  
  if (extra?.attempts !== undefined) { 
    update.syncAttempts = extra.attempts; 
  }
  
  // Usar setDoc con merge:true en lugar de updateDoc
  // para que funcione tanto en documentos nuevos como existentes
  await setDoc(docRef, update, { merge: true });
}

/**
 * Escribe una entrada en la bitácora histórica de sincronización.
 */
async function writeSyncLog(
  firestore: Firestore,
  caseId: string,
  entry: {
    operation: string;
    result: 'success' | 'error' | 'pending' | 'syncing';
    error?: string | null;
    attempt: number;
    online: boolean;
  }
): Promise<void> {
  try {
    const logsRef = collection(firestore, 'cases', caseId, 'syncLogs');
    await setDoc(doc(logsRef), {
      timestamp: new Date().toISOString(),
      operation: entry.operation,
      result: entry.result,
      error: entry.error || null,
      attempt: entry.attempt,
      online: entry.online,
    }, { merge: false });
  } catch (e) {
    console.warn('syncLog write failed:', e);
  }
}

/**
 * Sincroniza un caso individual con Firestore.
 */
export async function syncCase(
  firestore: Firestore, caseId: string, data: Partial<Case>, currentAttempts = 0
): Promise<SyncResult> {
  const attempts = currentAttempts + 1;
  
  try { 
    await updateSyncFields(firestore, caseId, 'syncing', { attempts });
    await writeSyncLog(firestore, caseId, {
      operation: 'sync_start',
      result: 'syncing',
      attempt: attempts,
      online: true,
    });
  } catch (e) {}
  
  try {
    const docRef = doc(firestore, 'cases', caseId);
    // Realizar la escritura principal con metadatos de éxito
    await setDoc(docRef, { 
      ...data, 
      syncStatus: 'synced', 
      syncError: false, 
      lastSyncError: null, 
      syncAttempts: attempts, 
      lastSyncAt: serverTimestamp() 
    }, { merge: true });

    await writeSyncLog(firestore, caseId, {
      operation: 'sync_complete',
      result: 'success',
      attempt: attempts,
      online: true,
    });
    
    return { caseId, success: true, attempts, syncedAt: new Date() };
  } catch (err: any) {
    const errorMsg = err?.message || 'Error desconocido';
    try { 
      await updateSyncFields(firestore, caseId, 'error', { error: errorMsg, attempts });
      await writeSyncLog(firestore, caseId, {
        operation: 'sync_failed',
        result: 'error',
        error: errorMsg,
        attempt: attempts,
        online: true,
      });
    } catch (e) {}
    return { caseId, success: false, error: errorMsg, attempts };
  }
}

/**
 * Intenta re-sincronizar un caso que falló previamente.
 */
export async function retrySyncCase(
  firestore: Firestore,
  caseItem: Partial<Case> & { id: string; syncAttempts?: number }
): Promise<SyncResult> {
  const { id, syncAttempts = 0, ...data } = caseItem;
  
  // Política de reintentos (límite de 5 según requerimientos de zona rural)
  if (syncAttempts >= 5) {
    await writeSyncLog(firestore, id, {
      operation: 'retry_blocked',
      result: 'error',
      error: 'Máximo de reintentos alcanzado.',
      attempt: syncAttempts,
      online: true,
    }).catch(() => {});
    return { 
      caseId: id, 
      success: false, 
      error: 'Máximo de reintentos alcanzado. Contactar soporte.', 
      attempts: syncAttempts 
    };
  }
  
  await writeSyncLog(firestore, id, {
    operation: 'retry_attempt',
    result: 'syncing',
    attempt: syncAttempts + 1,
    online: true,
  }).catch(() => {});

  // Pausa artificial para evitar saturación de red en reintentos
  await new Promise(resolve => setTimeout(resolve, 2000));
  return syncCase(firestore, id, data, syncAttempts);
}

/**
 * Busca y sincroniza todos los registros pendientes o con error.
 */
export async function syncPendingCases(firestore: Firestore): Promise<{ synced: number; failed: number; results: SyncResult[] }> {
  const results: SyncResult[] = [];
  try {
    const casesRef = collection(firestore, 'cases');
    const q = query(casesRef, where('syncStatus', 'in', ['pending', 'error']));
    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Case;
      results.push(await syncCase(firestore, docSnap.id, data, data.syncAttempts || 0));
    }
  } catch (err) { 
    console.error('syncPendingCases error:', err); 
  }
  return { 
    synced: results.filter(r => r.success).length, 
    failed: results.filter(r => !r.success).length, 
    results 
  };
}
