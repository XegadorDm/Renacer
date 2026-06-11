'use client';
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

async function updateSyncFields(
  firestore: Firestore, caseId: string, state: SyncState,
  extra?: { error?: string; attempts?: number }
): Promise<void> {
  const docRef = doc(firestore, 'cases', caseId);
  const update: Record<string, any> = { syncStatus: state, lastSyncAt: serverTimestamp() };
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
  await updateDoc(docRef, update);
}

export async function syncCase(
  firestore: Firestore, caseId: string, data: Partial<Case>, currentAttempts = 0
): Promise<SyncResult> {
  const attempts = currentAttempts + 1;
  try { 
    await updateSyncFields(firestore, caseId, 'syncing', { attempts }); 
  } catch (e) {
    // Ignorar error de actualización de estado temporal
  }
  
  try {
    const docRef = doc(firestore, 'cases', caseId);
    // Realizar la escritura principal
    await setDoc(docRef, { 
      ...data, 
      syncStatus: 'synced', 
      syncError: false, 
      lastSyncError: null, 
      syncAttempts: attempts, 
      lastSyncAt: serverTimestamp() 
    }, { merge: true });
    
    return { caseId, success: true, attempts, syncedAt: new Date() };
  } catch (err: any) {
    const errorMsg = err?.message || 'Error desconocido';
    try { 
      await updateSyncFields(firestore, caseId, 'error', { error: errorMsg, attempts }); 
    } catch (e) {
      console.error("No se pudo actualizar el estado de error en Firestore:", e);
    }
    return { caseId, success: false, error: errorMsg, attempts };
  }
}

export async function retrySyncCase(
  firestore: Firestore,
  caseItem: Partial<Case> & { id: string; syncAttempts?: number }
): Promise<SyncResult> {
  const { id, syncAttempts = 0, ...data } = caseItem;
  if (syncAttempts >= 5) { // Aumentado a 5 reintentos según política de flexibilidad
    return { 
      caseId: id, 
      success: false, 
      error: 'Máximo de reintentos alcanzado. Contactar soporte.', 
      attempts: syncAttempts 
    };
  }
  // Pequeña espera artificial para asegurar que la UI respire
  await new Promise(resolve => setTimeout(resolve, 1000));
  return syncCase(firestore, id, data, syncAttempts);
}

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
