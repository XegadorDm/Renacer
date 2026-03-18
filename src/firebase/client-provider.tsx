'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager,
  Firestore 
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Singletons para asegurar que Firebase se inicialice exactamente una vez en el cliente
let appInstance: FirebaseApp;
let authInstance: Auth;
let firestoreInstance: Firestore;

/**
 * Proveedor de Firebase optimizado para Renacer con soporte Offline.
 * Esta implementación garantiza que initializeFirestore() se llame solo una vez,
 * evitando conflictos de configuración y habilitando el almacenamiento local.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Inicializar Firebase App si no existe
    if (!appInstance) {
      const existingApps = getApps();
      appInstance = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    }

    // Inicializar Auth si no existe
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }

    // Inicializar Firestore con persistencia local si no existe
    if (!firestoreInstance) {
      try {
        // Intentamos la inicialización personalizada con caché persistente
        firestoreInstance = initializeFirestore(appInstance, {
          localCache: persistentLocalCache({
            tabManager: persistentSingleTabManager()
          })
        });
      } catch (e) {
        // Si ya ha sido inicializado (común en desarrollo con Hot Reload), 
        // recuperamos la instancia existente sin lanzar error.
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
