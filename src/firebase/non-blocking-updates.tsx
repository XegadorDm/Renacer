'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Realiza un setDoc capturando errores para trazabilidad REQ-006.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    // Trazabilidad visual de error REQ-006
    updateDoc(docRef, {
      syncStatus: 'error',
      syncError: true,
      syncAttempts: (data.syncAttempts || 0) + 1,
      lastSyncError: error.message || "Error desconocido",
      lastSyncAt: new Date().toISOString()
    }).catch(() => {}); // Ignorar fallo en la escritura del log de error

    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: data,
      })
    );
    console.error("Firestore Set Error:", error);
  });
}

/**
 * Realiza un addDoc limpio.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  return addDoc(colRef, data).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      );
      console.error("Firestore Add Error:", error);
    });
}

/**
 * Realiza un updateDoc con trazabilidad de error REQ-006.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data).catch(error => {
      // Trazabilidad visual de error REQ-006
      updateDoc(docRef, {
        syncStatus: 'error',
        syncError: true,
        syncAttempts: (data.syncAttempts || 0) + 1,
        lastSyncError: error.message || "Error desconocido",
        lastSyncAt: new Date().toISOString()
      }).catch(() => {});

      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      );
      console.error("Firestore Update Error:", error);
    });
}

/**
 * Realiza un deleteDoc limpio.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      );
      console.error("Firestore Delete Error:", error);
    });
}
