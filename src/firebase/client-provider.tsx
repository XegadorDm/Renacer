'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager 
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Firebase optimizado para Renacer con soporte Offline.
 * Se habilita la persistencia local para permitir el trabajo en zonas rurales sin conexión.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    const existingApps = getApps();
    const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Configuramos Firestore con persistencia local habilitada
    // persistentSingleTabManager es ideal para aplicaciones web modernas
    const firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager()
      })
    });

    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: firestore,
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
