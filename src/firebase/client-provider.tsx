'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore, 
  Firestore 
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Singletons definidos fuera para persistir entre re-renders de Next.js
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

/**
 * Proveedor de Firebase para el cliente.
 * Centraliza la inicialización para evitar el error "INTERNAL ASSERTION FAILED" 
 * causado por conflictos en la configuración del caché persistente.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // 1. Inicializar la App de Firebase (Idempotente)
    if (!appInstance) {
      const existingApps = getApps();
      appInstance = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    }

    // 2. Inicializar el servicio de Autenticación
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }

    // 3. Inicializar Firestore de forma simplificada
    if (!firestoreInstance) {
      try {
        // Se utiliza initializeFirestore con configuración mínima para evitar errores de aserción
        firestoreInstance = initializeFirestore(appInstance, {
          experimentalForceLongPolling: false,
        });
      } catch (e) {
        // Si initializeFirestore falla (ej. ya inicializado por HMR), recuperamos la instancia existente
        firestoreInstance = getFirestore(appInstance);
      }
    }

    return {
      firebaseApp: appInstance,
      auth: authInstance,
      firestore: firestoreInstance,
    };
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
