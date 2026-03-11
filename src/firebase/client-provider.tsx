'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    if (!getApps().length) {
      const app = initializeApp(firebaseConfig);
      const firestoreInstance = getFirestore(app);

      // Activar persistencia para que funcione sin conexión
      if (typeof window !== 'undefined') {
        enableIndexedDbPersistence(firestoreInstance).catch((err) => {
          if (err.code == 'failed-precondition') {
            console.warn('Persistencia falló: múltiples pestañas abiertas.');
          } else if (err.code == 'unimplemented') {
            console.warn('Persistencia no soportada por el navegador.');
          }
        });
      }

      return {
        firebaseApp: app,
        auth: getAuth(app),
        firestore: firestoreInstance,
      };
    }
    
    const app = getApp();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
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