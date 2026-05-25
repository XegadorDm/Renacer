'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager 
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * SINGLETONS GLOBALES
 * Mantenemos las instancias fuera del ciclo de vida de React para evitar 
 * el error ca9 (Internal Assertion Failed) causado por reinicializaciones del HMR.
 */
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    if (typeof window === 'undefined') {
        return { firebaseApp: null, auth: null, firestore: null };
    }

    if (!appInstance) {
      const apps = getApps();
      appInstance = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    }

    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }

    if (!firestoreInstance) {
      // Configuramos la persistencia de forma explícita una sola vez.
      // Usamos SingleTabManager para máxima estabilidad en navegadores móviles/escritorio.
      try {
          firestoreInstance = initializeFirestore(appInstance, {
            localCache: persistentLocalCache({
                tabManager: persistentSingleTabManager()
            })
          });
      } catch (e) {
          // Si ya está inicializado, recuperamos la instancia existente
          firestoreInstance = getFirestore(appInstance);
      }
    }

    return { 
      firebaseApp: appInstance, 
      auth: authInstance, 
      firestore: firestoreInstance 
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
