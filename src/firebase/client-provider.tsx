'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Firebase optimizado para Renacer.
 * Se eliminan configuraciones de persistencia local para asegurar que los permisos se sincronicen al instante.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    const existingApps = getApps();
    const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(app);

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